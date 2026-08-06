import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../outputs/interface-workshop-hero.html', import.meta.url), 'utf8');

assert.equal(
  (html.match(/class="service-beacon"/g) ?? []).length,
  1,
  'renders one persistent beacon overlay'
);
assert.match(
  html,
  /class="service-beacon"[^>]+top-beacon-on\.svg/,
  'uses the supplied glowing beacon asset'
);
assert.match(
  html,
  /\.service-beacon\{[^}]*left:2\.242%;[^}]*top:-2\.423%;[^}]*width:6\.954%/,
  'aligns the larger glow canvas over the beacon baked into the machine'
);
assert.match(
  html,
  /\.services-switchboard\.is-beacon-on \.service-beacon\{opacity:1/,
  'turns the persistent beacon overlay on with a board state class'
);
assert.match(html, /const beaconHandoffMs = 160;/, 'uses the approved 160ms off handoff');
assert.match(
  html,
  /window\.clearTimeout\(beaconHandoffTimer\)/,
  'cancels a pending automatic handoff when a service is selected'
);
assert.match(
  html,
  /board\.classList\.remove\('is-beacon-on'\)/,
  'switches the beacon off between module fills'
);
assert.match(
  html,
  /beaconHandoffTimer = window\.setTimeout\(\(\) => setActive\(\(activeServiceIndex \+ 1\) % services\.length\), beaconHandoffMs\)/,
  'activates the next service after the visible beacon-off handoff'
);
assert.match(
  html,
  /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.services-switchboard\.is-beacon-on \.service-beacon\{animation:none;opacity:1/,
  'keeps the beacon stable for reduced motion'
);
