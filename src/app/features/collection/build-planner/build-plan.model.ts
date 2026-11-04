// Bauplaner: Datenformat „bauplaner/1“, Auswertung (Maße, Schritte, Material), Import-Prüfung
// und die Prompts für eine KI, die neue Baupläne als JSON-Datei liefert.
//
// layers[y][z] ist eine Textzeile, das Zeichen an Index x ist der Block. y = 0 ist unten,
// z = 0 ist vorne, x = 0 ist links (von vorne gesehen). "." oder Leerzeichen = Luft.

export const PLAN_FORMAT = 'bauplaner/1';

// Pixel-Texturen, die der Planer zeichnen kann (siehe block-textures.ts)
export const TEXTURES = [
  'planks',
  'log',
  'cobblestone',
  'stone',
  'stone_bricks',
  'bricks',
  'dirt',
  'grass',
  'sand',
  'gravel',
  'glass',
  'leaves',
  'wool',
  'door',
  'metal',
  'smooth',
  'water',
] as const;
export type TextureKind = (typeof TEXTURES)[number];

export const SHAPES = [
  'block',
  'stair',
  'slab',
  'slab_top',
  'fence',
  'wall',
  'pane',
  'trapdoor',
  'carpet',
  'small',
] as const;
export type BlockShape = (typeof SHAPES)[number];

export interface BlockDef {
  name: string;
  color: string;
  top?: string;
  texture?: TextureKind;
  shape?: BlockShape;
  // Treppe: Richtung, in die sie ansteigt, als [dx, dz]; [0, 1] = nach hinten.
  // Glasscheibe ohne Nachbarn: Richtung, in der sie verläuft
  dir?: [number, number];
  // Treppe/Falltür in der oberen Blockhälfte (umgedreht)
  half?: 'top';
  // Gezählt wird unter diesem Namen (z. B. obere Türhälfte zählt zur Tür)
  item?: string;
  // Wie viele Items ein Block kostet; 0 = zählt nicht extra (obere Türhälfte)
  per?: number;
  abbr?: string;
  farm?: string;
  raw?: Record<string, number>;
  alpha?: number;
  glass?: boolean;
  stack?: number;
}

export interface PlanStep {
  title: string;
  text?: string;
  layers?: number[];
  blocks?: string[];
}

export interface BuildPlan {
  format?: string;
  id?: string;
  name: string;
  description?: string;
  front?: string;
  palette: Record<string, BlockDef>;
  layers: string[][];
  steps?: PlanStep[];
  // Vorlagen: Video oder Seiten, an denen sich der Bau orientiert
  sources?: string[];
}

export interface PlacedBlock {
  x: number;
  y: number;
  z: number;
  ch: string;
  step: number;
}

export interface PlanAnalysis {
  blocks: PlacedBlock[];
  map: Map<string, PlacedBlock>;
  W: number;
  D: number;
  H: number;
  steps: PlanStep[];
}

export interface ItemCount {
  name: string;
  count: number;
  def: BlockDef;
  key: string;
}

export interface PlanProgress {
  done?: number[];
  have?: string[];
}

export const blockKey = (x: number, y: number, z: number): string => `${x},${y},${z}`;
const isAir = (ch: string): boolean => ch === '.' || ch === ' ';
const itemName = (def: BlockDef): string => def.item || def.name;
const perOf = (def: BlockDef): number => (def.per == null ? 1 : def.per);

export function analyzePlan(plan: BuildPlan): PlanAnalysis {
  const blocks: PlacedBlock[] = [];
  const map = new Map<string, PlacedBlock>();
  const H = plan.layers.length;
  let W = 0;
  let D = 0;
  plan.layers.forEach((rows, y) => {
    D = Math.max(D, rows.length);
    rows.forEach((row, z) => {
      W = Math.max(W, row.length);
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (isAir(ch) || !plan.palette[ch]) continue;
        const block: PlacedBlock = { x, y, z, ch, step: -1 };
        blocks.push(block);
        map.set(blockKey(x, y, z), block);
      }
    });
  });

  const steps: PlanStep[] = (
    plan.steps?.length ? plan.steps : [{ title: 'Alles bauen', text: '' }]
  ).map((step) => ({ ...step }));
  for (const block of blocks) {
    block.step = steps.findIndex((step) => {
      const range = step.layers?.length ? step.layers : [0, H - 1];
      return (
        block.y >= range[0] &&
        block.y <= range[range.length - 1] &&
        (!step.blocks?.length || step.blocks.includes(block.ch))
      );
    });
  }
  if (blocks.some((block) => block.step < 0)) {
    steps.push({
      title: 'Restliche Blöcke',
      text: 'Alles, was in den Schritten davor noch nicht dran war.',
    });
    const last = steps.length - 1;
    blocks.forEach((block) => {
      if (block.step < 0) block.step = last;
    });
  }
  return { blocks, map, W, D, H, steps };
}

