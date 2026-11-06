import { legacyState, mapBlock, parseStateString } from './block-registry';
import {
  EMPTY_IDEA,
  ideaPrompt,
  isMaterialsOnly,
  parsePlan,
  planItems,
  planRawTotals,
  toMaterialsOnly,
  EXAMPLE_HOUSE,
} from './build-plan.model';
import { readSchematic } from './schematic';

// --- kleiner NBT-Schreiber für Testdateien ----------------------------------------------------
type Tag =
  | { t: 'byte'; v: number }
  | { t: 'short'; v: number }
  | { t: 'int'; v: number }
  | { t: 'string'; v: string }
  | { t: 'bytes'; v: number[] }
  | { t: 'longs'; v: bigint[] }
  | { t: 'list'; item: number; v: Tag[] }
  | { t: 'compound'; v: Record<string, Tag> };

const TYPE: Record<Tag['t'], number> = {
  byte: 1,
  short: 2,
  int: 3,
  string: 8,
  bytes: 7,
  longs: 12,
  list: 9,
  compound: 10,
};

function encode(root: Record<string, Tag>): ArrayBuffer {
  const out: number[] = [];
  const u16 = (n: number) => out.push((n >> 8) & 255, n & 255);
  const i32 = (n: number) => out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  const str = (s: string) => {
    const b = new TextEncoder().encode(s);
    u16(b.length);
    out.push(...b);
  };
  const payload = (tag: Tag) => {
    switch (tag.t) {
      case 'byte':
        out.push(tag.v & 255);
        break;
      case 'short':
        u16(tag.v);
        break;
      case 'int':
        i32(tag.v);
        break;
      case 'string':
        str(tag.v);
        break;
      case 'bytes':
        i32(tag.v.length);
        out.push(...tag.v.map((b) => b & 255));
        break;
      case 'longs':
        i32(tag.v.length);
        for (const l of tag.v) {
          const u = BigInt.asUintN(64, l);
          i32(Number(u >> 32n));
          i32(Number(u & 0xffffffffn));
        }
        break;
      case 'list':
        out.push(tag.item);
        i32(tag.v.length);
        tag.v.forEach(payload);
        break;
      case 'compound':
        for (const [k, v] of Object.entries(tag.v)) {
          out.push(TYPE[v.t]);
          str(k);
          payload(v);
        }
        out.push(0);
    }
  };
  out.push(10);
  str('');
  payload({ t: 'compound', v: root });
  return new Uint8Array(out).buffer;
}

const short = (v: number): Tag => ({ t: 'short', v });
const int = (v: number): Tag => ({ t: 'int', v });
const string = (v: string): Tag => ({ t: 'string', v });

describe('Block-Übersetzung', () => {
  it('kennt alte IDs mit Datenwerten', () => {
    expect(legacyState(98, 0)).toEqual({ id: 'stone_bricks', props: {} });
    expect(legacyState(134, 5)).toEqual({
      id: 'spruce_stairs',
      props: { facing: 'west', half: 'top' },
    });
    expect(legacyState(126, 9)).toEqual({ id: 'spruce_slab', props: { type: 'top' } });
    expect(legacyState(35, 14)?.id).toBe('red_wool');
    expect(legacyState(0, 0)).toBeNull();
  });

  it('übersetzt Blockzustände ins Deutsche mit Form und Zählung', () => {
    const stair = mapBlock(parseStateString('minecraft:spruce_stairs[facing=east,half=top]'))!.def;
    expect(stair).toMatchObject({
      name: 'Fichtenholztreppe',
      shape: 'stair',
      dir: [1, 0],
      half: 'top',
    });
    expect(
      mapBlock(parseStateString('minecraft:stone_brick_slab[type=double]'))!.def,
    ).toMatchObject({
      item: 'Steinziegelstufe',
      per: 2,
    });
    expect(mapBlock(parseStateString('minecraft:oak_door[half=upper]'))!.def.per).toBe(0);
    expect(mapBlock(parseStateString('minecraft:cyan_terracotta'))!.def.name).toBe(
      'Keramik (türkis)',
    );
    expect(mapBlock(parseStateString('minecraft:red_sandstone'))!.def.name).toBe('Roter Sandstein');
    expect(mapBlock(parseStateString('minecraft:air'))).toBeNull();
    expect(mapBlock(parseStateString('minecraft:water[level=3]'))).toBeNull();
    expect(mapBlock(parseStateString('minecraft:some_new_block'))!.def.name).toBe('Some New Block');
  });
});

