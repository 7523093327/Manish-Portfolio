import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(
  new URL('../outputs/interface-workshop-hero.html', import.meta.url),
  'utf8'
);

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}()`);
  assert.notEqual(start, -1, `finds ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

class TestClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }
}

function makeModule(isActive = false) {
  const listeners = new Map();
  const layerListeners = new Map();
  const layer = {
    addEventListener(type, listener) {
      layerListeners.set(type, listener);
    }
  };
  return {
    classList: new TestClassList(isActive ? ['is-active'] : []),
    offsetWidth: 396,
    attributes: new Map(),
    listeners,
    layerListeners,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    querySelector(selector) {
      return selector === '.service-module__on' ? layer : null;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    }
  };
}

function makeNeedle() {
  const activeAnimations = [];
  const animationCalls = [];
  const needle = {
    dataset: { angle: '0' },
    style: { transform: 'rotate(0deg)' },
    computedTransform: 'none',
    animationCalls,
    animate(keyframes, options) {
      let resolveFinished;
      let rejectFinished;
      const finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      const animation = {
        keyframes,
        options,
        finished,
        canceled: false,
        cancel() {
          this.canceled = true;
          const index = activeAnimations.indexOf(this);
          if (index >= 0) activeAnimations.splice(index, 1);
          rejectFinished(new Error('animation canceled'));
        },
        finish() {
          const index = activeAnimations.indexOf(this);
          if (index >= 0) activeAnimations.splice(index, 1);
          resolveFinished();
        }
      };
      activeAnimations.push(animation);
      animationCalls.push(animation);
      return animation;
    },
    getAnimations() {
      return [...activeAnimations];
    }
  };
  return needle;
}

function makeHarness({ prefersReducedMotion = false } = {}) {
  const modules = Array.from({ length: 6 }, (_, index) => makeModule(index === 0));
  const needles = Array.from({ length: 3 }, () => makeNeedle());
  const knobs = {
    snapshotSources: [],
    set src(value) {
      this.snapshotSources.push(value);
    },
    querySelectorAll(selector) {
      return selector === '.service-knob__needle' ? needles : [];
    }
  };
  const screen = { classList: new TestClassList(), offsetWidth: 689 };
  const content = {
    src: '../Service animation/Product design.svg',
    alt: 'Product Design service details',
    classList: new TestClassList(),
    style: { setProperty() {} }
  };
  const board = {
    classList: new TestClassList(),
    querySelector(selector) {
      if (selector === '.service-screen') return screen;
      if (selector === '.service-screen__content') return content;
      if (selector === '.service-knobs') return knobs;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '.service-module' ? modules : [];
    }
  };
  let nextTimerId = 1;
  const timers = new Map();
  const delays = new Map();
  const getComputedStyle = (needle) => ({
    transform: needle.computedTransform === 'none'
      ? needle.style.transform || 'none'
      : needle.computedTransform
  });
  const context = {
    Image: class { set src(value) {} },
    document: {
      querySelector(selector) {
        return selector === '[data-service-switchboard]' ? board : null;
      }
    },
    getComputedStyle,
    reducedMotion: { matches: prefersReducedMotion },
    requestAnimationFrame(callback) {
      callback();
    },
    window: {
      getComputedStyle,
      clearTimeout(id) {
        timers.delete(id);
        delays.delete(id);
      },
      setTimeout(callback, delay) {
        const id = nextTimerId;
        nextTimerId += 1;
        timers.set(id, callback);
        delays.set(id, delay);
        return id;
      }
    }
  };

  const functionSource = extractNamedFunction(html, 'initServiceSwitchboard');
  vm.runInNewContext(`${functionSource}; initServiceSwitchboard();`, context);
  return { modules, needles, knobs, timers, delays };
}

function runTimerAt(harness, delay) {
  const timer = [...harness.delays].find(([, timerDelay]) => timerDelay === delay);
  assert.ok(timer, `schedules a ${delay}ms timer`);
  harness.timers.get(timer[0])();
}

function rotationDegrees(keyframe) {
  const match = keyframe.transform.match(/^rotate\((-?[\d.]+)deg\)$/);
  assert.ok(match, `reads a rotation from ${keyframe.transform}`);
  return Number(match[1]);
}