export function countItems(plan: BuildPlan, list: PlacedBlock[]): ItemCount[] {
  const counts = new Map<string, ItemCount>();
  for (const block of list) {
    const def = plan.palette[block.ch];
    const per = perOf(def);
    const name = itemName(def);
    let entry = counts.get(name);
    if (!entry) {
      entry = { name, count: 0, def, key: block.ch };
      counts.set(name, entry);
    }
    entry.count += per;
    // Für Farbe und Hinweise lieber den Block nehmen, der wirklich zählt
    if (per > 0 && entry.def.per === 0) {
      entry.def = def;
      entry.key = block.ch;
    }
  }
  return [...counts.values()].filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count);
}

export function rawTotals(plan: BuildPlan, list: PlacedBlock[]): { name: string; count: number }[] {
  const totals = new Map<string, number>();
  for (const block of list) {
    const def = plan.palette[block.ch];
    const per = perOf(def);
    if (!per || !def.raw) continue;
    for (const [name, amount] of Object.entries(def.raw)) {
      totals.set(name, (totals.get(name) ?? 0) + amount * per);
    }
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, count: Math.ceil(value - 1e-9) }))
    .sort((a, b) => b.count - a.count);
}

export function stacksLabel(count: number, size = 64): string {
  if (count < size) return '';
  const stacks = Math.floor(count / size);
  const rest = count % size;
  return `${stacks} Stack${stacks > 1 ? 's' : ''}${rest ? ` + ${rest}` : ''}`;
}

export function totalBlocks(plan: BuildPlan, analysis: PlanAnalysis): number {
  return countItems(plan, analysis.blocks).reduce((sum, item) => sum + item.count, 0);
}

// ---------------------------------------------------------------------------
// Import: KI-Antwort (auch mit Text oder ```json drumherum) lesen, prüfen, aufräumen
// ---------------------------------------------------------------------------

export const LIMITS = { size: 64, height: 96, paletteSize: 40, steps: 80 };

export type ParseResult =
  { plan: BuildPlan; error?: undefined } | { plan?: undefined; error: string };

