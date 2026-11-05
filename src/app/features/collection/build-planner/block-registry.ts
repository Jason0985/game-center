// Übersetzt Minecraft-Blockzustände (z. B. "minecraft:spruce_stairs[facing=east,half=top]") in
// Blöcke des Bauplaners: deutscher Name, Farbe, Textur, Form und wie er gezählt wird.
// Alte Schematic-Dateien (MCEdit) speichern Zahlen-IDs; LEGACY übersetzt sie vorher in Namen.
import { BlockDef, BlockShape, TextureKind } from './build-plan.model';

export interface BlockState {
  id: string; // ohne "minecraft:"
  props: Record<string, string>;
}

export interface MappedBlock {
  // Gleicher key = gleiches Palettenzeichen
  key: string;
  def: BlockDef;
}

const DYES = [
  'white',
  'orange',
  'magenta',
  'light_blue',
  'yellow',
  'lime',
  'pink',
  'gray',
  'light_gray',
  'cyan',
  'purple',
  'blue',
  'brown',
  'green',
  'red',
  'black',
];
const DYE_DE: Record<string, string> = {
  white: 'weiß',
  orange: 'orange',
  magenta: 'magenta',
  light_blue: 'hellblau',
  yellow: 'gelb',
  lime: 'hellgrün',
  pink: 'rosa',
  gray: 'grau',
  light_gray: 'hellgrau',
  cyan: 'türkis',
  purple: 'violett',
  blue: 'blau',
  brown: 'braun',
  green: 'grün',
  red: 'rot',
  black: 'schwarz',
};
const DYE_COLOR: Record<string, string> = {
  white: '#e9ecec',
  orange: '#f07613',
  magenta: '#bd44b3',
  light_blue: '#3aafd9',
  yellow: '#f8c527',
  lime: '#70b919',
  pink: '#ed8dac',
  gray: '#3e4447',
  light_gray: '#8e8e86',
  cyan: '#158991',
  purple: '#792aac',
  blue: '#35399d',
  brown: '#724728',
  green: '#546d1b',
  red: '#a12722',
  black: '#141519',
};
const DYE_KINDS: Record<string, [string, TextureKind, BlockShape?]> = {
  wool: ['Wolle', 'wool'],
  carpet: ['Teppich', 'wool', 'carpet'],
  concrete: ['Beton', 'smooth'],
  concrete_powder: ['Trockenbeton', 'sand'],
  terracotta: ['Keramik', 'smooth'],
  glazed_terracotta: ['Glasierte Keramik', 'smooth'],
  stained_glass: ['Gefärbtes Glas', 'glass'],
  stained_glass_pane: ['Gefärbte Glasscheibe', 'glass', 'pane'],
  bed: ['Bett', 'wool', 'slab'],
  banner: ['Banner', 'wool', 'small'],
  wall_banner: ['Banner', 'wool', 'small'],
  candle: ['Kerze', 'smooth', 'small'],
  shulker_box: ['Shulker-Kiste', 'smooth'],
};

// Terrakotta ist gedeckter als Wolle
const TERRACOTTA_COLOR: Record<string, string> = {
  white: '#d1b2a1',
  orange: '#a15325',
  magenta: '#95576c',
  light_blue: '#706c8a',
  yellow: '#ba8523',
  lime: '#677535',
  pink: '#a14e4e',
  gray: '#392a23',
  light_gray: '#876b62',
  cyan: '#575b5b',
  purple: '#764656',
  blue: '#4a3b5b',
  brown: '#4d3323',
  green: '#4c532a',
  red: '#8e3c2e',
  black: '#251610',
};

const WOODS: Record<string, { de: string; color: string; log: string; leaves?: string }> = {
  oak: { de: 'Eichen', color: '#b38b52', log: '#6c5232', leaves: '#4a7a27' },
  spruce: { de: 'Fichten', color: '#6e5132', log: '#3b2a17', leaves: '#3d5c3d' },
  birch: { de: 'Birken', color: '#c5b37b', log: '#d8d6cf', leaves: '#5d7e3b' },
  jungle: { de: 'Tropenbaum', color: '#a87454', log: '#56461d', leaves: '#3f8f1e' },
  acacia: { de: 'Akazien', color: '#ad5d32', log: '#676157', leaves: '#5c8a25' },
  dark_oak: { de: 'Schwarzeichen', color: '#432b14', log: '#3c2e1a', leaves: '#3b6b1c' },
  mangrove: { de: 'Mangroven', color: '#763531', log: '#55462d', leaves: '#4e7d2b' },
  cherry: { de: 'Kirsch', color: '#e3b3ad', log: '#371f2a', leaves: '#e8a6c2' },
  pale_oak: { de: 'Blasseichen', color: '#e3d9d5', log: '#53504d', leaves: '#8b9183' },
  bamboo: { de: 'Bambus', color: '#c4ae55', log: '#7a8a2c' },
  crimson: { de: 'Karmesin', color: '#653046', log: '#5c1a1e' },
  warped: { de: 'Wirr', color: '#2b6863', log: '#3a3a4d' },
};

