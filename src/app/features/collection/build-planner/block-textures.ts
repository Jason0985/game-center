// Pixel-Texturen (16 × 16) für die Blöcke des Bauplaners. Alles wird aus der Blockfarbe
// berechnet (eigene Muster, keine Spielgrafiken): gleiche Farbe und Art ergeben immer
// dasselbe Bild, weil der Zufall aus Art + Farbe gesät wird.
import { BlockDef, TextureKind } from './build-plan.model';

export const TEX = 16;
type Rgb = [number, number, number];
type Pixels = Uint8ClampedArray;

export interface BlockTextures {
  top: Pixels;
  side: Pixels;
}

/** Textur aus dem Bauplan oder, falls die KI keine angegeben hat, aus dem Blocknamen. */
export function textureKind(def: BlockDef): TextureKind {
  if (def.texture) return def.texture;
  const name = def.name.toLowerCase();
  const rules: [RegExp, TextureKind][] = [
    [/glas|glass/, 'glass'],
    [/tür|tuer|door|falltür/, 'door'],
    [/stamm|holz\b|log|wood/, 'log'],
    [/brett|plank|treppe.*holz|holz.*(treppe|stufe)|zaun/, 'planks'],
    [/bruchstein|cobble/, 'cobblestone'],
    [/steinziegel|stone ?brick/, 'stone_bricks'],
    [/ziegel|brick/, 'bricks'],
    [/gras|grass/, 'grass'],
    [/erde|dirt|lehm/, 'dirt'],
    [/sand/, 'sand'],
    [/kies|gravel/, 'gravel'],
    [/laub|blätter|leaves/, 'leaves'],
    [/wolle|wool|teppich|beton|concrete|terrakotta/, 'wool'],
    [/eisen|gold|kupfer|iron|metall|block aus/, 'metal'],
    [/wasser|water/, 'water'],
    [/quarz|glatt|smooth/, 'smooth'],
    [/stein|stone|andesit|diorit|granit|schiefer/, 'stone'],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] ?? 'smooth';
}

export function hexToRgb(hex: string): Rgb {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const shade = (c: Rgb, f: number): Rgb => [clamp(c[0] * f), clamp(c[1] * f), clamp(c[2] * f)];
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  clamp(a[0] + (b[0] - a[0]) * t),
  clamp(a[1] + (b[1] - a[1]) * t),
  clamp(a[2] + (b[2] - a[2]) * t),
];

function rng(seedText: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasPixels(): Pixels {
  return new Uint8ClampedArray(TEX * TEX * 4);
}

function put(px: Pixels, x: number, y: number, c: Rgb, a = 255): void {
  const i = (y * TEX + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = a;
}

function fill(px: Pixels, fn: (x: number, y: number) => Rgb | [Rgb, number]): Pixels {
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const v = fn(x, y);
      if (v.length === 2 && Array.isArray(v[0])) put(px, x, y, v[0] as Rgb, v[1] as number);
      else put(px, x, y, v as Rgb);
    }
  }
  return px;
}

const DIRT: Rgb = [134, 96, 67];
const MORTAR: Rgb = [176, 170, 160];

function noisy(base: Rgb, r: () => number, amount: number): Rgb {
  return shade(base, 1 - amount + r() * amount * 2);
}

function stone(base: Rgb, r: () => number): Pixels {
  const blotch = Array.from({ length: 5 }, () => [r() * 16, r() * 16, 1.5 + r() * 2.5]);
  return fill(canvasPixels(), (x, y) => {
    let f = 0.93 + r() * 0.12;
    for (const [bx, by, br] of blotch) if (Math.hypot(x - bx, y - by) < br) f -= 0.07;
    return shade(base, f);
  });
}

