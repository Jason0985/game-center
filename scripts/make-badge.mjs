// Erzeugt public/icons/badge-96.png: das kleine Symbol in der Android-Statusleiste bei
// Push-Nachrichten. Android nutzt davon nur die Transparenz (weiße Silhouette), daher die
// Form des App-Icons (Treppchen mit Stern) ohne Farben und etwas kräftiger als im Icon.
// Aufruf: node scripts/make-badge.mjs
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const SIZE = 96;
const SCALE = SIZE / 24; // entworfen auf dem 24er-Raster von Android
const SAMPLES = 4; // Kantenglättung: 4×4 Abtastpunkte je Pixel

const star = Array.from({ length: 10 }, (_, i) => {
  const angle = -Math.PI / 2 + (i * Math.PI) / 5;
  const radius = i % 2 ? 2.05 : 4.7;
  return [12 + radius * Math.cos(angle), 5.9 + radius * Math.sin(angle)];
});
const blocks = [
  [2, 14.5, 8, 22], // links
  [9, 11.5, 15, 22], // Mitte
  [16, 16.5, 22, 22], // rechts
];

function inStar(x, y) {
  let inside = false;
  for (let i = 0, j = star.length - 1; i < star.length; j = i++) {
    const [xi, yi] = star[i];
    const [xj, yj] = star[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inShape = (x, y) =>
  inStar(x, y) || blocks.some(([x1, y1, x2, y2]) => x >= x1 && x < x2 && y >= y1 && y < y2);

// Zeilen mit Filterbyte 0, Pixel RGBA weiß mit Deckkraft = Flächenanteil
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let py = 0; py < SIZE; py++) {
  const row = py * (SIZE * 4 + 1);
  for (let px = 0; px < SIZE; px++) {
    let hits = 0;
    for (let sy = 0; sy < SAMPLES; sy++) {
      for (let sx = 0; sx < SAMPLES; sx++) {
        const x = (px + (sx + 0.5) / SAMPLES) / SCALE;
        const y = (py + (sy + 0.5) / SAMPLES) / SCALE;
        if (inShape(x, y)) hits++;
      }
    }
    raw.fill(255, row + 1 + px * 4, row + 4 + px * 4);
    raw[row + 4 + px * 4] = Math.round((255 * hits) / SAMPLES ** 2);
  }
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 8; // Bit je Kanal
header[9] = 6; // RGBA

const file = new URL('../public/icons/badge-96.png', import.meta.url);
writeFileSync(
  file,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log(`geschrieben: ${file.pathname}`);
