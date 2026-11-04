// Isometrische 3D-Ansicht mit Pixel-Texturen: jede sichtbare Fläche wird als Parallelogramm
// mit ihrer Textur gezeichnet (affine Transformation), seitlich abgedunkelt wie bei Tageslicht.
// Unter dem Bau liegt eine kleine Graswiese als Sockel.
import { BlockDef, BuildPlan, PlacedBlock, PlanAnalysis, blockKey } from './build-plan.model';
import { TEX, blockTextures, pixelsToCanvas, textureKind } from './block-textures';

export type BlockMode = 'normal' | 'dim' | 'current' | 'hidden';

export interface IsoOptions {
  rotation: number;
  mode: (block: PlacedBlock) => BlockMode;
  maxHeight: number;
  ground?: boolean;
  highlight: string;
  dimColor: string;
  // Kleine Vorschau (Liste): weniger Rand, keine Konturen
  compact?: boolean;
}

type Point = [number, number];
type Box = [number, number, number, number, number, number];

const C30 = Math.cos(Math.PI / 6);
const GROUND_MARGIN = 1;
const GROUND_DEPTH = 0.4;
const GRASS: BlockDef = { name: 'Gras', color: '#866043', top: '#5f9e3c', texture: 'grass' };

export function rotXZ(x: number, z: number, W: number, D: number, r: number): [number, number] {
  return r === 0
    ? [x, z]
    : r === 1
      ? [D - 1 - z, x]
      : r === 2
        ? [W - 1 - x, D - 1 - z]
        : [z, W - 1 - x];
}

function rotDir(dx: number, dz: number, r: number): [number, number] {
  return r === 0 ? [dx, dz] : r === 1 ? [-dz, dx] : r === 2 ? [-dx, -dz] : [dz, -dx];
}

type Connects = (dx: number, dz: number) => boolean;

// Teilquader einer Zelle (0–1), schon in gedrehten Koordinaten
function boxesFor(def: BlockDef, r: number, connects: Connects = () => false): Box[] {
  const top = def.half === 'top';
  switch (def.shape) {
    case 'slab':
      return [[0, 0, 0, 1, 0.5, 1]];
    case 'slab_top':
      return [[0, 0.5, 0, 1, 1, 1]];
    case 'carpet':
      return [[0, 0, 0, 1, 0.0625, 1]];
    case 'trapdoor':
      return [top ? [0, 0.8125, 0, 1, 1, 1] : [0, 0, 0, 1, 0.1875, 1]];
    case 'small':
      return [[0.3125, 0, 0.3125, 0.6875, 0.5625, 0.6875]];
    case 'fence':
      return [[0.375, 0, 0.375, 0.625, 1, 0.625], ...arms(connects, 0.4375, 0.5625, 0.375, 0.9375)];
    case 'wall':
      return [[0.25, 0, 0.25, 0.75, 1, 0.75], ...arms(connects, 0.3125, 0.6875, 0, 0.8125)];
    case 'pane': {
      let list = arms(connects, 0.4375, 0.5625, 0, 1);
      if (!list.length) {
        // Alleinstehend: verläuft in dir (gedreht), Standard quer von links nach rechts
        const [dx] = rotDir(def.dir?.[0] ?? 1, def.dir?.[1] ?? 0, r);
        list =
          dx !== 0
            ? arms(() => true, 0.4375, 0.5625, 0, 1, 'x')
            : arms(() => true, 0.4375, 0.5625, 0, 1, 'z');
      }
      return [[0.4375, 0, 0.4375, 0.5625, 1, 0.5625], ...list];
    }
    case 'stair': {
      const [dx, dz] = rotDir(def.dir?.[0] ?? 0, def.dir?.[1] ?? 1, r);
      const high: Box =
        dz === 1
          ? [0, 0.5, 0.5, 1, 1, 1]
          : dz === -1
            ? [0, 0.5, 0, 1, 1, 0.5]
            : dx === 1
              ? [0.5, 0.5, 0, 1, 1, 1]
              : [0, 0.5, 0, 0.5, 1, 1];
      if (!top) return [[0, 0, 0, 1, 0.5, 1], high];
      // Umgedreht: volle obere Hälfte, Viertel unten auf der hohen Seite
      return [
        [high[0], 0, high[2], high[3], 0.5, high[5]],
        [0, 0.5, 0, 1, 1, 1],
      ];
    }
    default:
      return [[0, 0, 0, 1, 1, 1]];
  }
}