function cobblestone(base: Rgb, r: () => number): Pixels {
  const seeds = Array.from({ length: 9 }, () => ({
    x: r() * 16,
    y: r() * 16,
    f: 0.82 + r() * 0.3,
  }));
  const nearest = (x: number, y: number) => {
    let best = 0;
    let bestD = Infinity;
    seeds.forEach((s, i) => {
      // Kachelbar: Abstand über die Ränder hinweg
      const dx = Math.min(Math.abs(x - s.x), 16 - Math.abs(x - s.x));
      const dy = Math.min(Math.abs(y - s.y), 16 - Math.abs(y - s.y));
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const cells: number[] = [];
  for (let y = 0; y < TEX; y++) for (let x = 0; x < TEX; x++) cells.push(nearest(x + 0.5, y + 0.5));
  const at = (x: number, y: number) => cells[((y + 16) % 16) * 16 + ((x + 16) % 16)];
  return fill(canvasPixels(), (x, y) => {
    const c = at(x, y);
    if (c !== at(x + 1, y) || c !== at(x, y + 1)) return shade(base, 0.52 + r() * 0.08);
    const edgeLight = c !== at(x - 1, y) || c !== at(x, y - 1) ? 1.12 : 1;
    return shade(base, seeds[c].f * edgeLight * (0.95 + r() * 0.1));
  });
}

function brickPattern(
  brick: Rgb,
  mortar: Rgb,
  r: () => number,
  h: number,
  w: number,
  jitter: number,
): Pixels {
  const tint = new Map<string, number>();
  return fill(canvasPixels(), (x, y) => {
    const row = Math.floor(y / h);
    const offset = row % 2 ? w / 2 : 0;
    const col = Math.floor((x + offset) / w);
    if (y % h === h - 1 || (x + offset) % w === w - 1) return noisy(mortar, r, 0.05);
    const key = `${row},${col % (16 / w)}`;
    if (!tint.has(key)) tint.set(key, 1 - jitter + r() * jitter * 2);
    const top = y % h === 0 ? 1.08 : 1;
    return shade(brick, (tint.get(key) ?? 1) * top * (0.95 + r() * 0.1));
  });
}

function planks(base: Rgb, r: () => number): Pixels {
  const boardShade = [0, 1, 2, 3].map(() => 0.92 + r() * 0.14);
  const seams = [0, 1, 2, 3].map(() => Math.floor(r() * 16));
  const grain = Array.from({ length: 16 }, () => 0.95 + r() * 0.1);
  return fill(canvasPixels(), (x, y) => {
    const board = Math.floor(y / 4);
    if (y % 4 === 3) return shade(base, 0.62);
    if (x === seams[board]) return shade(base, 0.7);
    const knot = r() < 0.025 ? 0.82 : 1;
    return shade(base, boardShade[board] * grain[y] * knot * (0.97 + r() * 0.06));
  });
}

function logSide(base: Rgb, r: () => number): Pixels {
  const col = Array.from({ length: 16 }, () => 0.8 + r() * 0.35);
  return fill(canvasPixels(), (x, y) => {
    const crack = (x * 7 + Math.floor(y / 5) * 3) % 5 === 0 && r() < 0.6;
    return shade(base, col[x] * (crack ? 0.72 : 1) * (0.95 + r() * 0.1));
  });
}

function logTop(bark: Rgb, wood: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.5) return noisy(bark, r, 0.1);
    const ring = Math.floor(d) % 2 === 0 ? 1.04 : 0.88;
    return shade(wood, ring * (0.96 + r() * 0.08));
  });
}

function grassTop(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), () => shade(base, 0.8 + r() * 0.35));
}

function grassSide(base: Rgb, r: () => number): Pixels {
  const fringe = Array.from({ length: 16 }, () => 2 + Math.floor(r() * 3));
  return fill(canvasPixels(), (x, y) =>
    y < fringe[x] ? shade(base, 0.8 + r() * 0.3) : shade(DIRT, 0.82 + r() * 0.3),
  );
}

function speckle(base: Rgb, r: () => number, spread: number, specks: number): Pixels {
  return fill(canvasPixels(), () => {
    const v = r();
    if (v < specks) return shade(base, 0.7);
    if (v > 1 - specks) return shade(base, 1.18);
    return shade(base, 1 - spread + r() * spread * 2);
  });
}

function gravel(base: Rgb, r: () => number): Pixels {
  const tones = [0.72, 0.88, 1, 1.12, 1.25];
  const grid: number[] = Array.from({ length: 64 }, () => tones[Math.floor(r() * tones.length)]);
  return fill(canvasPixels(), (x, y) =>
    shade(base, grid[Math.floor(y / 2) * 8 + Math.floor(x / 2)] * (0.95 + r() * 0.1)),
  );
}

function glass(base: Rgb): Pixels {
  const frame = mix(base, [255, 255, 255], 0.45);
  return fill(canvasPixels(), (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [frame, 235];
    // Zwei helle Lichtreflexe schräg über die Scheibe
    const d = x + y;
    if ((d >= 6 && d <= 7) || (d >= 10 && d <= 10 && x > 3)) return [[255, 255, 255], 170];
    return [base, 60];
  });
}

function leaves(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), () => {
    const v = r();
    if (v < 0.14) return shade(base, 0.45);
    if (v > 0.9) return shade(base, 1.25);
    return shade(base, 0.8 + r() * 0.3);
  });
}

function wool(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    const curl = Math.sin(x * 1.3 + Math.sin(y * 0.9) * 2) * 0.05;
    return shade(base, 0.95 + curl + r() * 0.06);
  });
}