/** Holt das JSON-Objekt aus einer KI-Antwort: Codeblock, umgebender Text oder reines JSON. */
export function extractJson(text: string): string {
  const trimmed = text.replace(/^﻿/, '').trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : trimmed;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parsePlan(text: string): ParseResult {
  if (!text.trim()) return { error: 'Füg zuerst den Bauplan ein oder wähl eine Datei.' };
  if (!text.includes('{') && /nicht ansehen|can(no|')t (watch|view|access)/i.test(text)) {
    return {
      error:
        'Die KI konnte das Video nicht ansehen. Nimm dafür Gemini, am besten in Google AI Studio mit einem Pro-Modell.',
    };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(text));
  } catch {
    return {
      error: 'Das ist kein gültiges JSON. Prüf, ob die Antwort der KI vollständig kopiert wurde.',
    };
  }
  return validatePlan(raw);
}

export function validatePlan(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Der Bauplan muss ein JSON-Objekt sein.' };
  }
  const input = raw as Record<string, unknown>;
  const name = typeof input['name'] === 'string' ? input['name'].trim() : '';
  if (!name) return { error: 'Es fehlt ein Name („name“).' };

  const paletteIn = input['palette'];
  if (!paletteIn || typeof paletteIn !== 'object' || Array.isArray(paletteIn)) {
    return { error: 'Es fehlt die Blockliste („palette“).' };
  }
  const palette: Record<string, BlockDef> = {};
  const entries = Object.entries(paletteIn as Record<string, unknown>);
  if (!entries.length) return { error: 'Die Blockliste („palette“) ist leer.' };
  if (entries.length > LIMITS.paletteSize) {
    return { error: `Höchstens ${LIMITS.paletteSize} verschiedene Blöcke pro Bau.` };
  }
  for (const [key, value] of entries) {
    if ([...key].length !== 1 || isAir(key)) {
      return { error: `„${key}“ geht nicht als Blockzeichen: genau ein Zeichen, kein Punkt.` };
    }
    const def = value as Partial<BlockDef> | null;
    if (!def || typeof def !== 'object' || typeof def.name !== 'string' || !def.name.trim()) {
      return { error: `Block „${key}“ braucht einen Namen („name“).` };
    }
    if (typeof def.color !== 'string' || !HEX.test(def.color.trim())) {
      return { error: `Block „${key}“ braucht eine Farbe als Hex-Wert, z. B. "#8a6a3c".` };
    }
    palette[key] = cleanBlock(def as BlockDef);
  }

  const layersIn = input['layers'];
  if (
    !Array.isArray(layersIn) ||
    !layersIn.length ||
    !layersIn.every(
      (layer) => Array.isArray(layer) && layer.every((row) => typeof row === 'string'),
    )
  ) {
    return {
      error: '„layers“ muss eine Liste von Ebenen sein, jede Ebene eine Liste von Textzeilen.',
    };
  }
  const layers = layersIn as string[][];
  if (layers.length > LIMITS.height) return { error: `Höchstens ${LIMITS.height} Ebenen hoch.` };
  const depth = Math.max(...layers.map((layer) => layer.length));
  const width = Math.max(...layers.flatMap((layer) => layer.map((row) => [...row].length)));
  if (!width || !depth) return { error: 'Der Bauplan enthält keine Blöcke.' };
  if (width > LIMITS.size || depth > LIMITS.size) {
    return { error: `Höchstens ${LIMITS.size} × ${LIMITS.size} Blöcke Grundfläche.` };
  }
  const unknown = new Set<string>();
  let count = 0;
  // Ungleich lange Zeilen und Ebenen mit Luft auffüllen, damit alles ein Quader ist
  const normalized = layers.map((layer) => {
    const rows = layer.map((row) => {
      const chars = [...row];
      for (const ch of chars) {
        if (isAir(ch)) continue;
        if (!palette[ch]) unknown.add(ch);
        else count++;
      }
      return chars
        .map((ch) => (isAir(ch) ? '.' : ch))
        .join('')
        .padEnd(width, '.');
    });
    while (rows.length < depth) rows.push('.'.repeat(width));
    return rows;
  });
  if (unknown.size) {
    return {
      error: `Diese Zeichen kommen in „layers“ vor, fehlen aber in der „palette“: ${[...unknown].join(' ')}`,
    };
  }
  if (!count) return { error: 'Der Bauplan enthält keine Blöcke.' };

  const stepsIn = input['steps'];
  let steps: PlanStep[] | undefined;
  if (stepsIn != null) {
    if (!Array.isArray(stepsIn)) return { error: '„steps“ muss eine Liste sein.' };
    if (stepsIn.length > LIMITS.steps) return { error: `Höchstens ${LIMITS.steps} Bauschritte.` };
    steps = [];
    for (const [index, value] of stepsIn.entries()) {
      const step = value as Partial<PlanStep> | null;
      if (!step || typeof step !== 'object' || typeof step.title !== 'string') {
        return { error: `Bauschritt ${index + 1} braucht einen Titel („title“).` };
      }
      const range = Array.isArray(step.layers)
        ? step.layers.filter((n): n is number => Number.isInteger(n)).slice(0, 2)
        : undefined;
      const blocks = Array.isArray(step.blocks)
        ? step.blocks.filter((b): b is string => typeof b === 'string' && !!palette[b])
        : undefined;
      steps.push({
        title: step.title.trim() || `Schritt ${index + 1}`,
        text: typeof step.text === 'string' ? step.text : '',
        ...(range?.length ? { layers: range } : {}),
        ...(blocks?.length ? { blocks } : {}),
      });
    }
  }

  const plan: BuildPlan = {
    format: PLAN_FORMAT,
    name: name.slice(0, 120),
    description: typeof input['description'] === 'string' ? input['description'] : '',
    front: typeof input['front'] === 'string' ? input['front'] : undefined,
    palette,
    layers: normalized,
    ...(steps?.length ? { steps } : {}),
  };
  if (typeof input['id'] === 'string') plan.id = input['id'].slice(0, 80);
  const sources = Array.isArray(input['sources'])
    ? input['sources'].filter(
        (url): url is string => typeof url === 'string' && /^https?:\/\/\S+$/.test(url.trim()),
      )
    : [];
  if (sources.length) plan.sources = sources.slice(0, 10).map((url) => url.trim().slice(0, 500));
  return { plan };
}

// Falls die KI "shape" vergisst: am Blocknamen erkennen
function shapeFromName(name: string): BlockShape | null {
  const n = name.toLowerCase();
  const rules: [RegExp, BlockShape][] = [
    [/falltür|trapdoor/, 'trapdoor'],
    [/zaun|fence/, 'fence'],
    [/mauer$|\bwall\b/, 'wall'],
    [/scheibe|gitter|pane|bars/, 'pane'],
    [/teppich|carpet|druckplatte/, 'carpet'],
    [/laterne|fackel|blumentopf|knopf|lantern|torch/, 'small'],
    [/treppe|stairs/, 'stair'],
    [/stufe|slab/, 'slab'],
  ];
  return rules.find(([pattern]) => pattern.test(n))?.[1] ?? null;
}

