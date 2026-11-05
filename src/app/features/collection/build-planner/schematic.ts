// Liest Minecraft-Baupläne im NBT-Format und macht daraus einen Bauplan oder – bei großen Bauten –
// eine Materialliste. Unterstützt:
//  - .schematic (MCEdit/„Alpha“, alte Zahlen-IDs; z. B. bloxelizer.com)
//  - .schem (Sponge/WorldEdit v2 und v3, Blockzustände mit Namen)
//  - .litematic (Litematica, bitgepackte Blockzustände je Region)
//  - .nbt (Strukturdatei aus dem Konstruktionsblock)
import {
  BlockDef,
  BuildPlan,
  LIMITS,
  MaterialEntry,
  PLAN_FORMAT,
  PlanStep,
} from './build-plan.model';
import { BlockState, MappedBlock, legacyState, mapBlock, parseStateString } from './block-registry';

// ---------------------------------------------------------------------------
// NBT
// ---------------------------------------------------------------------------

type Nbt = number | bigint | string | Uint8Array | Int32Array | BigInt64Array | Nbt[] | NbtCompound;
interface NbtCompound {
  [key: string]: Nbt;
}

class NbtReader {
  private pos = 0;
  private readonly view: DataView;
  private readonly text = new TextDecoder();

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  root(): NbtCompound {
    const type = this.u8();
    if (type !== 10) throw new Error('Keine NBT-Datei.');
    this.string();
    return this.payload(10) as NbtCompound;
  }

  private u8(): number {
    return this.view.getUint8(this.pos++);
  }
  private i32(): number {
    const v = this.view.getInt32(this.pos);
    this.pos += 4;
    return v;
  }
  private string(): string {
    const len = this.view.getUint16(this.pos);
    this.pos += 2;
    const s = this.text.decode(this.bytes.subarray(this.pos, this.pos + len));
    this.pos += len;
    return s;
  }