// Stein-artige Materialien: Grundname für Block, Treppe, Stufe, Mauer
const STONES: Record<string, { de: string; color: string; texture: TextureKind; block?: string }> =
  {
    stone: { de: 'Stein', color: '#7e7e7e', texture: 'stone' },
    cobblestone: { de: 'Bruchstein', color: '#878787', texture: 'cobblestone' },
    mossy_cobblestone: { de: 'Bemooster Bruchstein', color: '#6e7a5d', texture: 'cobblestone' },
    stone_brick: {
      de: 'Steinziegel',
      color: '#7a7a7a',
      texture: 'stone_bricks',
      block: 'stone_bricks',
    },
    mossy_stone_brick: {
      de: 'Bemooste Steinziegel',
      color: '#737a64',
      texture: 'stone_bricks',
      block: 'mossy_stone_bricks',
    },
    smooth_stone: { de: 'Glatter Stein', color: '#9e9e9e', texture: 'smooth' },
    brick: { de: 'Ziegel', color: '#96503f', texture: 'bricks', block: 'bricks' },
    sandstone: { de: 'Sandstein', color: '#d8cb9b', texture: 'smooth' },
    smooth_sandstone: { de: 'Glatter Sandstein', color: '#dccf9e', texture: 'smooth' },
    cut_sandstone: { de: 'Geschnittener Sandstein', color: '#d9cc9e', texture: 'smooth' },
    red_sandstone: { de: 'Roter Sandstein', color: '#b5621f', texture: 'smooth' },
    smooth_red_sandstone: { de: 'Glatter roter Sandstein', color: '#b5621f', texture: 'smooth' },
    quartz: { de: 'Quarz', color: '#ebe5de', texture: 'smooth', block: 'quartz_block' },
    smooth_quartz: { de: 'Glatter Quarz', color: '#ece6df', texture: 'smooth' },
    nether_brick: {
      de: 'Netherziegel',
      color: '#2c1519',
      texture: 'bricks',
      block: 'nether_bricks',
    },
    red_nether_brick: {
      de: 'Rote Netherziegel',
      color: '#470709',
      texture: 'bricks',
      block: 'red_nether_bricks',
    },
    prismarine: { de: 'Prismarin', color: '#63a090', texture: 'stone' },
    prismarine_brick: {
      de: 'Prismarinziegel',
      color: '#63ab9e',
      texture: 'stone_bricks',
      block: 'prismarine_bricks',
    },
    dark_prismarine: { de: 'Dunkler Prismarin', color: '#335b4b', texture: 'stone_bricks' },
    purpur: { de: 'Purpur', color: '#a97ea9', texture: 'stone_bricks', block: 'purpur_block' },
    end_stone_brick: {
      de: 'Endsteinziegel',
      color: '#dbe0a2',
      texture: 'stone_bricks',
      block: 'end_stone_bricks',
    },
    granite: { de: 'Granit', color: '#956755', texture: 'stone' },
    polished_granite: { de: 'Polierter Granit', color: '#9a6a59', texture: 'smooth' },
    diorite: { de: 'Diorit', color: '#bcbcbc', texture: 'stone' },
    polished_diorite: { de: 'Polierter Diorit', color: '#c0c0c1', texture: 'smooth' },
    andesite: { de: 'Andesit', color: '#888889', texture: 'stone' },
    polished_andesite: { de: 'Polierter Andesit', color: '#848685', texture: 'smooth' },
    cobbled_deepslate: { de: 'Bruchtiefenschiefer', color: '#4d4d51', texture: 'cobblestone' },
    polished_deepslate: { de: 'Polierter Tiefenschiefer', color: '#484849', texture: 'smooth' },
    deepslate_brick: {
      de: 'Tiefenschieferziegel',
      color: '#46464a',
      texture: 'stone_bricks',
      block: 'deepslate_bricks',
    },
    deepslate_tile: {
      de: 'Tiefenschieferfliesen',
      color: '#36363a',
      texture: 'stone_bricks',
      block: 'deepslate_tiles',
    },
    blackstone: { de: 'Schwarzstein', color: '#2a2328', texture: 'stone' },
    polished_blackstone: { de: 'Polierter Schwarzstein', color: '#35303a', texture: 'smooth' },
    polished_blackstone_brick: {
      de: 'Polierte Schwarzsteinziegel',
      color: '#302a30',
      texture: 'stone_bricks',
      block: 'polished_blackstone_bricks',
    },
    mud_brick: { de: 'Lehmziegel', color: '#89684f', texture: 'bricks', block: 'mud_bricks' },
    tuff: { de: 'Tuffstein', color: '#6c6d66', texture: 'stone' },
    tuff_brick: {
      de: 'Tuffsteinziegel',
      color: '#62655e',
      texture: 'stone_bricks',
      block: 'tuff_bricks',
    },
    cut_copper: { de: 'Geschnittener Kupfer', color: '#bf6a50', texture: 'metal' },
  };