function cleanBlock(def: BlockDef): BlockDef {
  const out: BlockDef = { name: def.name.trim().slice(0, 60), color: def.color.trim() };
  if (typeof def.top === 'string' && HEX.test(def.top.trim())) out.top = def.top.trim();
  if (typeof def.texture === 'string' && (TEXTURES as readonly string[]).includes(def.texture)) {
    out.texture = def.texture;
  }
  if (
    typeof def.shape === 'string' &&
    def.shape !== 'block' &&
    (SHAPES as readonly string[]).includes(def.shape)
  ) {
    out.shape = def.shape;
  } else if (!def.shape) {
    const shape = shapeFromName(out.name);
    if (shape) out.shape = shape;
  }
  if (def.half === 'top') out.half = 'top';
  if (
    Array.isArray(def.dir) &&
    def.dir.length === 2 &&
    def.dir.every((n) => n === -1 || n === 0 || n === 1) &&
    Math.abs(def.dir[0]) + Math.abs(def.dir[1]) === 1
  ) {
    out.dir = [def.dir[0], def.dir[1]];
  }
  if (typeof def.item === 'string' && def.item.trim()) out.item = def.item.trim().slice(0, 60);
  if (typeof def.per === 'number' && def.per >= 0 && def.per <= 64) out.per = def.per;
  if (typeof def.abbr === 'string') out.abbr = def.abbr.slice(0, 3);
  if (typeof def.farm === 'string') out.farm = def.farm.slice(0, 400);
  if (def.raw && typeof def.raw === 'object' && !Array.isArray(def.raw)) {
    const raw = Object.entries(def.raw).filter(
      ([, value]) => typeof value === 'number' && value > 0 && value < 1000,
    );
    if (raw.length) out.raw = Object.fromEntries(raw);
  }
  if (typeof def.alpha === 'number' && def.alpha > 0 && def.alpha <= 1) out.alpha = def.alpha;
  if (def.glass === true) out.glass = true;
  if (typeof def.stack === 'number' && [1, 16, 64].includes(def.stack)) out.stack = def.stack;
  return out;
}

// ---------------------------------------------------------------------------
// Prompts für die KI
// ---------------------------------------------------------------------------

export interface IdeaForm {
  name: string;
  what: string;
  size: string;
  style: string;
  blocks: string;
  extra: string;
  mode: 'survival' | 'creative';
  // Eigene Idee oder Nachbau aus einem YouTube-Video
  source: 'idea' | 'video';
  videoUrl: string;
}

export const EMPTY_IDEA: IdeaForm = {
  name: '',
  what: '',
  size: '',
  style: '',
  blocks: '',
  extra: '',
  mode: 'survival',
  source: 'idea',
  videoUrl: '',
};

const YOUTUBE =
  /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com\/(watch\?\S*v=|shorts\/|live\/|embed\/)|youtu\.be\/)[\w-]{6,}/i;

export function isYoutubeUrl(url: string): boolean {
  return YOUTUBE.test(url.trim());
}

