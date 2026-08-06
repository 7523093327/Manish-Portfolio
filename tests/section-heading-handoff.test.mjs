import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../outputs/interface-workshop-hero.html', import.meta.url), 'utf8');

assert.equal(
  (html.match(/class="services-section__header"/g) ?? []).length,
  1,
  'renders one Services heading'
);
assert.match(
  html,
  /<section class="services-section" id="services" aria-labelledby="services-title">/,
  'labels the Services section from its visible heading'
);
assert.match(
  html,
  /<h2 class="services-section__heading" id="services-title">/,
  'uses a semantic Services heading'
);
assert.match(
  html,
  /<svg class="services-section__heading-icon" viewBox="0 0 60 60"[^>]*>[\s\S]*?<path[^>]+fill="currentColor"/,
  'uses the same 60px eight-ray icon geometry as Featured Work'
);
assert.match(
  html,
  /\.services-section__header\{position:static;top:auto;z-index:auto;isolation:auto\}/,
  'keeps Services in normal flow with the switchboard'
);
assert.match(
  html,
  /\.services-section__header\{[^}]*margin:0 0 46px calc\(clamp\(22px,5vw,76px\) \+ clamp\(0px,4vw,80px\)\)/,
  'preserves the shared horizontal coordinate and spacing'
);
assert.match(
  html,
  /\.services-section__header::before\{display:none\}/,
  'removes the unnecessary full-width Services heading overlay'
);
assert.match(
  html,
  /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.featured-work-header,.services-section__header\{position:static;transform:none!important\}/,
  'keeps both headings in normal flow for reduced motion'
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

const featuredHeader = { name: 'featured-header' };
const zenskar = { name: 'zenskar-card' };
const scrollTrigger = { name: 'ScrollTrigger' };
const captured = {};
const motion = {
  registerPlugin(plugin) {
    captured.plugin = plugin;
  },
  matchMedia() {
    return {
      add(query, setup) {
        captured.mediaQuery = query;
        captured.mediaResult = setup();
      }
    };
  },
  to(target, vars) {
    captured.target = target;
    captured.vars = vars;
    return { kill() {} };
  }
};
const context = {
  document: {
    querySelector(selector) {
      if (selector === '.featured-work-header') return featuredHeader;
      if (selector === '.work-card--zenskar') return zenskar;
      return null;
    }
  },
  window: {
    gsap: motion,
    ScrollTrigger: scrollTrigger,
    innerHeight: 800
  }
};

const functionSource = extractNamedFunction(html, 'initSectionHeadingHandoff');
vm.runInNewContext(`${functionSource}; initSectionHeadingHandoff();`, context);

assert.equal(captured.plugin, scrollTrigger, 'registers the available ScrollTrigger plugin');
assert.equal(
  captured.mediaQuery,
  '(min-width: 701px) and (prefers-reduced-motion: no-preference)',
  'limits the handoff to desktop users without reduced motion'
);
assert.equal(captured.target, featuredHeader, 'moves the Featured Work heading');
assert.equal(captured.vars.ease, 'none', 'maps heading movement directly to scroll');
assert.equal(captured.vars.scrollTrigger.trigger, zenskar, 'uses Zenskar as the handoff trigger');
assert.equal(captured.vars.scrollTrigger.start, 'top 40%', 'releases while Zenskar is in focus');
assert.equal(captured.vars.scrollTrigger.end, 'top -100px', 'moves the heading fully out with Zenskar');
assert.equal(captured.vars.scrollTrigger.scrub, true, 'keeps heading and card synchronized');
assert.equal(captured.vars.scrollTrigger.invalidateOnRefresh, true, 'recalculates after viewport changes');
assert.equal(captured.vars.y(), -420, 'matches the 420px scroll range for an 800px viewport');

const fallbackContext = {
  document: { querySelector() { return null; } },
  window: { innerHeight: 800 }
};
assert.doesNotThrow(
  () => vm.runInNewContext(`${functionSource}; initSectionHeadingHandoff();`, fallbackContext),
  'keeps native layout when handoff dependencies are unavailable'
);