  private payload(type: number): Nbt {
    const v = this.view;
    switch (type) {
      case 1:
        return v.getInt8(this.pos++);
      case 2: {
        const x = v.getInt16(this.pos);
        this.pos += 2;
        return x;
      }
      case 3:
        return this.i32();
      case 4: {
        const x = v.getBigInt64(this.pos);
        this.pos += 8;
        return x;
      }
      case 5: {
        const x = v.getFloat32(this.pos);
        this.pos += 4;
        return x;
      }
      case 6: {
        const x = v.getFloat64(this.pos);
        this.pos += 8;
        return x;
      }
      case 7: {
        const n = this.i32();
        const out = this.bytes.subarray(this.pos, this.pos + n);
        this.pos += n;
        return out;
      }
      case 8:
        return this.string();
      case 9: {
        const itemType = this.u8();
        const n = this.i32();
        const list: Nbt[] = [];
        for (let i = 0; i < n; i++) list.push(this.payload(itemType));
        return list;
      }
      case 10: {
        const out: NbtCompound = {};
        for (;;) {
          const t = this.u8();
          if (t === 0) return out;
          const name = this.string();
          out[name] = this.payload(t);
        }
      }
      case 11: {
        const n = this.i32();
        const out = new Int32Array(n);
        for (let i = 0; i < n; i++) out[i] = this.i32();
        return out;
      }
      case 12: {
        const n = this.i32();
        const out = new BigInt64Array(n);
        for (let i = 0; i < n; i++) {
          out[i] = v.getBigInt64(this.pos);
          this.pos += 8;
        }
        return out;
      }
      default:
        throw new Error(`Unbekannter NBT-Typ ${type}.`);
    }
  }
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ---------------------------------------------------------------------------
// Einheitliches Volumen: Größe + Blockzustand je Zelle (Index in palette)
// ---------------------------------------------------------------------------

interface Volume {
  format: string;
  width: number; // x
  height: number; // y
  length: number; // z
  palette: (BlockState | null)[];
  // (y * length + z) * width + x → Index in palette
  cells: Uint16Array | Uint32Array;
}

const num = (v: Nbt | undefined) => Number(v ?? 0);

function readClassic(root: NbtCompound): Volume {
  const width = num(root['Width']);
  const height = num(root['Height']);
  const length = num(root['Length']);
  const blocks = root['Blocks'] as Uint8Array;
  const data = root['Data'] as Uint8Array;
  const add = root['AddBlocks'] as Uint8Array | undefined;
  const palette: (BlockState | null)[] = [];
  const index = new Map<number, number>();
  const cells = new Uint32Array(width * height * length);
  for (let i = 0; i < cells.length; i++) {
    let id = blocks[i];
    if (add) id |= (i & 1 ? add[i >> 1] & 0x0f : (add[i >> 1] >> 4) & 0x0f) << 8;
    const key = (id << 4) | (data[i] & 15);
    let p = index.get(key);
    if (p === undefined) {
      p = palette.length;
      palette.push(legacyState(id, data[i] & 15));
      index.set(key, p);
    }
    cells[i] = p;
  }
  return { format: 'MCEdit-Schematic', width, height, length, palette, cells };
}

function readVarints(bytes: Uint8Array, count: number): Uint32Array {
  const out = new Uint32Array(count);
  let pos = 0;
  for (let i = 0; i < count && pos < bytes.length; i++) {
    let value = 0;
    let shift = 0;
    let b: number;
    do {
      b = bytes[pos++];
      value |= (b & 0x7f) << shift;
      shift += 7;
    } while (b & 0x80);
    out[i] = value;
  }
  return out;
}

function readSponge(root: NbtCompound): Volume {
  const s = (root['Schematic'] as NbtCompound | undefined) ?? root;
  const width = num(s['Width']);
  const height = num(s['Height']);
  const length = num(s['Length']);
  const blocks = (s['Blocks'] as NbtCompound | undefined) ?? s;
  const paletteNbt = blocks['Palette'] as NbtCompound;
  const data = (blocks['Data'] ?? blocks['BlockData']) as Uint8Array;
  const palette: (BlockState | null)[] = [];
  for (const [name, idx] of Object.entries(paletteNbt))
    palette[Number(idx)] = parseStateString(name);
  return {
    format: `Sponge-Schematic v${num(s['Version']) || 2}`,
    width,
    height,
    length,
    palette,
    cells: readVarints(data, width * height * length),
  };
}

function readLitematic(root: NbtCompound): Volume {
  const regions = Object.values(root['Regions'] as NbtCompound) as NbtCompound[];
  // Gesamtgröße aus allen Regionen (Positionen können negativ, Größen negativ sein)
  const boxes = regions.map((r) => {
    const pos = r['Position'] as NbtCompound;
    const size = r['Size'] as NbtCompound;
    const sx = num(size['x']);
    const sy = num(size['y']);
    const sz = num(size['z']);
    const x0 = num(pos['x']) + (sx < 0 ? sx + 1 : 0);
    const y0 = num(pos['y']) + (sy < 0 ? sy + 1 : 0);
    const z0 = num(pos['z']) + (sz < 0 ? sz + 1 : 0);
    return { r, x0, y0, z0, w: Math.abs(sx), h: Math.abs(sy), l: Math.abs(sz) };
  });
  const minX = Math.min(...boxes.map((b) => b.x0));
  const minY = Math.min(...boxes.map((b) => b.y0));
  const minZ = Math.min(...boxes.map((b) => b.z0));
  const width = Math.max(...boxes.map((b) => b.x0 + b.w)) - minX;
  const height = Math.max(...boxes.map((b) => b.y0 + b.h)) - minY;
  const length = Math.max(...boxes.map((b) => b.z0 + b.l)) - minZ;
  const palette: (BlockState | null)[] = [{ id: 'air', props: {} }];
  const keyIndex = new Map<string, number>([['air', 0]]);
  const cells = new Uint32Array(width * height * length);
  for (const b of boxes) {
    const pal = (b.r['BlockStatePalette'] as NbtCompound[]).map((entry) => {
      const props: Record<string, string> = {};
      for (const [k, v] of Object.entries((entry['Properties'] as NbtCompound | undefined) ?? {}))
        props[k] = String(v);
      const state: BlockState = { id: String(entry['Name']).replace(/^minecraft:/, ''), props };
      const key = JSON.stringify(state);
      let idx = keyIndex.get(key);
      if (idx === undefined) {
        idx = palette.length;
        palette.push(state);
        keyIndex.set(key, idx);
      }
      return idx;
    });
    const longs = b.r['BlockStates'] as BigInt64Array;
    const bits = BigInt(Math.max(2, Math.ceil(Math.log2(pal.length))));
    const mask = (1n << bits) - 1n;
    const total = b.w * b.h * b.l;
    for (let i = 0; i < total; i++) {
      const bitIndex = BigInt(i) * bits;
      const li = Number(bitIndex >> 6n);
      const off = bitIndex & 63n;
      const lo = BigInt.asUintN(64, longs[li]);
      let value = (lo >> off) & mask;
      if (off + bits > 64n) {
        const hi = BigInt.asUintN(64, longs[li + 1]);
        value = (value | (hi << (64n - off))) & mask;
      }
      const x = i % b.w;
      const z = Math.floor(i / b.w) % b.l;
      const y = Math.floor(i / (b.w * b.l));
      const gx = b.x0 - minX + x;
      const gy = b.y0 - minY + y;
      const gz = b.z0 - minZ + z;
      const p = pal[Number(value)] ?? 0;
      if (p) cells[(gy * length + gz) * width + gx] = p;
    }
  }
  return { format: 'Litematica', width, height, length, palette, cells };
}

function readStructure(root: NbtCompound): Volume {
  const size = (root['size'] as number[]).map(Number);
  const [width, height, length] = size;
  const palette: (BlockState | null)[] = (root['palette'] as NbtCompound[]).map((entry) => {
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries((entry['Properties'] as NbtCompound | undefined) ?? {}))
      props[k] = String(v);
    return { id: String(entry['Name']).replace(/^minecraft:/, ''), props };
  });
  // Index 0 = Luft für alle Zellen ohne Eintrag
  palette.unshift(null);
  const cells = new Uint32Array(width * height * length);
  for (const block of root['blocks'] as NbtCompound[]) {
    const [x, y, z] = (block['pos'] as number[]).map(Number);
    cells[(y * length + z) * width + x] = num(block['state']) + 1;
  }
  return { format: 'Minecraft-Struktur', width, height, length, palette, cells };
}