const FORMAT_SPEC = `## Dateiformat „${PLAN_FORMAT}“

Antworte mit genau EINER JSON-Datei (UTF-8, kein JavaScript, keine Kommentare). Wenn du Dateien erstellen kannst, gib sie als Datei „bauplan-<name>.json“ aus, sonst als einen einzigen \`\`\`json-Codeblock ohne weiteren Text.

{
  "format": "${PLAN_FORMAT}",
  "id": "kurzer-slug-ohne-leerzeichen",
  "name": "Name des Baus",
  "description": "2–3 Sätze: was es ist, Größe, Hauptmaterialien",
  "front": "Was vorne ist, z. B. Tür-Seite",
  "palette": {
    "<ein Zeichen>": {
      "name": "Blockname auf Deutsch, wie im Spiel",
      "color": "#rrggbb (typische Farbe der Seitenfläche)",
      "top": "#rrggbb (optional, Farbe der Oberseite)",
      "texture": "${TEXTURES.join(' | ')}",
      "shape": "${SHAPES.join(' | ')} (optional, Standard block)",
      "dir": [0, 1],
      "half": "top (optional: umgedrehte Treppe / obere Falltür)",
      "item": "optional: zählt unter diesem Namen",
      "per": 1,
      "abbr": "2 Buchstaben",
      "farm": "1 Satz: wie man den Block im Survival bekommt",
      "raw": { "Rohstoff": 1 }
    }
  },
  "layers": [
    ["Zeile z=0 (vorne)", "Zeile z=1", "..."],
    ["nächste Ebene darüber", "..."]
  ],
  "steps": [
    { "title": "Kurzer Titel", "text": "1–3 Sätze Anleitung", "layers": [0, 0], "blocks": ["C"] }
  ],
  "sources": ["https://… (Links zu Vorlagen, an denen du dich orientiert hast)"]
}

## Regeln

1. Koordinaten: layers[y][z] ist eine Zeile, das Zeichen an Position x ist der Block. y = 0 ist die unterste Ebene, z = 0 die vorderste Zeile, x = 0 ganz links (von vorne gesehen). "." ist Luft.
2. Jede Zeile einer Ebene ist gleich lang, jede Ebene hat gleich viele Zeilen. Höchstens ${LIMITS.size} × ${LIMITS.size} Grundfläche und ${LIMITS.height} Ebenen.
3. Jeder Block in der palette hat genau ein Zeichen als Schlüssel (Buchstabe oder Ziffer, nicht "."). Jedes Zeichen in layers muss in der palette stehen.
4. "texture" bestimmt die Pixel-Optik: planks (Bretter, auch Holztreppen/-stufen/-zäune/-falltüren), log (Stämme), cobblestone, stone, stone_bricks, bricks, dirt, grass, sand, gravel, glass (auch Glasscheiben), leaves, wool (auch Beton/Terrakotta/Teppich), door, metal (auch Laternen/Eisengitter), smooth, water. "color" ist die echte Farbe des Blocks im Spiel (z. B. Fichte #6e5132, Eiche #b38b52, Dunkle Eiche #4a3220, Birke #c5b37b, Bruchstein #878787, Tiefenschiefer #4b4b50).
5. Formen ("shape"), damit der Bau in der 3D-Ansicht echt aussieht – nutze sie, statt alles aus vollen Blöcken zu bauen:
   - "stair": Treppe, "dir" = Richtung, in die sie ansteigt: [0, 1] nach hinten, [0, -1] nach vorne, [1, 0] nach rechts, [-1, 0] nach links. Mit "half": "top" umgedreht (z. B. Dachunterseite, Fensterbank). Für jede Richtung/Hälfte ein eigenes Zeichen.
   - "slab": Stufe unten, "slab_top": Stufe oben.
   - "fence": Zaun oder Zauntor-Pfosten, "wall": Bruchsteinmauer o. Ä., "pane": Glasscheibe oder Eisengitter (verbinden sich automatisch mit Nachbarn; alleinstehend verläuft eine Scheibe in "dir").
   - "trapdoor": Falltür (unten, mit "half": "top" oben), "carpet": Teppich oder Druckplatte, "small": Laterne, Fackel, Blumentopf, Knopf.
6. Türen belegen zwei Blöcke übereinander: unten ein Zeichen für die Tür, oben ein eigenes Zeichen mit "item": "<Türname>" und "per": 0, damit sie nur einmal gezählt wird.
7. "raw": Rohstoffe pro Block, z. B. Bretter { "Eichenstamm": 0.25 }, Glas { "Sand": 1 }, Treppe { "Eichenstamm": 0.375 }.
8. "steps": 6–15 sinnvolle Bauschritte von unten nach oben. "layers" ist [von, bis] (0-basiert, inklusive), "blocks" sind die Zeichen, die in diesem Schritt gesetzt werden. Jeder Block muss in genau einem Schritt landen; der erste passende Schritt gewinnt.
9. Baue statisch sinnvoll und wirklich im Spiel machbar: geschlossene Wände, Dach ohne Löcher, Eingang erreichbar, Fenster aus Glas oder Glasscheiben.
10. Prüf vor der Ausgabe selbst: gleiche Zeilenlängen, alle Zeichen in der palette, gültiges JSON.`;

const EXAMPLE = `## Kleines Beispiel (3 × 3, zwei Ebenen)

{"format":"${PLAN_FORMAT}","id":"mini-turm","name":"Mini-Turm","description":"Ein winziger Turm aus Bruchstein mit Holzdach.","front":"Vorderseite","palette":{"C":{"name":"Bruchstein","color":"#878787","texture":"cobblestone","abbr":"Bs","farm":"Stein mit einer Spitzhacke abbauen.","raw":{"Bruchstein":1}},"B":{"name":"Eichenholzstufe","color":"#b38b52","texture":"planks","shape":"slab","abbr":"Sf","farm":"3 Bretter ergeben 6 Stufen.","raw":{"Eichenstamm":0.125}}},"layers":[["CCC","C.C","CCC"],["BBB","BBB","BBB"]],"steps":[{"title":"Mauer","text":"Setz einen 3 × 3 Ring aus Bruchstein.","layers":[0,0],"blocks":["C"]},{"title":"Dach","text":"Deck alles mit Stufen ab.","layers":[1,1],"blocks":["B"]}]}`;