// Einzelne Blöcke: [Name, Farbe, Textur, Form?, Wiki-Seite?]
type Entry = [string, string, TextureKind, BlockShape?, string?];
const BLOCKS: Record<string, Entry> = {
  dirt: ['Erde', '#866043', 'dirt'],
  coarse_dirt: ['Grobe Erde', '#77553b', 'dirt'],
  podzol: ['Podsol', '#5c3f18', 'dirt'],
  grass_block: ['Grasblock', '#866043', 'grass'],
  dirt_path: ['Trampelpfad', '#94793e', 'dirt'],
  farmland: ['Ackerboden', '#5b3a1f', 'dirt'],
  mycelium: ['Myzel', '#6f6265', 'dirt'],
  mud: ['Schlamm', '#3c3a3d', 'dirt'],
  sand: ['Sand', '#dbcfa3', 'sand'],
  red_sand: ['Roter Sand', '#be6621', 'sand'],
  gravel: ['Kies', '#837f7e', 'gravel'],
  clay: ['Ton', '#a0a6b3', 'smooth', undefined, 'Ton (Block)'],
  bedrock: ['Grundgestein', '#555555', 'stone'],
  deepslate: ['Tiefenschiefer', '#4d4d50', 'stone'],
  calcite: ['Kalzit', '#dfe0dc', 'stone'],
  netherrack: ['Netherrack', '#6f3534', 'stone'],
  soul_sand: ['Seelensand', '#513e32', 'sand'],
  soul_soil: ['Seelenerde', '#4b3a2f', 'dirt'],
  end_stone: ['Endstein', '#dbde9e', 'stone'],
  obsidian: ['Obsidian', '#141021', 'stone'],
  crying_obsidian: ['Weinender Obsidian', '#200a3c', 'stone'],
  bricks: ['Ziegelsteine', '#96503f', 'bricks'],
  stone_bricks: ['Steinziegel', '#7a7a7a', 'stone_bricks'],
  cracked_stone_bricks: ['Rissige Steinziegel', '#767676', 'stone_bricks'],
  chiseled_stone_bricks: ['Gemeißelte Steinziegel', '#777777', 'stone_bricks'],
  infested_stone: ['Befallener Stein', '#7e7e7e', 'stone'],
  chiseled_sandstone: ['Gemeißelter Sandstein', '#d8cb9b', 'smooth'],
  quartz_block: ['Quarzblock', '#ebe5de', 'smooth'],
  chiseled_quartz_block: ['Gemeißelter Quarzblock', '#e7e2da', 'smooth'],
  quartz_pillar: ['Quarzsäule', '#ebe6e0', 'smooth'],
  quartz_bricks: ['Quarzziegel', '#eae5dd', 'stone_bricks'],
  purpur_pillar: ['Purpursäule', '#ab81ab', 'smooth'],
  glass: ['Glas', '#c0e3ec', 'glass'],
  glass_pane: ['Glasscheibe', '#c0e3ec', 'glass', 'pane'],
  tinted_glass: ['Getöntes Glas', '#2c2730', 'glass'],
  iron_bars: ['Eisengitter', '#8b8d8c', 'metal', 'pane'],
  iron_block: ['Eisenblock', '#dcdcdc', 'metal'],
  gold_block: ['Goldblock', '#f6d03d', 'metal'],
  diamond_block: ['Diamantblock', '#62ede4', 'metal'],
  emerald_block: ['Smaragdblock', '#2acb57', 'metal'],
  lapis_block: ['Lapislazuliblock', '#1e43a1', 'metal'],
  redstone_block: ['Redstone-Block', '#af1906', 'metal'],
  coal_block: ['Kohleblock', '#101010', 'smooth'],
  netherite_block: ['Netheritblock', '#42393b', 'metal'],
  copper_block: ['Kupferblock', '#c06b4f', 'metal'],
  amethyst_block: ['Amethystblock', '#8562c1', 'stone'],
  glowstone: ['Leuchtstein', '#ac8654', 'smooth'],
  sea_lantern: ['Seelaterne', '#acc8be', 'smooth'],
  shroomlight: ['Pilzlicht', '#f09246', 'smooth'],
  redstone_lamp: ['Redstone-Lampe', '#8b5a2b', 'smooth'],
  jack_o_lantern: ['Kürbislaterne', '#e3901d', 'smooth'],
  pumpkin: ['Kürbis', '#c6771c', 'smooth'],
  carved_pumpkin: ['Geschnitzter Kürbis', '#c6771c', 'smooth'],
  melon: ['Melone', '#6f9119', 'smooth'],
  hay_block: ['Strohballen', '#a68b0c', 'smooth'],
  bookshelf: ['Bücherregal', '#b38b52', 'planks'],
  ice: ['Eis', '#91b8fd', 'glass'],
  packed_ice: ['Packeis', '#8db4fa', 'smooth'],
  blue_ice: ['Blaueis', '#74a8fd', 'smooth'],
  snow_block: ['Schneeblock', '#f9fefe', 'smooth'],
  snow: ['Schnee', '#f9fefe', 'smooth', 'carpet'],
  magma_block: ['Magmablock', '#8e3f1f', 'stone'],
  slime_block: ['Schleimblock', '#6fc05b', 'glass'],
  honey_block: ['Honigblock', '#fbbc39', 'glass'],
  bone_block: ['Knochenblock', '#e1ddc9', 'smooth'],
  nether_wart_block: ['Netherwarzenblock', '#730302', 'wool'],
  warped_wart_block: ['Wirrwarzenblock', '#167879', 'wool'],
  sponge: ['Schwamm', '#c4c04a', 'wool'],
  wet_sponge: ['Nasser Schwamm', '#ab9d3d', 'wool'],
  terracotta: ['Keramik', '#985e43', 'smooth'],
  moss_block: ['Moosblock', '#596e2d', 'wool'],
  crafting_table: ['Werkbank', '#76573a', 'planks'],
  furnace: ['Ofen', '#6e6e6e', 'cobblestone'],
  blast_furnace: ['Schmelzofen', '#58575b', 'metal'],
  smoker: ['Räucherofen', '#5a4b3c', 'planks'],
  chest: ['Truhe', '#a4782e', 'planks'],
  trapped_chest: ['Redstone-Truhe', '#a4782e', 'planks'],
  barrel: ['Fass', '#8a6538', 'planks'],
  ender_chest: ['Endertruhe', '#263538', 'stone'],
  hopper: ['Trichter', '#4a4a4a', 'metal'],
  dispenser: ['Werfer', '#6e6e6e', 'cobblestone'],
  dropper: ['Spender', '#6e6e6e', 'cobblestone'],
  observer: ['Beobachter', '#646464', 'stone'],
  piston: ['Kolben', '#9b8259', 'planks'],
  sticky_piston: ['Klebriger Kolben', '#8e9c5b', 'planks'],
  note_block: ['Notenblock', '#5c3e2b', 'planks'],
  jukebox: ['Plattenspieler', '#5c3e2b', 'planks'],
  tnt: ['TNT', '#d23e1c', 'smooth'],
  composter: ['Komposter', '#7b5129', 'planks'],
  cauldron: ['Kessel', '#4a4a4a', 'metal'],
  anvil: ['Amboss', '#444444', 'metal'],
  beacon: ['Leuchtfeuer', '#76dddb', 'glass'],
  enchanting_table: ['Zaubertisch', '#541f1f', 'stone'],
  brewing_stand: ['Braustand', '#7a6a4d', 'metal', 'small'],
  target: ['Zielblock', '#e2aa9e', 'smooth'],
  lodestone: ['Leitstein', '#77787d', 'metal'],
  daylight_detector: ['Tageslichtsensor', '#827a6c', 'planks', 'slab'],
  scaffolding: ['Gerüst', '#aa8749', 'planks'],
  cobweb: ['Spinnennetz', '#dfe3e5', 'glass', 'small'],
  water: ['Wasser', '#3f76e4', 'water'],
  lava: ['Lava', '#d4590f', 'water'],
  // Kleinteile und Technik
  torch: ['Fackel', '#ffd862', 'smooth', 'small'],
  wall_torch: ['Fackel', '#ffd862', 'smooth', 'small'],
  soul_torch: ['Seelenfackel', '#7ae3e8', 'smooth', 'small'],
  soul_wall_torch: ['Seelenfackel', '#7ae3e8', 'smooth', 'small'],
  redstone_torch: ['Redstone-Fackel', '#d42b14', 'smooth', 'small'],
  redstone_wall_torch: ['Redstone-Fackel', '#d42b14', 'smooth', 'small'],
  lantern: ['Laterne', '#3b3b3b', 'metal', 'small'],
  soul_lantern: ['Seelenlaterne', '#3b4a50', 'metal', 'small'],
  end_rod: ['Endstab', '#e6dbcb', 'smooth', 'small'],
  chain: ['Kette', '#3d424b', 'metal', 'small'],
  redstone_wire: ['Redstone-Staub', '#b21b0a', 'smooth', 'carpet'],
  repeater: ['Redstone-Verstärker', '#9f9c97', 'smooth', 'slab'],
  comparator: ['Redstone-Komparator', '#a5a19b', 'smooth', 'slab'],
  lever: ['Hebel', '#7b6a4e', 'cobblestone', 'small'],
  tripwire_hook: ['Haken', '#8a8a8a', 'metal', 'small'],
  stone_button: ['Steinknopf', '#7e7e7e', 'stone', 'small'],
  stone_pressure_plate: ['Steindruckplatte', '#7e7e7e', 'stone', 'carpet'],
  light_weighted_pressure_plate: ['Wägeplatte (leicht)', '#f6d03d', 'metal', 'carpet'],
  heavy_weighted_pressure_plate: ['Wägeplatte (schwer)', '#dcdcdc', 'metal', 'carpet'],
  rail: ['Schiene', '#7d6e55', 'metal', 'carpet'],
  powered_rail: ['Antriebsschiene', '#a38b3a', 'metal', 'carpet'],
  detector_rail: ['Sensorschiene', '#7d6e55', 'metal', 'carpet'],
  activator_rail: ['Aktivierungsschiene', '#7d6e55', 'metal', 'carpet'],
  ladder: ['Leiter', '#a17d4e', 'planks', 'trapdoor'],
  vine: ['Ranken', '#3e6c1c', 'leaves', 'trapdoor'],
  flower_pot: ['Blumentopf', '#9a5a3c', 'smooth', 'small'],
  lily_pad: ['Seerosenblatt', '#208030', 'leaves', 'carpet'],
  campfire: ['Lagerfeuer', '#6b5235', 'log', 'slab'],
  iron_door: ['Eisentür', '#c2c2c2', 'metal'],
  iron_trapdoor: ['Eisenfalltür', '#c2c2c2', 'metal', 'trapdoor'],
  bell: ['Glocke', '#f6d03d', 'metal', 'small'],
  skeleton_skull: ['Skelettschädel', '#c9c9c9', 'smooth', 'small'],
  player_head: ['Spielerkopf', '#6b4a35', 'smooth', 'small'],
  cactus: ['Kaktus', '#5d8a2c', 'leaves'],
  sugar_cane: ['Zuckerrohr', '#94c065', 'leaves', 'small'],
  bamboo: ['Bambus', '#5d8a2c', 'leaves', 'fence'],
  wheat: ['Weizen', '#c0a43d', 'leaves', 'small'],
  short_grass: ['Gras', '#5f9e3c', 'leaves', 'small'],
  tall_grass: ['Hohes Gras', '#5f9e3c', 'leaves', 'small'],
  fern: ['Farn', '#4f8a2c', 'leaves', 'small'],
  poppy: ['Mohn', '#c42b14', 'leaves', 'small'],
  dandelion: ['Löwenzahn', '#f0d43a', 'leaves', 'small'],
  dragon_egg: ['Drachenei', '#0c0910', 'stone', 'small'],
  spawner: ['Spawner', '#1e2a37', 'metal'],
  command_block: ['Befehlsblock', '#b3876c', 'metal'],
  structure_block: ['Konstruktionsblock', '#594a5a', 'metal'],
  barrier: ['Barriere', '#e33f3f', 'glass'],
  nether_portal: ['Netherportal', '#5a0ad2', 'glass'],
  end_portal_frame: ['Endportalrahmen', '#5b7961', 'stone', 'slab'],
  conduit: ['Aquisator', '#9f8a70', 'smooth', 'small'],
  cake: ['Kuchen', '#e8d3b1', 'smooth', 'slab'],
};

