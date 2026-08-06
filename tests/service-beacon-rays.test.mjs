import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const machinePath = fileURLToPath(new URL('../Service animation/services.svg', import.meta.url));
const { data, info } = await sharp(machinePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

function alphaAt(x, y) {
  return data[(y * info.width + x) * info.channels + 3];
}

for (const [x, y, name] of [
  [39, 34, 'left diagonal ray'],
  [133, 34, 'right diagonal ray'],
  [86, 8, 'vertical ray']
]) {
  assert.equal(alphaAt(x, y), 0, `${name} is absent from the rendered machine`);
}