const DESIGN_RULES = `## So wird der Bau schön (wichtig)

- Kein Kasten: Grundriss mit Vorsprüngen, Erkern oder L-Form, Höhe passend zur Breite, mindestens zwei Ebenen Tiefe in der Fassade.
- Rahmen: Stämme an den Ecken und als Balken zwischen den Geschossen, die Wandfläche dazwischen 1 Block eingerückt oder in einem helleren Material.
- Dach: steil genug, aus Treppen mit mindestens 1 Block Überstand, Giebel mit eigenem Material, First aus Stufen, Unterseite des Überstands mit umgedrehten Treppen ("half": "top").
- Fenster: Glasscheiben ("pane") statt voller Glasblöcke, Fensterbänke aus umgedrehten Treppen, Falltüren als Fensterläden.
- Fundament aus Stein oder Bruchstein, 1 Block breiter als die Wände; Eingang mit Treppenstufen und Laternen ("small").
- Details: Zäune, Mauern, Blumentöpfe, Laub als Bewuchs, Schornstein; 4–6 Hauptmaterialien mit Hell-Dunkel-Kontrast.`;

const RESEARCH = `## Recherche zuerst

Bevor du den Bauplan schreibst: Such im Internet (und in der Bildersuche) nach 2–3 gelungenen Minecraft-Bauten, die meiner Idee ähneln – z. B. YouTube-Tutorials, Planet Minecraft, Reddit r/Minecraftbuilds oder Pinterest. Orientier dich an deren Proportionen, Dachform, Materialmix und Details und setz das in deinen Bauplan um. Trag die Links unter "sources" ein. Wenn du keine Websuche hast, nutz dein Wissen über bekannte Bau-Stile.`;

const AI_INTRO =
  'Du bist ein erfahrener Minecraft-Baumeister. Ich nutze eine App („Bauplaner“), die aus einem JSON-Bauplan eine 3D-Ansicht, jede Ebene als Raster, eine Schritt-für-Schritt-Bauanleitung und die Materialliste macht. Erstelle mir so einen Bauplan als Datei.';

export function ideaPrompt(form: IdeaForm): string {
  return form.source === 'video' ? videoPrompt(form) : designPrompt(form);
}

const line = (label: string, value: string, fallback: string) =>
  `- ${label}: ${value.trim() || fallback}`;

const modeLine = (form: IdeaForm) =>
  form.mode === 'creative'
    ? '- Spielmodus: Kreativ, die Optik zählt mehr als leicht farmbare Blöcke'
    : '- Spielmodus: Survival, Blöcke möglichst leicht zu farmen, aber trotzdem schön';

function designPrompt(form: IdeaForm): string {
  return [
    AI_INTRO,
    '',
    '## Meine Idee',
    line('Name', form.name, 'denk dir einen passenden aus'),
    line('Was es sein soll', form.what, 'überrasch mich mit einem schönen Bau'),
    line('Ungefähre Größe', form.size, 'du entscheidest, passend zur Idee'),
    line('Stil und Umgebung', form.style, 'passend zur Idee'),
    line('Wunschblöcke', form.blocks, 'egal'),
    line('Besonderheiten', form.extra, 'keine'),
    modeLine(form),
    '',
    RESEARCH,
    '',
    DESIGN_RULES,
    '',
    FORMAT_SPEC,
    '',
    EXAMPLE,
  ].join('\n');
}

function videoPrompt(form: IdeaForm): string {
  const url = form.videoUrl.trim() || '(Link fehlt)';
  return [
    AI_INTRO,
    '',
    '## Vorlage: YouTube-Video',
    url,
    '',
    'Bau den Bau aus diesem Video so genau wie möglich nach:',
    '1. Sieh dir das komplette Video an – das Bild, nicht nur Titel, Beschreibung oder Untertitel. Bei Shorts und Zeitraffer geh es Szene für Szene durch und nutz jedes Bild, in dem eine Ebene, eine Wand oder das Dach gut zu sehen ist.',
    '2. Wenn du den Inhalt des Videos nicht ansehen kannst, antworte nur mit dem Satz „Ich kann dieses Video nicht ansehen.“ und erfinde keinen Bau.',
    '3. Zähl die Blöcke an den Kanten, um Grundfläche und Höhe zu bestimmen, und übertrag den Bau Ebene für Ebene in "layers".',
    '4. Erkenne jeden Blocktyp genau (Holzart, Steinart, Treppe, Stufe, Zaun, Falltür, Glasscheibe, Laterne …) und nutz die passenden "shape"-Werte, damit die Materialliste stimmt.',
    '5. Übernimm die Bau-Reihenfolge aus dem Video als "steps"; schreib in jeden Schritt, was zu tun ist, gern mit Zeitstempel (z. B. „ab 0:42“).',
    '6. Was verdeckt ist oder zu schnell geht, ergänzt du plausibel und symmetrisch und schreibst in "description", welche Teile geschätzt sind.',
    '7. Such zusätzlich im Internet nach dem Video (Titel, Creator, Beschreibung, Kommentare, verlinkte Seiten) – oft gibt es dort Materiallisten oder Maße. Trag das Video und gefundene Seiten unter "sources" ein.',
    '',
    '## Meine Wünsche',
    line('Name', form.name, 'wie im Video'),
    line('Änderungen gegenüber dem Video', form.extra, 'keine, so nah wie möglich am Original'),
    modeLine(form),
    '',
    FORMAT_SPEC,
    '',
    EXAMPLE,
  ].join('\n');
}