// Selbstverständliche Rohstoffe, damit die Materialliste auch „Rohstoffe“ zeigen kann
function rawFor(id: string, wood?: string): Record<string, number> | undefined {
  if (wood && WOODS[wood]) {
    const log = `${WOODS[wood].de}stamm`;
    if (/_planks$/.test(id)) return { [log]: 0.25 };
    if (/_stairs$/.test(id)) return { [log]: 0.375 };
    if (/_slab$/.test(id)) return { [log]: 0.125 };
    if (/_(log|wood|stem|hyphae)$/.test(id)) return { [log]: 1 };
  }
  if (id === 'glass' || /stained_glass$/.test(id)) return { Sand: 1 };
  if (/glass_pane$/.test(id)) return { Sand: 0.375 };
  if (id === 'cobblestone') return { Bruchstein: 1 };
  if (id === 'stone_bricks') return { Bruchstein: 1 };
  return undefined;
}

const titleCase = (id: string) =>
  id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** Blockzustand → Bauplaner-Block; null = Luft oder nichts, was man bauen muss. */
export function mapBlock(state: BlockState): MappedBlock | null {
  const id = state.id.replace(/^minecraft:/, '');
  const p = state.props;
  if (
    /^(air|cave_air|void_air|structure_void|light|moving_piston|piston_head|fire|soul_fire)$/.test(
      id,
    )
  )
    return null;
  // Fließendes Wasser/Lava (level > 0) muss man nicht setzen
  if ((id === 'water' || id === 'lava') && p['level'] && p['level'] !== '0') return null;

  let name = '';
  let color = '#8a8a8a';
  let top: string | undefined;
  let texture: TextureKind = 'smooth';
  let shape: BlockShape | undefined;
  let dir: [number, number] | undefined;
  let half: 'top' | undefined;
  let item: string | undefined;
  let per: number | undefined;
  let wiki: string | undefined;
  let wood: string | undefined;

  const facing = p['facing'];
  const dirOf = (f?: string): [number, number] | undefined =>
    f === 'east'
      ? [1, 0]
      : f === 'west'
        ? [-1, 0]
        : f === 'south'
          ? [0, 1]
          : f === 'north'
            ? [0, -1]
            : undefined;

  // Gefärbte Blöcke nur, wenn der Rest wirklich eine Farbvariante ist (nicht red_sandstone)
  const dyeMatch = DYES.find((d) => id.startsWith(`${d}_`) && DYE_KINDS[id.slice(d.length + 1)]);
  const dye = dyeMatch;
  const woodKey = Object.keys(WOODS)
    .sort((a, b) => b.length - a.length)
    .find((w) => id.startsWith(`${w}_`) || id.startsWith(`stripped_${w}_`));

  if (dye) {
    const rest = id.slice(dye.length + 1);
    const de = DYE_DE[dye];
    color = DYE_COLOR[dye];
    const kinds = DYE_KINDS;
    const kind = kinds[rest];
    name = `${kind[0]} (${de})`;
    texture = kind[1];
    shape = kind[2];
    if (rest === 'terracotta') color = TERRACOTTA_COLOR[dye];
    if (rest.startsWith('stained_glass')) wiki = 'Gefärbtes Glas';
    // Bett: Kopf zählt nicht extra
    if (rest === 'bed' && p['part'] === 'head') per = 0;
  } else if (woodKey) {
    wood = woodKey;
    const w = WOODS[woodKey];
    const stripped = id.startsWith('stripped_');
    const rest = id.slice((stripped ? 'stripped_' : '').length + woodKey.length + 1);
    const nether = woodKey === 'crimson' || woodKey === 'warped';
    color = w.color;
    texture = 'planks';
    const forms: Record<string, [string, BlockShape?]> = {
      planks: [`${w.de}holzbretter`],
      stairs: [`${w.de}holztreppe`, 'stair'],
      slab: [`${w.de}holzstufe`, 'slab'],
      fence: [`${w.de}holzzaun`, 'fence'],
      fence_gate: [`${w.de}holzzauntor`, 'fence'],
      door: [`${w.de}holztür`],
      trapdoor: [`${w.de}holzfalltür`, 'trapdoor'],
      pressure_plate: [`${w.de}holzdruckplatte`, 'carpet'],
      button: [`${w.de}holzknopf`, 'small'],
      sign: [`${w.de}holzschild`, 'small'],
      wall_sign: [`${w.de}holzschild`, 'small'],
      hanging_sign: [`${w.de}holzhängeschild`, 'small'],
      leaves: [`${w.de}laub`],
      sapling: [`${w.de}setzling`, 'small'],
    };
    if (rest === 'log' || rest === 'stem' || rest === 'wood' || rest === 'hyphae') {
      const base = nether
        ? `${w.de}${rest === 'stem' ? 'stiel' : 'hyphen'}`
        : `${w.de}${rest === 'log' ? 'stamm' : 'holz'}`;
      name = stripped ? `Entrindeter ${base}` : base;
      texture = 'log';
      color = stripped ? w.color : w.log;
      top = w.color;
    } else if (forms[rest]) {
      [name, shape] = forms[rest];
      if (rest === 'leaves') {
        texture = 'leaves';
        color = w.leaves ?? '#4a7a27';
      }
      if (rest === 'door') texture = 'door';
    } else return fallback(id);
  } else {
    // Treppen, Stufen, Mauern aus Stein-Materialien
    const m = id.match(/^(.*)_(stairs|slab|wall)$/);
    const stoneBase = m ? (STONES[m[1]] ?? STONES[m[1].replace(/s$/, '')]) : undefined;
    if (m && stoneBase) {
      const suffix = m[2] === 'stairs' ? 'treppe' : m[2] === 'slab' ? 'stufe' : 'mauer';
      const base = stoneBase.de;
      // „Glatter Stein“ + „stufe“ → „Glatte Steinstufe“ wäre schöner; Grundform reicht zum Finden
      name = base.includes(' ') ? `${base}${suffix}` : `${base}${suffix}`;
      color = stoneBase.color;
      texture = stoneBase.texture;
      shape = m[2] === 'stairs' ? 'stair' : m[2] === 'slab' ? 'slab' : 'wall';
    } else if (STONES[id] && !BLOCKS[id]) {
      name = STONES[id].de;
      color = STONES[id].color;
      texture = STONES[id].texture;
    } else if (BLOCKS[id]) {
      const e = BLOCKS[id];
      [name, color, texture] = e;
      shape = e[3];
      wiki = e[4];
    } else if (/_ore$/.test(id)) {
      name = `${titleCase(id.replace(/^deepslate_/, '').replace(/_ore$/, ''))}-Erz`;
      color = id.startsWith('deepslate') ? '#4d4d50' : '#7e7e7e';
      texture = 'stone';
    } else {
      return fallback(id);
    }
  }

  // Ausrichtung und Hälfte
  if (shape === 'stair') {
    dir = dirOf(facing) ?? [0, 1];
    if (p['half'] === 'top') half = 'top';
  }
  if (shape === 'slab') {
    if (p['type'] === 'top') shape = 'slab_top';
    if (p['type'] === 'double') {
      shape = undefined;
      item = name;
      per = 2;
      name = `${name} (doppelt)`;
    }
  }
  if (shape === 'trapdoor') {
    if (p['open'] === 'true') dir = dirOf(opposite(facing));
    else if (p['half'] === 'top') half = 'top';
  }
  if (shape === 'pane' && facing) dir = dirOf(facing);
  // Türen: obere Hälfte zählt nicht extra
  if (/_door$/.test(id) && p['half'] === 'upper') {
    item = name;
    per = 0;
    name = `${name} (oben)`;
  }

  const def: BlockDef = { name, color, texture };
  if (top) def.top = top;
  if (shape) def.shape = shape;
  if (dir) def.dir = dir;
  if (half) def.half = half;
  if (item) def.item = item;
  if (per !== undefined) def.per = per;
  if (wiki) def.wiki = wiki;
  if (texture === 'glass') def.glass = true;
  const raw = rawFor(id, wood);
  if (raw) def.raw = raw;
  return { key: JSON.stringify([name, shape ?? '', dir ?? '', half ?? '']), def };
}