/** Verbindungsstücke von der Mitte zu den Nachbarn (Zaun, Mauer, Scheibe). */
function arms(
  connects: Connects,
  lo: number,
  hi: number,
  y0: number,
  y1: number,
  only?: 'x' | 'z',
): Box[] {
  const list: Box[] = [];
  if (only !== 'z' && connects(-1, 0)) list.push([0, y0, lo, 0.5, y1, hi]);
  if (only !== 'x' && connects(0, -1)) list.push([lo, y0, 0, hi, y1, 0.5]);
  if (only !== 'z' && connects(1, 0)) list.push([0.5, y0, lo, 1, y1, hi]);
  if (only !== 'x' && connects(0, 1)) list.push([lo, y0, 0.5, hi, y1, 1]);
  return list;
}

const isFull = (def: BlockDef) => !def.shape || def.shape === 'block';
const isOpaque = (def: BlockDef) =>
  isFull(def) &&
  !def.glass &&
  !def.alpha &&
  !['glass', 'leaves', 'water'].includes(textureKind(def));

export function drawIso(
  canvas: HTMLCanvasElement,
  plan: BuildPlan,
  analysis: PlanAnalysis,
  options: IsoOptions,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const r = ((options.rotation % 4) + 4) % 4;
  const rw = r % 2 ? analysis.D : analysis.W;
  const rd = r % 2 ? analysis.W : analysis.D;
  const H = Math.max(1, analysis.H);
  const ground = options.ground !== false;
  const m = ground ? GROUND_MARGIN : 0;

  // Ausdehnung in Einheiten (vor der Skalierung) aus den Ecken des Gesamtquaders
  const unit = (x: number, y: number, z: number): Point => [(x - z) * C30, (x + z) * 0.5 - y];
  const corners: Point[] = [];
  for (const x of [-m, rw + m]) {
    for (const z of [-m, rd + m]) {
      for (const y of [ground ? -GROUND_DEPTH : 0, H]) corners.push(unit(x, y, z));
    }
  }
  const minX = Math.min(...corners.map((p) => p[0]));
  const maxX = Math.max(...corners.map((p) => p[0]));
  const minY = Math.min(...corners.map((p) => p[1]));
  const maxY = Math.max(...corners.map((p) => p[1]));

  const pad = options.compact ? 4 : 20;
  const cssW = canvas.parentElement?.clientWidth || canvas.clientWidth || 320;
  let s = (cssW - pad * 2) / (maxX - minX);
  if ((maxY - minY) * s + pad * 2 > options.maxHeight)
    s = (options.maxHeight - pad * 2) / (maxY - minY);
  s = Math.min(s, options.compact ? 30 : 48);
  const cssH = Math.round((maxY - minY) * s + pad * 2);
  const dpr = globalThis.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = `${cssH}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.imageSmoothingEnabled = false;

  const ox = (cssW - (maxX - minX) * s) / 2 - minX * s;
  const oy = pad - minY * s;
  const P = (x: number, y: number, z: number): Point => [
    ox + (x - z) * C30 * s,
    oy + ((x + z) * 0.5 - y) * s,
  ];

  // Fläche einer Zelle: origin = Ecke der ganzen Zelle, u/v = ganze Kanten (= 16 Texturpixel),
  // sub = sichtbarer Ausschnitt in Texturpixeln [x, y, Breite, Höhe]
  const face = (
    origin: Point,
    u: Point,
    v: Point,
    tex: HTMLCanvasElement | null,
    sub: [number, number, number, number],
    darken: number,
    overlay: string | null,
    fallback: string,
  ) => {
    const at = (a: number, b: number): Point => [
      origin[0] + (u[0] * a + v[0] * b) / TEX,
      origin[1] + (u[1] * a + v[1] * b) / TEX,
    ];
    const [sx, sy, sw, sh] = sub;
    const quad = [at(sx, sy), at(sx + sw, sy), at(sx + sw, sy + sh), at(sx, sy + sh)];
    const path = () => {
      ctx.beginPath();
      quad.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
    };
    path();
    ctx.fillStyle = fallback;
    ctx.fill();
    if (tex) {
      ctx.save();
      path();
      ctx.clip();
      ctx.setTransform(
        (dpr * u[0]) / TEX,
        (dpr * u[1]) / TEX,
        (dpr * v[0]) / TEX,
        (dpr * v[1]) / TEX,
        dpr * origin[0],
        dpr * origin[1],
      );
      // Etwas größer zeichnen, damit an den Kanten keine Lücken bleiben
      ctx.drawImage(tex, sx, sy, sw, sh, sx - 0.03, sy - 0.03, sw + 0.06, sh + 0.06);
      ctx.restore();
    }
    path();
    if (darken > 0) {
      ctx.fillStyle = `rgba(0,0,0,${darken})`;
      ctx.fill();
    }
    if (overlay) {
      ctx.fillStyle = overlay;
      ctx.fill();
    }
  };

  // Fläche +x (rechts), +z (links vorne), +y (oben) eines Teilquaders in Zelle (bx, by, bz)
  const drawBox = (
    bx: number,
    by: number,
    bz: number,
    q: Box,
    textures: { top: HTMLCanvasElement | null; side: HTMLCanvasElement | null },
    fallback: string,
    overlay: string | null,
    cull: { px: boolean; pz: boolean; py: boolean },
  ) => {
    const [x0, y0, z0, x1, y1, z1] = [
      bx + q[0],
      by + q[1],
      bz + q[2],
      bx + q[3],
      by + q[4],
      bz + q[5],
    ];
    const vec = (a: Point, b: Point): Point => [b[0] - a[0], b[1] - a[1]];
    if (!cull.px) {
      const o = P(x1, by + 1, bz);
      face(
        o,
        vec(o, P(x1, by + 1, bz + 1)),
        vec(o, P(x1, by, bz)),
        textures.side,
        [(z0 - bz) * TEX, (by + 1 - y1) * TEX, (z1 - z0) * TEX, (y1 - y0) * TEX],
        0.3,
        overlay,
        fallback,
      );
    }
    if (!cull.pz) {
      const o = P(bx, by + 1, z1);
      face(
        o,
        vec(o, P(bx + 1, by + 1, z1)),
        vec(o, P(bx, by, z1)),
        textures.side,
        [(x0 - bx) * TEX, (by + 1 - y1) * TEX, (x1 - x0) * TEX, (y1 - y0) * TEX],
        0.14,
        overlay,
        fallback,
      );
    }
    if (!cull.py) {
      const o = P(bx, y1, bz);
      face(
        o,
        vec(o, P(bx + 1, y1, bz)),
        vec(o, P(bx, y1, bz + 1)),
        textures.top,
        [(x0 - bx) * TEX, (z0 - bz) * TEX, (x1 - x0) * TEX, (z1 - z0) * TEX],
        0,
        overlay,
        fallback,
      );
    }
  };

  const canvasesFor = (def: BlockDef) => {
    const t = blockTextures(def);
    return { top: pixelsToCanvas(t.top), side: pixelsToCanvas(t.side) };
  };

  // Sockel: Graswiese, ein Block breiter als der Bau
  if (ground) {
    const tex = canvasesFor(GRASS);
    const edge = (a: Point, b: Point): Point => [b[0] - a[0], b[1] - a[1]];
    const depth: [number, number, number, number] = [0, 0, TEX, GROUND_DEPTH * TEX];
    for (let x = -m; x < rw + m; x++) {
      for (let z = -m; z < rd + m; z++) {
        const o = P(x, 0, z);
        face(
          o,
          edge(o, P(x + 1, 0, z)),
          edge(o, P(x, 0, z + 1)),
          tex.top,
          [0, 0, TEX, TEX],
          0.06,
          null,
          '#5f9e3c',
        );
        if (x === rw + m - 1) {
          const so = P(x + 1, 0, z);
          face(so, edge(so, P(x + 1, 0, z + 1)), [0, s], tex.side, depth, 0.3, null, '#866043');
        }
        if (z === rd + m - 1) {
          const so = P(x, 0, z + 1);
          face(so, edge(so, P(x + 1, 0, z + 1)), [0, s], tex.side, depth, 0.14, null, '#866043');
        }
      }
    }
  }

  // Blöcke sammeln (gedreht) und von hinten nach vorne zeichnen
  type Item = {
    x: number;
    y: number;
    z: number;
    block: PlacedBlock;
    mode: BlockMode;
    def: BlockDef;
  };
  const items: Item[] = [];
  const solid = new Set<string>();
  const byPos = new Map<string, BlockDef>();
  for (const block of analysis.blocks) {
    const mode = options.mode(block);
    if (mode === 'hidden') continue;
    const [x, z] = rotXZ(block.x, block.z, analysis.W, analysis.D, r);
    const def = plan.palette[block.ch];
    items.push({ x, y: block.y, z, block, mode, def });
    byPos.set(blockKey(x, block.y, z), def);
    if (isOpaque(def)) solid.add(blockKey(x, block.y, z));
  }
  const connectsFor =
    (it: Item): Connects =>
    (dx, dz) => {
      const other = byPos.get(blockKey(it.x + dx, it.y, it.z + dz));
      if (!other) return false;
      if (isOpaque(other) || CONNECTING.includes(other.shape ?? 'block')) return true;
      return it.def.shape === 'pane' && textureKind(other) === 'glass' && isFull(other);
    };
  items.sort((a, b) => a.x + a.z + a.y - (b.x + b.z + b.y) || a.y - b.y || a.x - b.x);

  const dim = options.dimColor;
  for (const it of items) {
    const tex = canvasesFor(it.def);
    const full = isFull(it.def);
    const cull = {
      px: full && solid.has(blockKey(it.x + 1, it.y, it.z)),
      pz: full && solid.has(blockKey(it.x, it.y, it.z + 1)),
      py: full && solid.has(blockKey(it.x, it.y + 1, it.z)),
    };
    const overlay = it.mode === 'dim' ? dim : null;
    ctx.globalAlpha = it.def.alpha ?? 1;
    // Teilquader von hinten nach vorne; sie verdecken nichts, also immer alle Flächen
    const boxes = boxesFor(it.def, r, connectsFor(it)).sort(
      (a, b) => a[0] + a[3] + a[2] + a[5] + a[1] - (b[0] + b[3] + b[2] + b[5] + b[1]),
    );
    for (const q of boxes) {
      drawBox(
        it.x,
        it.y,
        it.z,
        q,
        tex,
        it.def.color,
        overlay,
        full ? cull : { px: false, pz: false, py: false },
      );
    }
    ctx.globalAlpha = 1;
    if (it.mode === 'current')
      outline(ctx, P, it.x, it.y, it.z, [bounds(boxes)], options.highlight, Math.max(1.5, s / 16));
  }
}

const CONNECTING: string[] = ['fence', 'wall', 'pane'];

function bounds(boxes: Box[]): Box {
  return [0, 1, 2, 3, 4, 5].map((i) =>
    i < 3 ? Math.min(...boxes.map((b) => b[i])) : Math.max(...boxes.map((b) => b[i])),
  ) as Box;
}

function outline(
  ctx: CanvasRenderingContext2D,
  P: (x: number, y: number, z: number) => Point,
  bx: number,
  by: number,
  bz: number,
  boxes: Box[],
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  for (const q of boxes) {
    const [x0, y0, z0, x1, y1, z1] = [
      bx + q[0],
      by + q[1],
      bz + q[2],
      bx + q[3],
      by + q[4],
      bz + q[5],
    ];
    const silhouette = [
      P(x0, y1, z0),
      P(x1, y1, z0),
      P(x1, y0, z0),
      P(x1, y0, z1),
      P(x0, y0, z1),
      P(x0, y1, z1),
    ];
    ctx.beginPath();
    silhouette.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.stroke();
  }
}