describe('Schematic-Import', () => {
  it('liest MCEdit-.schematic (alte IDs) als Bauplan', async () => {
    // 2 × 2 Grundfläche, 2 hoch: unten Steinziegel, oben eine Fichtentreppe
    const file = encode({
      Width: short(2),
      Height: short(2),
      Length: short(2),
      Materials: string('Alpha'),
      Blocks: { t: 'bytes', v: [98, 98, 98, 98, 134, 0, 0, 0] },
      Data: { t: 'bytes', v: [0, 0, 0, 0, 2, 0, 0, 0] },
    });
    const result = await readSchematic(file, 'kleiner_turm.schematic');
    expect(result.materialsOnlyReason).toBe('');
    expect(result.blocks).toBe(5);
    expect(result.plan.name).toBe('Kleiner Turm');
    expect(result.plan.layers).toEqual([
      ['AA', 'AA'],
      ['B.', '..'],
    ]);
    expect(result.plan.palette['B']).toMatchObject({ name: 'Fichtenholztreppe', dir: [0, 1] });
    expect(result.plan.steps?.length).toBe(2);
  });

  it('liest Sponge-.schem v2', async () => {
    const sponge = encode({
      Version: int(2),
      Width: short(3),
      Height: short(1),
      Length: short(1),
      Palette: { t: 'compound', v: { 'minecraft:air': int(0), 'minecraft:oak_planks': int(1) } },
      BlockData: { t: 'bytes', v: [1, 0, 1] },
    });
    const result = await readSchematic(sponge, 'boden.schem');
    expect(result.plan.layers).toEqual([['A.A']]);
    expect(result.plan.palette['A'].name).toBe('Eichenholzbretter');
  });

  it('liest Litematica mit bitgepackten Blöcken', async () => {
    // 4 Blöcke in einer Reihe: Stein, Luft, Glas, Stein → Palette [air, stone, glass], 2 Bit je Block
    // Werte 1,0,2,1 → Bits: 01 00 10 01 (von unten) = 0b01_10_00_01 = 0x61
    const file = encode({
      Regions: {
        t: 'compound',
        v: {
          Main: {
            t: 'compound',
            v: {
              Position: { t: 'compound', v: { x: int(0), y: int(0), z: int(0) } },
              Size: { t: 'compound', v: { x: int(4), y: int(1), z: int(1) } },
              BlockStatePalette: {
                t: 'list',
                item: 10,
                v: ['minecraft:air', 'minecraft:stone', 'minecraft:glass'].map((n) => ({
                  t: 'compound' as const,
                  v: { Name: string(n) },
                })),
              },
              BlockStates: { t: 'longs', v: [0x61n] },
            },
          },
        },
      },
    });
    const result = await readSchematic(file, 'reihe.litematic');
    expect(result.plan.layers[0][0]).toBe('A.BA');
    expect(result.plan.palette['B'].name).toBe('Glas');
  });

  it('liest Strukturdateien (.nbt)', async () => {
    const file = encode({
      size: { t: 'list', item: 3, v: [int(2), int(1), int(1)] },
      palette: {
        t: 'list',
        item: 10,
        v: [{ t: 'compound', v: { Name: string('minecraft:cobblestone') } }],
      },
      blocks: {
        t: 'list',
        item: 10,
        v: [
          {
            t: 'compound',
            v: { pos: { t: 'list', item: 3, v: [int(1), int(0), int(0)] }, state: int(0) },
          },
        ],
      },
    });
    const result = await readSchematic(file, 'stein.nbt');
    expect(result.plan.layers).toEqual([['A']]);
    expect(result.plan.palette['A'].name).toBe('Bruchstein');
  });

  it('macht aus zu großen Bauten eine Materialliste', async () => {
    const width = 70;
    const file = encode({
      Width: short(width),
      Height: short(1),
      Length: short(1),
      Blocks: { t: 'bytes', v: Array(width).fill(4) },
      Data: { t: 'bytes', v: Array(width).fill(0) },
    });
    const result = await readSchematic(file, 'mauer.schematic');
    expect(result.materialsOnlyReason).toContain('zu groß');
    expect(isMaterialsOnly(result.plan)).toBe(true);
    expect(result.plan.materials).toEqual([
      {
        name: 'Bruchstein',
        count: 70,
        color: '#878787',
        texture: 'cobblestone',
        raw: { Bruchstein: 1 },
      },
    ]);
  });
});

describe('Nur Materialliste', () => {
  it('reduziert einen Bauplan auf seine Materialien', () => {
    const plan = toMaterialsOnly(EXAMPLE_HOUSE);
    expect(isMaterialsOnly(plan)).toBe(true);
    expect(planItems(plan).find((i) => i.name === 'Fichtentür')?.count).toBe(1);
    expect(planRawTotals(plan).find((r) => r.name === 'Sand')?.count).toBe(3);
  });

  it('importiert eine reine Materialliste der KI', () => {
    const result = parsePlan(
      JSON.stringify({
        name: 'Eisenfarm',
        materials: [
          { name: 'Trichter', count: 12, color: '#4a4a4a', wiki: 'Trichter' },
          { name: 'Glas', count: 40, color: '#c0e3ec', raw: { Sand: 1 } },
          { name: 'Ohne Menge' },
        ],
      }),
    );
    expect(result.error).toBeUndefined();
    expect(result.plan?.materials?.map((m) => m.name)).toEqual(['Glas', 'Trichter']);
    expect(result.warnings?.[0]).toContain('übersprungen');
  });

  it('baut einen Prompt nur für die Materialliste', () => {
    const prompt = ideaPrompt({
      ...EMPTY_IDEA,
      materialsOnly: true,
      source: 'video',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
    expect(prompt).toContain('nur Materialliste');
    expect(prompt).toContain('"materials"');
    expect(prompt).not.toContain('"layers": [');
  });
});