function opposite(f?: string): string | undefined {
  return f === 'north'
    ? 'south'
    : f === 'south'
      ? 'north'
      : f === 'east'
        ? 'west'
        : f === 'west'
          ? 'east'
          : f;
}

/** Unbekannter Block: englischen Namen lesbar machen, Form am Namen erraten. */
function fallback(id: string): MappedBlock {
  const name = titleCase(id);
  const shape: BlockShape | undefined = /_stairs$/.test(id)
    ? 'stair'
    : /_slab$/.test(id)
      ? 'slab'
      : /_(fence|fence_gate)$/.test(id)
        ? 'fence'
        : /_wall$/.test(id)
          ? 'wall'
          : /_pane$/.test(id)
            ? 'pane'
            : /_(carpet|pressure_plate|rail)$/.test(id)
              ? 'carpet'
              : /(torch|button|lantern|candle|flower|sapling|head|skull|pot)/.test(id)
                ? 'small'
                : undefined;
  const def: BlockDef = { name, color: '#8a8a8a', texture: 'smooth', wiki: name };
  if (shape) def.shape = shape;
  return { key: JSON.stringify([name, shape ?? '']), def };
}

/** Parst "minecraft:oak_stairs[facing=east,half=top]" (Sponge/Litematica). */
export function parseStateString(value: string): BlockState {
  const m = value.match(/^([^[]+)(?:\[(.*)\])?$/);
  const props: Record<string, string> = {};
  for (const pair of (m?.[2] ?? '').split(',')) {
    const [k, v] = pair.split('=');
    if (k && v !== undefined) props[k.trim()] = v.trim();
  }
  return { id: (m?.[1] ?? value).replace(/^minecraft:/, ''), props };
}

// ---------------------------------------------------------------------------
// Alte Zahlen-IDs (MCEdit-.schematic, vor 1.13)
// ---------------------------------------------------------------------------

const LEGACY_WOOD = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];
const LEGACY_FACING = ['east', 'west', 'south', 'north'];
const LEGACY_SLAB = [
  'smooth_stone',
  'sandstone',
  'oak',
  'cobblestone',
  'brick',
  'stone_brick',
  'nether_brick',
  'quartz',
];

