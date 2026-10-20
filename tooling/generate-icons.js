const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT = '/home/user/duora/app/assets/icons';
fs.mkdirSync(OUT, { recursive: true });

// Duora brand colors
const BG = [0x10, 0x0d, 0x17];
const PRIMARY = [0xb6, 0x9c, 0xff];
const SECONDARY = [0xf1, 0x9a, 0xb9];

/** Classic implicit heart: (x²+y²−1)³ − x²y³ ≤ 0 */
function inHeart(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function mix(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c2[2]) * t),
  ];
}

function radialBackground(size, base, glow) {
  const cx = size / 2;
  const cy = size / 2;
  const max = size / 2;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / max;
      const t = Math.min(1, d * d);
      const [r, g, b] = mix(glow, base, t);
      const i = (y * size + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

/** Draws two interlocking hearts into an RGBA buffer. */
function drawHearts(size, opts) {
  const { scale, offsetX, offsetY, transparentBg, whiteOnly, bgBuffer } = opts;
  const png = new PNG({ width: size, height: size });
  if (!transparentBg && bgBuffer) png.data.set(bgBuffer);

  const center = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Heart 1: secondary, shifted down-left; Heart 2: primary, shifted up-right
      const nx1 = (x - center - offsetX * size) / (scale * size);
      const ny1 = -(y - center - offsetY * size) / (scale * size);
      const nx2 = (x - center + offsetX * size) / (scale * size);
      const ny2 = -(y - center + offsetY * size) / (scale * size);
      const h1 = inHeart(nx1, ny1);
      const h2 = inHeart(nx2, ny2);
      if (h1 || h2) {
        let color = h2 ? PRIMARY : SECONDARY;
        if (h1 && h2) color = mix(PRIMARY, SECONDARY, 0.45);
        if (whiteOnly) color = [255, 255, 255];
        png.data[i] = color[0];
        png.data[i + 1] = color[1];
        png.data[i + 2] = color[2];
        png.data[i + 3] = 255;
      } else if (transparentBg) {
        png.data[i + 3] = 0;
      }
    }
  }
  return png;
}

function save(png, name) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log('wrote', file);
}

// 1. App icon, 1024 — full-bleed gradient background + mark
{
  const size = 1024;
  const bg = radialBackground(size, BG, [0x2b, 0x1f, 0x47]);
  const png = drawHearts(size, { scale: 0.3, offsetX: 0.09, offsetY: 0.09, transparentBg: false, bgBuffer: bg });
  save(png, 'icon.png');
}

// 2. Adaptive icon, 1024 — mark inside the 66% safe zone
{
  const size = 1024;
  const bg = radialBackground(size, BG, [0x24, 0x1c, 0x32]);
  const png = drawHearts(size, { scale: 0.22, offsetX: 0.07, offsetY: 0.07, transparentBg: false, bgBuffer: bg });
  save(png, 'adaptive-icon.png');
}

// 3. Splash logo — transparent, larger mark (wordmark is rendered by RN UI)
{
  const size = 512;
  const png = drawHearts(size, { scale: 0.3, offsetX: 0.09, offsetY: 0.09, transparentBg: true });
  save(png, 'splash-logo.png');
}

// 4. Notification status-bar icon — white alpha-only silhouette
{
  const size = 256;
  const png = drawHearts(size, { scale: 0.3, offsetX: 0.09, offsetY: 0.09, transparentBg: true, whiteOnly: true });
  save(png, 'notification-icon.png');
}
