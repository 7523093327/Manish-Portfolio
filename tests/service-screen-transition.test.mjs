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

function makeHarness({ prefersReducedMotion = false } = {}) {
  const modules = Array.from({ length: 6 }, (_, index) => makeModule(index === 0));
  const screen = { classList: new TestClassList(), offsetWidth: 689 };
  const content = {
    src: '../Service animation/Product design.svg',
    alt: 'Product Design service details',
    classList: new TestClassList(),
    style: {
      '--content-width': '64.73%',
      setProperty(name, value) {
        this[name] = value;
      }
    }
  };
  const needles = Array.from({ length: 3 }, () => ({
    dataset: { angle: '0' },
    style: { transform: 'rotate(0deg)' },
    animate() {
      return {
        cancel() {},
        finished: new Promise(() => {})
      };
    },
    getAnimations() {
      return [];
    }
  }));
  const knobs = {
    querySelectorAll(selector) {
      return selector === '.service-knob__needle' ? needles : [];
    }
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
  const context = {
    Image: class { set src(value) {} },
    document: {
      querySelector(selector) {
        return selector === '[data-service-switchboard]' ? board : null;
      }
    },
    getComputedStyle(needle) {
      return { transform: needle.style.transform || 'none' };
    },
    reducedMotion: { matches: prefersReducedMotion },
    requestAnimationFrame(callback) {
      callback();
    },
    window: {
      getComputedStyle(needle) {
        return { transform: needle.style.transform || 'none' };
      },
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
  return { modules, screen, content, knobs, timers, delays };
}

function runTimerAt(harness, delay) {
  const timer = [...harness.delays].find(([, timerDelay]) => timerDelay === delay);
  assert.ok(timer, `schedules a ${delay}ms timer`);
  harness.timers.get(timer[0])();
}

const reducedMotionHarness = makeHarness({ prefersReducedMotion: true });
reducedMotionHarness.modules[2].listeners.get('click')();
assert.equal(reducedMotionHarness.timers.size, 0, 'reduced motion schedules no content transition');
assert.equal(
  reducedMotionHarness.content.src,
  '../Service animation/UI Design.svg',
  'reduced motion swaps the selected content immediately'
);
assert.equal(
  reducedMotionHarness.content.style['--content-width'],
  '67.02%',
  'reduced motion applies the normalized UI Design width'
);

const harness = makeHarness();
assert.equal(harness.timers.size, 0, 'initial service renders without a channel glitch');

harness.modules[0].listeners.get('click')();
assert.equal(harness.timers.size, 0, 'clicking the active service does not glitch unchanged content');

harness.modules[2].listeners.get('click')();
assert.equal(harness.screen.classList.contains('is-switching'), true, 'starts screen signal loss');
assert.equal(harness.content.classList.contains('is-changing'), true, 'starts content jitter');
assert.equal(
  harness.content.src,
  '../Service animation/Product design.svg',
  'keeps outgoing content before the midpoint'
);
assert.equal(
  harness.content.style['--content-width'],
  '64.73%',
  'keeps outgoing width before the midpoint'
);

runTimerAt(harness, 120);
assert.equal(
  harness.content.src,
  '../Service animation/UI Design.svg',
  'swaps UI Design at the 120ms signal-loss midpoint'
);
assert.equal(
  harness.content.style['--content-width'],
  '67.02%',
  'applies the normalized UI Design width with its source swap'
);

runTimerAt(harness, 240);
assert.equal(harness.screen.classList.contains('is-switching'), false, 'cleans screen state at 240ms');
assert.equal(harness.content.classList.contains('is-changing'), false, 'cleans content state at 240ms');

harness.modules[1].listeners.get('click')();
harness.modules[4].listeners.get('click')();
runTimerAt(harness, 120);
assert.equal(
  harness.content.src,
  '../Service animation/Website Design.svg',
  'the latest rapid selection wins'
);