const LEGACY: Record<number, string> = {
  1: 'stone',
  2: 'grass_block',
  3: 'dirt',
  4: 'cobblestone',
  5: 'planks',
  6: 'sapling',
  7: 'bedrock',
  8: 'water',
  9: 'water',
  10: 'lava',
  11: 'lava',
  12: 'sand',
  13: 'gravel',
  14: 'gold_ore',
  15: 'iron_ore',
  16: 'coal_ore',
  17: 'log',
  18: 'leaves',
  19: 'sponge',
  20: 'glass',
  21: 'lapis_ore',
  22: 'lapis_block',
  23: 'dispenser',
  24: 'sandstone',
  25: 'note_block',
  26: 'red_bed',
  27: 'powered_rail',
  28: 'detector_rail',
  29: 'sticky_piston',
  30: 'cobweb',
  31: 'short_grass',
  32: 'short_grass',
  33: 'piston',
  35: 'wool',
  37: 'dandelion',
  38: 'poppy',
  39: 'brown_mushroom',
  40: 'red_mushroom',
  41: 'gold_block',
  42: 'iron_block',
  43: 'double_slab',
  44: 'slab',
  45: 'bricks',
  46: 'tnt',
  47: 'bookshelf',
  48: 'mossy_cobblestone',
  49: 'obsidian',
  50: 'torch',
  52: 'spawner',
  53: 'oak_stairs',
  54: 'chest',
  55: 'redstone_wire',
  56: 'diamond_ore',
  57: 'diamond_block',
  58: 'crafting_table',
  59: 'wheat',
  60: 'farmland',
  61: 'furnace',
  62: 'furnace',
  63: 'oak_sign',
  64: 'oak_door',
  65: 'ladder',
  66: 'rail',
  67: 'cobblestone_stairs',
  68: 'oak_wall_sign',
  69: 'lever',
  70: 'stone_pressure_plate',
  71: 'iron_door',
  72: 'oak_pressure_plate',
  73: 'redstone_ore',
  74: 'redstone_ore',
  75: 'redstone_torch',
  76: 'redstone_torch',
  77: 'stone_button',
  78: 'snow',
  79: 'ice',
  80: 'snow_block',
  81: 'cactus',
  82: 'clay',
  83: 'sugar_cane',
  84: 'jukebox',
  85: 'oak_fence',
  86: 'pumpkin',
  87: 'netherrack',
  88: 'soul_sand',
  89: 'glowstone',
  90: 'nether_portal',
  91: 'jack_o_lantern',
  92: 'cake',
  93: 'repeater',
  94: 'repeater',
  95: 'stained_glass',
  96: 'oak_trapdoor',
  97: 'infested_stone',
  98: 'stone_bricks',
  99: 'brown_mushroom_block',
  100: 'red_mushroom_block',
  101: 'iron_bars',
  102: 'glass_pane',
  103: 'melon',
  104: 'pumpkin_stem',
  105: 'melon_stem',
  106: 'vine',
  107: 'oak_fence_gate',
  108: 'brick_stairs',
  109: 'stone_brick_stairs',
  110: 'mycelium',
  111: 'lily_pad',
  112: 'nether_bricks',
  113: 'nether_brick_fence',
  114: 'nether_brick_stairs',
  115: 'nether_wart',
  116: 'enchanting_table',
  117: 'brewing_stand',
  118: 'cauldron',
  120: 'end_portal_frame',
  121: 'end_stone',
  122: 'dragon_egg',
  123: 'redstone_lamp',
  124: 'redstone_lamp',
  125: 'double_wooden_slab',
  126: 'wooden_slab',
  127: 'cocoa',
  128: 'sandstone_stairs',
  129: 'emerald_ore',
  130: 'ender_chest',
  131: 'tripwire_hook',
  132: 'tripwire',
  133: 'emerald_block',
  134: 'spruce_stairs',
  135: 'birch_stairs',
  136: 'jungle_stairs',
  137: 'command_block',
  138: 'beacon',
  139: 'cobblestone_wall',
  140: 'flower_pot',
  141: 'carrots',
  142: 'potatoes',
  143: 'oak_button',
  144: 'skeleton_skull',
  145: 'anvil',
  146: 'trapped_chest',
  147: 'light_weighted_pressure_plate',
  148: 'heavy_weighted_pressure_plate',
  149: 'comparator',
  150: 'comparator',
  151: 'daylight_detector',
  152: 'redstone_block',
  153: 'nether_quartz_ore',
  154: 'hopper',
  155: 'quartz',
  156: 'quartz_stairs',
  157: 'activator_rail',
  158: 'dropper',
  159: 'stained_terracotta',
  160: 'stained_glass_pane',
  161: 'leaves2',
  162: 'log2',
  163: 'acacia_stairs',
  164: 'dark_oak_stairs',
  165: 'slime_block',
  166: 'barrier',
  167: 'iron_trapdoor',
  168: 'prismarine_variant',
  169: 'sea_lantern',
  170: 'hay_block',
  171: 'carpet',
  172: 'terracotta',
  173: 'coal_block',
  174: 'packed_ice',
  175: 'tall_grass',
  176: 'white_banner',
  177: 'white_wall_banner',
  178: 'daylight_detector',
  179: 'red_sandstone',
  180: 'red_sandstone_stairs',
  181: 'double_red_sandstone_slab',
  182: 'red_sandstone_slab',
  183: 'spruce_fence_gate',
  184: 'birch_fence_gate',
  185: 'jungle_fence_gate',
  186: 'dark_oak_fence_gate',
  187: 'acacia_fence_gate',
  188: 'spruce_fence',
  189: 'birch_fence',
  190: 'jungle_fence',
  191: 'dark_oak_fence',
  192: 'acacia_fence',
  193: 'spruce_door',
  194: 'birch_door',
  195: 'jungle_door',
  196: 'acacia_door',
  197: 'dark_oak_door',
  198: 'end_rod',
  199: 'chorus_plant',
  200: 'chorus_flower',
  201: 'purpur_block',
  202: 'purpur_pillar',
  203: 'purpur_stairs',
  204: 'double_purpur_slab',
  205: 'purpur_slab',
  206: 'end_stone_bricks',
  207: 'beetroots',
  208: 'dirt_path',
  210: 'command_block',
  211: 'command_block',
  212: 'ice',
  213: 'magma_block',
  214: 'nether_wart_block',
  215: 'red_nether_bricks',
  216: 'bone_block',
  218: 'observer',
  219: 'shulker_box',
  251: 'concrete',
  252: 'concrete_powder',
  255: 'structure_block',
};