const inlineKnobs = html.match(/<svg class="service-knobs"[^>]*viewBox="0 0 195 56"[\s\S]*?<\/svg>/);
assert.ok(inlineKnobs, 'renders the knob assembly as one inline 195 by 56 SVG');
assert.equal(
  (inlineKnobs[0].match(/class="service-knob__needle"/g) ?? []).length,
  3,
  'renders exactly three independently rotatable needles'
);

const geometry = html.match(
  /\.service-knobs\{[^}]*left:([\d.]+)%;[^}]*top:([\d.]+)%;[^}]*width:([\d.]+)%/
);
assert.ok(geometry, 'keeps responsive knob overlay geometry');
assert.ok(Math.abs(Number(geometry[1]) / 100 * 1510 - 1171.142) < 0.01, 'keeps horizontal alignment');
assert.ok(Math.abs(Number(geometry[2]) / 100 * 818 - 714.735) < 0.01, 'keeps vertical alignment');
assert.ok(Math.abs(Number(geometry[3]) / 100 * 1510 - 195) < 0.01, 'keeps the 195-unit width');

const harness = makeHarness();
assert.equal(harness.knobs.snapshotSources.length, 0, 'does not swap complete knob snapshots');
assert.equal(harness.needles.every((needle) => needle.animationCalls.length === 1), true, 'starts one smooth animation per needle');

const initialLeft = harness.needles[0].animationCalls[0];
assert.equal(initialLeft.options.duration, 2350, 'matches the module fill duration');
assert.equal(initialLeft.options.fill, 'forwards', 'holds the landed needle state through handoff');
assert.equal(initialLeft.keyframes[0].transform, 'rotate(0deg)', 'starts Product Design upright');
assert.equal(initialLeft.keyframes.at(-1).transform, 'rotate(-45deg)', 'travels toward UX Research during the fill');
assert.equal(initialLeft.keyframes[0].easing, 'cubic-bezier(0.2, 0, 0, 1)', 'uses restrained mechanical easing');

harness.needles[0].computedTransform = 'matrix(0.965926, 0.258819, -0.258819, 0.965926, 0, 0)';
harness.needles[1].computedTransform = 'matrix(1, 0, 0, 1, 0, 0)';
harness.needles[2].computedTransform = 'matrix(1, 0, 0, 1, 0, 0)';
harness.modules[3].listeners.get('click')();

const clickedLeft = harness.needles[0].animationCalls.at(-1);
assert.ok(
  Math.abs(rotationDegrees(clickedLeft.keyframes[0]) - 15) < 0.001,
  'an interrupted click starts at the visible needle angle'
);
assert.equal(clickedLeft.keyframes[1].transform, 'rotate(-120deg)', 'catches up to clicked Design Systems state');
assert.ok(
  Math.abs(clickedLeft.keyframes[1].offset - 240 / 2350) < 1e-9,
  'lands on the clicked state at the 240ms glitch boundary'
);
assert.equal(clickedLeft.keyframes[1].easing, 'cubic-bezier(0.2, 0, 0, 1)', 'eases the post-catch-up segment independently');
assert.equal(clickedLeft.keyframes[2].transform, 'rotate(-240deg)', 'continues toward Website Design before handoff');

const autoHarness = makeHarness();
autoHarness.needles.forEach((needle, index) => {
  needle.computedTransform = [
    'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)',
    'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)',
    'matrix(0.258819, 0.965926, -0.965926, 0.258819, 0, 0)'
  ][index];
});
autoHarness.modules[0].layerListeners.get('animationend')({ animationName: 'service-module-led-wipe' });
runTimerAt(autoHarness, 160);
assert.equal(
  autoHarness.needles[0].animationCalls.at(-1).keyframes.length,
  2,
  'automatic handoff continues directly without a click catch-up keyframe'
);
assert.equal(
  autoHarness.needles[0].animationCalls.at(-1).keyframes.at(-1).transform,
  'rotate(60deg)',
  'automatic UX Research state travels toward UI Design'
);

const reducedMotionHarness = makeHarness({ prefersReducedMotion: true });
assert.equal(
  reducedMotionHarness.needles.every((needle) => needle.animationCalls.length === 0),
  true,
  'reduced motion starts no needle animations'
);
reducedMotionHarness.modules[2].listeners.get('click')();
assert.deepEqual(
  reducedMotionHarness.needles.map((needle) => needle.style.transform),
  ['rotate(60deg)', 'rotate(-30deg)', 'rotate(-45deg)'],
  'reduced motion sets the selected service endpoint immediately'
);