// ---------------------------------------------------------------------------
// Umwandlung
// ---------------------------------------------------------------------------

// Zeichen für die Palette (ohne "." und Leerzeichen)
const CHARS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ...'ÄÖÜäöüßΑΒΓΔΘΛΞΠΣΦΨΩαβγδεζηθικλμνξπρστφχψω',
  ...'БГДЖЗИЛПФЦЧШЩЪЫЬЭЮЯбвгджзилпфцчшщъыьэюя',
];
// Bis hierhin wird ein echter Bauplan mit 3D-Ansicht und Ebenen daraus, sonst eine Materialliste
export const SCHEMATIC_MAX_BLOCKS = 30000;

export interface SchematicResult {
  plan: BuildPlan;
  format: string;
  blocks: number;
  size: { width: number; height: number; length: number };
  // Warum nur eine Materialliste daraus wurde (leer = voller Bauplan)
  materialsOnlyReason: string;
}

export async function readSchematic(file: ArrayBuffer, fileName: string): Promise<SchematicResult> {
  const bytes = await gunzip(new Uint8Array(file));
  const root = new NbtReader(bytes).root();
  let volume: Volume;
  if (root['Regions']) volume = readLitematic(root);
  else if (root['Blocks'] instanceof Uint8Array && root['Data']) volume = readClassic(root);
  else if (root['Schematic'] || root['Palette']) volume = readSponge(root);
  else if (Array.isArray(root['size']) && Array.isArray(root['palette']))
    volume = readStructure(root);
  else throw new Error('Unbekanntes Schematic-Format.');
  return volumeToPlan(volume, fileName);
}

