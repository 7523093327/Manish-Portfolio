import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../outputs/heatmap-motion-study.html', import.meta.url), 'utf8');

assert.match(html, /Standalone Motion Study/, 'labels the study as separate from the portfolio');
assert.match(html, /class="heat-cell/, 'uses individually animated heatmap cells');
assert.match(html, /@keyframes cell-arrive/, 'defines a staged cell entrance');
assert.match(html, /@keyframes crosshair-draw/, 'defines a purposeful guide-line reveal');
assert.match(html, /id="replay-study"/, 'provides a replay control');
assert.match(html, /prefers-reduced-motion:\s*reduce/, 'respects reduced-motion preferences');

console.log('Heatmap motion study acceptance checks passed.');
