import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(
  new URL('../outputs/interface-workshop-hero.html', import.meta.url),
  'utf8'
);
const compact = html.replace(/\s+/g, '');

function occurrences(pattern) {
  return (html.match(pattern) ?? []).length;
}

function extractBlock(source, marker, { last = false } = {}) {
  const start = last ? source.lastIndexOf(marker) : source.indexOf(marker);
  assert.notEqual(start, -1, `finds ${marker}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${marker}`);
}

assert.equal(occurrences(/class="service-screen__base"/g), 1, 'renders one flat normal screen');
assert.equal(occurrences(/class="service-screen__glitch-base"/g), 1, 'renders one dark glitch screen');
assert.equal(occurrences(/class="service-screen__shine-track"/g), 1, 'renders one moving shine track');
assert.equal(occurrences(/class="service-screen__shine"/g), 1, 'renders one visible shine layer');
assert.equal(occurrences(/class="service-screen__reflection"/g), 0, 'does not render a duplicate reflection image');

assert.match(
  compact,
  /\.service-screen__base\{[^}]*background:linear-gradient\(/,
  'uses one flat CSS screen base without baked-in static reflection stripes'
);
assert.match(
  html,
  /class="service-screen__glitch-base"[^>]+src="\.\.\/Service animation\/Normal screen\.svg"/,
  'uses the visually dark asset only for the glitch despite its filename'
);
assert.doesNotMatch(html, /Screen reflection\.svg/, 'does not translate the full-screen reflection SVG');

assert.doesNotMatch(compact, /\.service-screen::before\{/, 'removes the incomplete generated reflection');
assert.match(compact, /\.service-screen__base\{[^}]*z-index:0/, 'keeps the normal screen below all content');
assert.match(compact, /\.service-screen__glitch-base\{[^}]*z-index:1/, 'keeps the dark flicker above the normal screen');
assert.match(compact, /\.service-screen__shine-track\{[^}]*z-index:2/, 'keeps shine below service content');
assert.match(compact, /\.service-screen__content\{[^}]*z-index:3/, 'keeps service content readable above shine');
assert.match(compact, /\.service-screen::after\{[^}]*z-index:4/, 'keeps the signal overlay above screen content');
assert.match(
  compact,
  /\.service-screen\{[^}]*overflow:hidden;[^}]*clip-path:inset\(0round2\.5%\)/,
  'clips the shine to the rounded screen edges'
);

assert.match(
  compact,
  /\.service-screen__shine-track\{[^}]*opacity:\.16;[^}]*transform:translate3d\(160%,0,0\)rotate\(35deg\)/,
  'keeps one restrained diagonal shine in a fixed position'
);

assert.doesNotMatch(compact, /service-screen-shine-sweep/, 'does not animate the static shine');

assert.match(
  compact,
  /\.service-screen\.is-switching\.service-screen__glitch-base\{animation:service-screen-dark-flicker\.24ssteps\(1,end\)both\}/,
  'synchronizes the dark screen to the 240ms channel switch'
);
assert.doesNotMatch(compact, /service-screen-shine-flicker/, 'does not animate the shine during service changes');

const darkFlicker = extractBlock(compact, '@keyframesservice-screen-dark-flicker');
assert.equal(
  (darkFlicker.match(/opacity:\.(?:92|78|9)/g) ?? []).length,
  3,
  'shows exactly three dark-screen pulses'
);

const reducedMotion = extractBlock(compact, '@media(prefers-reduced-motion:reduce)', { last: true });
assert.match(
  reducedMotion,
  /\.service-screen__glitch-base\{animation:none!important;opacity:0\}/,
  'reduced motion keeps the dark glitch screen hidden'
);