export function changePrompt(plan: BuildPlan, wish: string): string {
  return [
    'Du bist ein erfahrener Minecraft-Baumeister. Hier ist ein Bauplan aus meinem „Bauplaner“. Ändere ihn so, wie ich es unten beschreibe, und gib den kompletten neuen Bauplan als Datei zurück. Behalte alles bei, was ich nicht ändern will, und pass Bauschritte und Materialien an.',
    '',
    '## Meine Änderung',
    wish.trim() || '(bitte ergänzen)',
    '',
    DESIGN_RULES,
    '',
    '## Aktueller Bauplan',
    '```json',
    JSON.stringify(plan),
    '```',
    '',
    FORMAT_SPEC,
  ].join('\n');
}

export function planFileName(plan: BuildPlan): string {
  const slug = (plan.id || plan.name)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `bauplan-${slug || 'bau'}.json`;
}

// ---------------------------------------------------------------------------
// Beispielbau
// ---------------------------------------------------------------------------

export const EXAMPLE_ID = 'beispiel';

export const EXAMPLE_HOUSE: BuildPlan = {
  format: PLAN_FORMAT,
  id: 'haus-eiche-7x7',
  name: 'Gemütliches Eichenhaus',
  description:
    'Kleines Starterhaus mit 7 × 7 Grundfläche: Bruchstein-Fundament, Eichenholzwände mit Stamm-Ecken, fünf Glasfenster und ein Satteldach aus Treppen. Alles aus Eiche, Stein und Sand, also schon in den ersten Survival-Tagen machbar.',
  front: 'Tür-Seite',
  palette: {
    C: {
      name: 'Bruchstein',
      abbr: 'Bs',
      color: '#878787',
      top: '#999999',
      texture: 'cobblestone',
      farm: 'Normalen Stein mit einer Holzspitzhacke abbauen. Liegt direkt unter der Erde.',
      raw: { Bruchstein: 1 },
    },
    P: {
      name: 'Eichenholzbretter',
      abbr: 'Bt',
      color: '#b38b52',
      top: '#c19a60',
      texture: 'planks',
      farm: '1 Eichenstamm ergibt 4 Bretter.',
      raw: { Eichenstamm: 0.25 },
    },
    L: {
      name: 'Eichenstamm',
      abbr: 'St',
      color: '#6c5232',
      top: '#b08a52',
      texture: 'log',
      farm: 'Eichen fällen und Setzlinge gleich wieder pflanzen.',
      raw: { Eichenstamm: 1 },
    },
    G: {
      name: 'Glasscheibe',
      abbr: 'Gl',
      color: '#a4d6e5',
      texture: 'glass',
      shape: 'pane',
      glass: true,
      farm: 'Sand im Ofen zu Glas schmelzen, 6 Glas ergeben 16 Glasscheiben.',
      raw: { Sand: 0.375 },
    },
    D: {
      name: 'Eichentür',
      abbr: 'Tü',
      color: '#8d6838',
      texture: 'door',
      farm: '6 Bretter ergeben 3 Türen.',
      raw: { Eichenstamm: 0.5 },
    },
    d: {
      name: 'Eichentür (oben)',
      item: 'Eichentür',
      per: 0,
      abbr: 'Tü',
      color: '#8d6838',
      texture: 'door',
    },
    v: {
      name: 'Eichenholztreppe',
      shape: 'stair',
      dir: [0, 1],
      color: '#a8814a',
      top: '#b8915a',
      texture: 'planks',
      farm: '6 Bretter ergeben 4 Treppen.',
      raw: { Eichenstamm: 0.375 },
    },
    h: {
      name: 'Eichenholztreppe',
      shape: 'stair',
      dir: [0, -1],
      color: '#a8814a',
      top: '#b8915a',
      texture: 'planks',
      farm: '6 Bretter ergeben 4 Treppen.',
      raw: { Eichenstamm: 0.375 },
    },
    B: {
      name: 'Eichenholzstufe',
      shape: 'slab',
      abbr: 'Sf',
      color: '#bd965c',
      top: '#cba56a',
      texture: 'planks',
      farm: '3 Bretter ergeben 6 Stufen.',
      raw: { Eichenstamm: 0.125 },
    },
  },
  layers: [
    ['CCCCCCC', 'CPPPPPC', 'CPPPPPC', 'CPPPPPC', 'CPPPPPC', 'CPPPPPC', 'CCCCCCC'],
    ['LPPDPPL', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'LPPPPPL'],
    ['LPGdGPL', 'P.....P', 'P.....P', 'G.....G', 'P.....P', 'P.....P', 'LPPGPPL'],
    ['LPPPPPL', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'LPPPPPL'],
    ['vvvvvvv', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'P.....P', 'hhhhhhh'],
    ['.......', 'vvvvvvv', 'P.....P', 'P.....P', 'P.....P', 'hhhhhhh', '.......'],
    ['.......', '.......', 'vvvvvvv', 'P.....P', 'hhhhhhh', '.......', '.......'],
    ['.......', '.......', '.......', 'BBBBBBB', '.......', '.......', '.......'],
  ],
  steps: [
    {
      title: 'Fundament-Rahmen',
      text: 'Leg einen 7 × 7 großen Rahmen aus Bruchstein auf ebenen Boden. Setz zuerst die vier Ecken und füll dann die Seiten auf, so stimmen die Maße garantiert.',
      layers: [0, 0],
      blocks: ['C'],
    },
    {
      title: 'Holzboden',
      text: 'Füll die Fläche innerhalb des Rahmens (5 × 5) komplett mit Eichenholzbrettern.',
      layers: [0, 0],
      blocks: ['P'],
    },
    {
      title: 'Eckpfosten',
      text: 'Stell auf jede Ecke eine Säule aus 3 Eichenstämmen übereinander. Die Pfosten zeigen dir gleich die Wandhöhe.',
      layers: [1, 3],
      blocks: ['L'],
    },
    {
      title: 'Untere Wandreihe',
      text: 'Bau die erste Wandreihe aus Brettern zwischen die Pfosten. Vorne in der Mitte bleibt ein Feld frei, dort kommt später die Tür hin.',
      layers: [1, 1],
      blocks: ['P'],
    },
    {
      title: 'Mittlere Reihe mit Fenstern',
      text: 'Zweite Reihe: vorne links und rechts neben der Türöffnung je eine Glasscheibe, an beiden Seiten und hinten jeweils ein Fenster in der Mitte. Der Rest sind Bretter.',
      layers: [2, 2],
      blocks: ['P', 'G'],
    },
    {
      title: 'Tür einsetzen',
      text: 'Setz die Eichentür von außen in die Öffnung. Eine Tür belegt automatisch beide Blöcke übereinander.',
      layers: [1, 2],
      blocks: ['D', 'd'],
    },
    {
      title: 'Oberer Wandabschluss',
      text: 'Schließ die Wand mit einer kompletten Reihe Bretter ab. Der Rohbau ist jetzt 4 Blöcke hoch.',
      layers: [3, 3],
      blocks: ['P'],
    },
    {
      title: 'Giebelwände',
      text: 'Links und rechts baust du je ein Dreieck aus Brettern: unten 5 breit, dann 3, dann 1. Die Giebel geben die Höhe fürs Dach vor.',
      layers: [4, 6],
      blocks: ['P'],
    },
    {
      title: 'Dach vorne',
      text: 'Setz auf der Vorderseite drei Treppenreihen, jede eine Ebene höher und einen Block weiter nach innen. Stell dich dafür außen vor das Haus und schau zur Wand, dann zeigen die Treppen automatisch richtig.',
      layers: [4, 6],
      blocks: ['v'],
    },
    {
      title: 'Dach hinten',
      text: 'Dasselbe auf der Rückseite: drei Treppenreihen, jede höher und weiter innen. Wieder von außen setzen.',
      layers: [4, 6],
      blocks: ['h'],
    },
    {
      title: 'Dachfirst',
      text: 'Schließ die Lücke ganz oben mit einer Reihe Eichenholzstufen. Ziel beim Setzen auf die untere Blockhälfte, dann liegt der First bündig auf den Treppen.',
      layers: [7, 7],
      blocks: ['B'],
    },
  ],
};
