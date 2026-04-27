const sharp = require('sharp');
const path = require('path');

const dir = __dirname;
const posts = [
  'post1-product-hunt',
  'post2-payment',
  'post3-response',
  'post4-contract',
];

async function run() {
  for (const name of posts) {
    const svg = path.join(dir, `${name}.svg`);
    const jpg = path.join(dir, `${name}.jpg`);
    await sharp(svg)
      .resize(1080, 1080)
      .jpeg({ quality: 95 })
      .toFile(jpg);
    console.log(`done: ${name}.jpg`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
