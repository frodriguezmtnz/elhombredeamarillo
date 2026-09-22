import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/assets/favicon.svg');

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);

  console.log(`Generated icon-${size}.png`);
}

console.log('Done!');