function volumeToPlan(volume: Volume, fileName: string): SchematicResult {
  const { width, height, length, cells } = volume;
  const mapped: (MappedBlock | null)[] = volume.palette.map((s) => (s ? mapBlock(s) : null));

  // Benutzter Bereich (Luft am Rand abschneiden) und Mengen
  let minX = width,
    minY = height,
    minZ = length,
    maxX = -1,
    maxY = -1,
    maxZ = -1;
  let blocks = 0;
  const used = new Map<string, { def: BlockDef; count: number }>();
  for (let i = 0; i < cells.length; i++) {
    const m = mapped[cells[i]];
    if (!m) continue;
    blocks++;
    const x = i % width;
    const z = Math.floor(i / width) % length;
    const y = Math.floor(i / (width * length));
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    const entry = used.get(m.key);
    if (entry) entry.count++;
    else used.set(m.key, { def: m.def, count: 1 });
  }
  if (!blocks) throw new Error('Die Datei enthält keine Blöcke.');

  const name = humanName(fileName);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const l = maxZ - minZ + 1;
  const base = {
    format: PLAN_FORMAT,
    id: fileName.replace(/\.[^.]+$/, '').slice(0, 60),
    name,
  };

  const reason =
    w > LIMITS.size || l > LIMITS.size || h > LIMITS.height
      ? `Mit ${w} × ${l} Grundfläche und ${h} Ebenen ist der Bau zu groß für eine Bauanleitung.`
      : blocks > SCHEMATIC_MAX_BLOCKS
        ? `Mit ${blocks.toLocaleString('de-DE')} Blöcken ist der Bau zu groß für eine Bauanleitung.`
        : used.size > CHARS.length
          ? 'Der Bau hat zu viele verschiedene Blöcke für eine Bauanleitung.'
          : '';

  const description = `Importiert aus ${fileName} (${volume.format}): ${w} × ${l} Grundfläche, ${h} Ebenen hoch.`;
  if (reason) {
    return {
      plan: {
        ...base,
        description,
        palette: {},
        layers: [],
        materials: materialsFrom([...used.values()]),
      },
      format: volume.format,
      blocks,
      size: { width: w, height: h, length: l },
      materialsOnlyReason: reason,
    };
  }

  // Palette: häufigste Blöcke bekommen die einfachsten Zeichen
  const sorted = [...used.entries()].sort((a, b) => b[1].count - a[1].count);
  const charOf = new Map<string, string>();
  const palette: Record<string, BlockDef> = {};
  sorted.forEach(([key, entry], i) => {
    charOf.set(key, CHARS[i]);
    palette[CHARS[i]] = entry.def;
  });
  const layers: string[][] = [];
  for (let y = minY; y <= maxY; y++) {
    const rows: string[] = [];
    for (let z = minZ; z <= maxZ; z++) {
      let row = '';
      for (let x = minX; x <= maxX; x++) {
        const m = mapped[cells[(y * length + z) * width + x]];
        row += m ? charOf.get(m.key)! : '.';
      }
      rows.push(row);
    }
    layers.push(rows);
  }
  return {
    plan: { ...base, description, palette, layers, steps: layerSteps(layers.length) },
    format: volume.format,
    blocks,
    size: { width: w, height: h, length: l },
    materialsOnlyReason: '',
  };
}

/** Bauschritte ohne Anleitungstext: Ebene für Ebene, bei vielen Ebenen in Gruppen. */
function layerSteps(height: number): PlanStep[] {
  const per = Math.max(1, Math.ceil(height / 24));
  const steps: PlanStep[] = [];
  for (let from = 0; from < height; from += per) {
    const to = Math.min(height - 1, from + per - 1);
    steps.push({
      title: from === to ? `Ebene ${from + 1}` : `Ebenen ${from + 1}–${to + 1}`,
      text:
        from === to
          ? 'Setz alle Blöcke dieser Ebene nach dem Raster.'
          : 'Bau diese Ebenen von unten nach oben nach dem Raster.',
      layers: [from, to],
    });
  }
  return steps;
}

/** Mengen je Item (Türhälften, doppelte Stufen usw. zusammengefasst). */
export function materialsFrom(list: { def: BlockDef; count: number }[]): MaterialEntry[] {
  const byItem = new Map<string, MaterialEntry>();
  for (const { def, count } of list) {
    const per = def.per ?? 1;
    const name = def.item || def.name;
    const entry = byItem.get(name);
    if (entry) {
      entry.count += count * per;
      continue;
    }
    const m: MaterialEntry = { name, count: count * per, color: def.color };
    if (def.texture) m.texture = def.texture;
    if (def.wiki) m.wiki = def.wiki;
    if (def.raw) m.raw = def.raw;
    byItem.set(name, m);
  }
  return [...byItem.values()].filter((m) => m.count > 0).sort((a, b) => b.count - a.count);
}

function humanName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/^[0-9a-f]{6,}-/i, '');
  const words = base.split(/[_\-\s]+/).filter(Boolean);
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return (name || 'Importierter Bau').slice(0, 120);
}

export const SCHEMATIC_EXTENSIONS = /\.(schematic|schem|litematic|nbt)$/i;