function door(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return shade(base, 0.6);
    if (x === 1 || y === 1) return shade(base, 1.12);
    // Senkrechte Bretter, Griff rechts
    if (x % 5 === 0) return shade(base, 0.75);
    if (x === 12 && (y === 8 || y === 9)) return [40, 40, 40];
    return shade(base, 0.92 + r() * 0.12);
  });
}

function metal(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    if (x === 0 || y === 0) return shade(base, 1.22);
    if (x === 15 || y === 15) return shade(base, 0.72);
    const stripe = (x + y) % 9 === 0 ? 1.08 : 1;
    return shade(base, stripe * (0.98 + r() * 0.04));
  });
}

function smooth(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    if (x === 0 || y === 0) return shade(base, 1.08);
    if (x === 15 || y === 15) return shade(base, 0.86);
    return shade(base, 0.97 + r() * 0.06);
  });
}

function water(base: Rgb, r: () => number): Pixels {
  return fill(canvasPixels(), (x, y) => {
    const wave = Math.sin((x + y * 2) * 0.7) > 0.75 ? 1.2 : 1;
    return [shade(base, wave * (0.93 + r() * 0.1)), 200];
  });
}

const cache = new Map<string, BlockTextures>();

export function blockTextures(def: BlockDef): BlockTextures {
  const kind = textureKind(def);
  const side = hexToRgb(def.color);
  const top = def.top ? hexToRgb(def.top) : shade(side, 1.08);
  const key = `${kind}|${def.color}|${def.top ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(key);
  let result: BlockTextures;
  switch (kind) {
    case 'planks':
      result = { side: planks(side, r), top: planks(top, r) };
      break;
    case 'log':
      result = { side: logSide(side, r), top: logTop(side, top, r) };
      break;
    case 'cobblestone':
      result = { side: cobblestone(side, r), top: cobblestone(top, r) };
      break;
    case 'stone':
      result = { side: stone(side, r), top: stone(top, r) };
      break;
    case 'stone_bricks':
      result = {
        side: brickPattern(side, shade(side, 0.62), r, 8, 16, 0.05),
        top: brickPattern(top, shade(top, 0.62), r, 8, 16, 0.05),
      };
      break;
    case 'bricks':
      result = {
        side: brickPattern(side, MORTAR, r, 4, 8, 0.1),
        top: brickPattern(top, MORTAR, r, 4, 8, 0.1),
      };
      break;
    case 'grass':
      result = { side: grassSide(top, r), top: grassTop(top, r) };
      break;
    case 'dirt':
      result = { side: speckle(side, r, 0.12, 0.08), top: speckle(top, r, 0.12, 0.08) };
      break;
    case 'sand':
      result = { side: speckle(side, r, 0.05, 0.04), top: speckle(top, r, 0.05, 0.04) };
      break;
    case 'gravel':
      result = { side: gravel(side, r), top: gravel(top, r) };
      break;
    case 'glass':
      result = { side: glass(side), top: glass(top) };
      break;
    case 'leaves':
      result = { side: leaves(side, r), top: leaves(top, r) };
      break;
    case 'wool':
      result = { side: wool(side, r), top: wool(top, r) };
      break;
    case 'door':
      result = { side: door(side, r), top: planks(side, r) };
      break;
    case 'metal':
      result = { side: metal(side, r), top: metal(top, r) };
      break;
    case 'water':
      result = { side: water(side, r), top: water(top, r) };
      break;
    default:
      result = { side: smooth(side, r), top: smooth(top, r) };
  }
  cache.set(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Browser: Canvas und Data-URLs (für das Raster der Ebenen)
// ---------------------------------------------------------------------------

const canvasCache = new WeakMap<Pixels, HTMLCanvasElement>();

export function pixelsToCanvas(px: Pixels): HTMLCanvasElement | null {
  const hit = canvasCache.get(px);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(TEX, TEX);
  image.data.set(px);
  ctx.putImageData(image, 0, 0);
  canvasCache.set(px, canvas);
  return canvas;
}

const urlCache = new Map<string, string>();

export function textureUrl(def: BlockDef, face: 'top' | 'side' = 'top'): string {
  const key = `${def.texture ?? textureKind(def)}|${def.color}|${def.top ?? ''}|${face}`;
  const hit = urlCache.get(key);
  if (hit !== undefined) return hit;
  const canvas = pixelsToCanvas(blockTextures(def)[face]);
  let url = '';
  try {
    url = canvas ? canvas.toDataURL('image/png') : '';
  } catch {
    url = '';
  }
  urlCache.set(key, url);
  return url;
}