/** Alte ID + Datenwert → moderner Blockzustand. */
export function legacyState(id: number, data: number): BlockState | null {
  if (id === 0) return null;
  const base = LEGACY[id];
  if (!base) {
    if (id >= 219 && id <= 234) return { id: `${DYES[id - 219]}_shulker_box`, props: {} };
    if (id >= 235 && id <= 250) return { id: `${DYES[id - 235]}_glazed_terracotta`, props: {} };
    return { id: `legacy_${id}`, props: {} };
  }
  const props: Record<string, string> = {};
  const wood = (i: number) => LEGACY_WOOD[i] ?? 'oak';
  if (/_stairs$/.test(base)) {
    props['facing'] = LEGACY_FACING[data & 3];
    if (data & 4) props['half'] = 'top';
    return { id: base, props };
  }
  if (/_door$/.test(base) || base === 'iron_door') {
    props['half'] = data & 8 ? 'upper' : 'lower';
    return { id: base, props };
  }
  if (/_trapdoor$/.test(base)) {
    // Bits: 0–1 Wand (S, N, O, W), 4 offen, 8 obere Hälfte
    props['facing'] = ['north', 'south', 'west', 'east'][data & 3];
    if (data & 4) props['open'] = 'true';
    if (data & 8) props['half'] = 'top';
    return { id: base, props };
  }
  switch (base) {
    case 'stone':
      return {
        id:
          [
            'stone',
            'granite',
            'polished_granite',
            'diorite',
            'polished_diorite',
            'andesite',
            'polished_andesite',
          ][data] ?? 'stone',
        props,
      };
    case 'dirt':
      return { id: ['dirt', 'coarse_dirt', 'podzol'][data] ?? 'dirt', props };
    case 'planks':
      return { id: `${wood(data)}_planks`, props };
    case 'sapling':
      return { id: `${wood(data & 7)}_sapling`, props };
    case 'sand':
      return { id: data === 1 ? 'red_sand' : 'sand', props };
    case 'log':
      return { id: `${wood(data & 3)}_log`, props };
    case 'log2':
      return { id: `${wood(4 + (data & 1))}_log`, props };
    case 'leaves':
      return { id: `${wood(data & 3)}_leaves`, props };
    case 'leaves2':
      return { id: `${wood(4 + (data & 1))}_leaves`, props };
    case 'sandstone':
      return {
        id: ['sandstone', 'chiseled_sandstone', 'cut_sandstone'][data] ?? 'sandstone',
        props,
      };
    case 'red_sandstone':
      return { id: 'red_sandstone', props };
    case 'wool':
      return { id: `${DYES[data & 15]}_wool`, props };
    case 'carpet':
      return { id: `${DYES[data & 15]}_carpet`, props };
    case 'stained_glass':
      return { id: `${DYES[data & 15]}_stained_glass`, props };
    case 'stained_glass_pane':
      return { id: `${DYES[data & 15]}_stained_glass_pane`, props };
    case 'stained_terracotta':
      return { id: `${DYES[data & 15]}_terracotta`, props };
    case 'concrete':
      return { id: `${DYES[data & 15]}_concrete`, props };
    case 'concrete_powder':
      return { id: `${DYES[data & 15]}_concrete_powder`, props };
    case 'stone_bricks':
      return {
        id:
          ['stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks'][
            data
          ] ?? 'stone_bricks',
        props,
      };
    case 'quartz':
      return {
        id: data === 1 ? 'chiseled_quartz_block' : data >= 2 ? 'quartz_pillar' : 'quartz_block',
        props,
      };
    case 'prismarine_variant':
      return {
        id: ['prismarine', 'prismarine_bricks', 'dark_prismarine'][data] ?? 'prismarine',
        props,
      };
    case 'cobblestone_wall':
      return { id: data === 1 ? 'mossy_cobblestone_wall' : 'cobblestone_wall', props };
    case 'slab': {
      const kind = LEGACY_SLAB[data & 7];
      return { id: `${kind}_slab`, props: { type: data & 8 ? 'top' : 'bottom' } };
    }
    case 'double_slab': {
      if (data === 8) return { id: 'smooth_stone', props };
      if (data === 9) return { id: 'smooth_sandstone', props };
      return { id: `${LEGACY_SLAB[data & 7]}_slab`, props: { type: 'double' } };
    }
    case 'wooden_slab':
      return { id: `${wood(data & 7)}_slab`, props: { type: data & 8 ? 'top' : 'bottom' } };
    case 'double_wooden_slab':
      return { id: `${wood(data & 7)}_slab`, props: { type: 'double' } };
    case 'red_sandstone_slab':
      return { id: 'red_sandstone_slab', props: { type: data & 8 ? 'top' : 'bottom' } };
    case 'double_red_sandstone_slab':
      return { id: 'red_sandstone_slab', props: { type: 'double' } };
    case 'purpur_slab':
      return { id: 'purpur_slab', props: { type: data & 8 ? 'top' : 'bottom' } };
    case 'double_purpur_slab':
      return { id: 'purpur_slab', props: { type: 'double' } };
    case 'water':
    case 'lava':
      return { id: base, props: { level: String(data & 7) } };
    case 'red_bed':
      return { id: 'red_bed', props: { part: data & 8 ? 'head' : 'foot' } };
    default:
      return { id: base, props };
  }
}
