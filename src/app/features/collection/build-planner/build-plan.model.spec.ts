import {
  EXAMPLE_HOUSE,
  isYoutubeUrl,
  analyzePlan,
  countItems,
  extractJson,
  ideaPrompt,
  EMPTY_IDEA,
  parsePlan,
  planFileName,
  rawTotals,
  stacksLabel,
  totalBlocks,
} from './build-plan.model';
import { blockTextures, textureKind, TEX } from './block-textures';

describe('Bauplaner-Modell', () => {
  it('wertet das Beispielhaus aus', () => {
    const A = analyzePlan(EXAMPLE_HOUSE);
    expect([A.W, A.D, A.H]).toEqual([7, 7, 8]);
    expect(A.steps.length).toBe(11);
    // Jeder Block landet in einem Schritt, es braucht keinen Rest-Schritt
    expect(A.blocks.every((b) => b.step >= 0 && b.step < 11)).toBe(true);
    const doors = countItems(EXAMPLE_HOUSE, A.blocks).find((i) => i.name === 'Eichentür');
    expect(doors?.count).toBe(1);
    expect(totalBlocks(EXAMPLE_HOUSE, A)).toBe(187);
    expect(rawTotals(EXAMPLE_HOUSE, A.blocks).find((r) => r.name === 'Sand')?.count).toBe(2);
  });

  it('fasst nicht zugeordnete Blöcke in einem Rest-Schritt zusammen', () => {
    const A = analyzePlan({
      name: 'Test',
      palette: { A: { name: 'Stein', color: '#888' }, B: { name: 'Holz', color: '#a80' } },
      layers: [['AB']],
      steps: [{ title: 'Nur Stein', blocks: ['A'] }],
    });
    expect(A.steps.map((s) => s.title)).toEqual(['Nur Stein', 'Restliche Blöcke']);
    expect(A.blocks.map((b) => b.step)).toEqual([0, 1]);
  });

  it('liest JSON aus einer KI-Antwort mit Codeblock', () => {
    const text =
      'Hier dein Bau:\n```json\n{"name":"X","palette":{"S":{"name":"Stein","color":"#777777"}},"layers":[["S"]]}\n```\nViel Spaß!';
    expect(extractJson(text)).toBe(
      '{"name":"X","palette":{"S":{"name":"Stein","color":"#777777"}},"layers":[["S"]]}',
    );
    const result = parsePlan(text);
    expect(result.error).toBeUndefined();
    expect(result.plan?.name).toBe('X');
  });

  it('füllt ungleich lange Zeilen und Ebenen mit Luft auf', () => {
    const result = parsePlan(
      JSON.stringify({
        name: 'Schief',
        palette: { S: { name: 'Stein', color: '#777' } },
        layers: [['SSS', 'S'], ['S']],
      }),
    );
    expect(result.plan?.layers).toEqual([
      ['SSS', 'S..'],
      ['S..', '...'],
    ]);
  });

  it('meldet verständliche Fehler', () => {
    expect(parsePlan('kein json').error).toContain('kein gültiges JSON');
    expect(parsePlan('{"palette":{},"layers":[]}').error).toContain('Name');
    expect(
      parsePlan('{"name":"A","palette":{"S":{"name":"Stein","color":"grau"}},"layers":[["S"]]}')
        .error,
    ).toContain('Hex');
    expect(
      parsePlan('{"name":"A","palette":{"S":{"name":"Stein","color":"#777"}},"layers":[["SX"]]}')
        .error,
    ).toContain('X');
    expect(
      parsePlan('{"name":"A","palette":{"SS":{"name":"Stein","color":"#777"}},"layers":[["S"]]}')
        .error,
    ).toContain('genau ein Zeichen');
  });

  it('übernimmt das Beispielhaus unverändert beim Import', () => {
    const result = parsePlan(JSON.stringify(EXAMPLE_HOUSE));
    expect(result.error).toBeUndefined();
    expect(result.plan?.layers).toEqual(EXAMPLE_HOUSE.layers);
    expect(result.plan?.palette['v'].dir).toEqual([0, 1]);
    expect(result.plan?.steps?.length).toBe(11);
  });

  it('baut Prompts mit Formatbeschreibung', () => {
    const prompt = ideaPrompt({ ...EMPTY_IDEA, name: 'Windmühle', mode: 'creative' });
    expect(prompt).toContain('Windmühle');
    expect(prompt).toContain('bauplaner/1');
    expect(prompt).toContain('Kreativ');
  });

  it('formatiert Stacks und Dateinamen', () => {
    expect(stacksLabel(10)).toBe('');
    expect(stacksLabel(64)).toBe('1 Stack');
    expect(stacksLabel(150)).toBe('2 Stacks + 22');
    expect(planFileName({ ...EXAMPLE_HOUSE, id: undefined, name: 'Große Brücke' })).toBe(
      'bauplan-grosse-bruecke.json',
    );
  });
});

describe('Bauplaner: Formen, Vorlagen und Video', () => {
  it('erkennt fehlende Formen am Namen und übernimmt half und sources', () => {
    const result = parsePlan(
      JSON.stringify({
        name: 'Details',
        palette: {
          F: { name: 'Fichtenzaun', color: '#6e5132' },
          T: { name: 'Fichtenfalltür', color: '#6e5132', half: 'top' },
          L: { name: 'Laterne', color: '#3a3a3a' },
          S: {
            name: 'Eichenholztreppe',
            color: '#b38b52',
            shape: 'stair',
            dir: [1, 0],
            half: 'top',
          },
          X: { name: 'Ding', color: '#777', shape: 'quatsch' },
        },
        layers: [['FTLSX']],
        sources: ['https://youtube.com/shorts/abc123XYZ', 'kein link'],
      }),
    );
    const palette = result.plan!.palette;
    expect(palette['F'].shape).toBe('fence');
    expect(palette['T'].shape).toBe('trapdoor');
    expect(palette['T'].half).toBe('top');
    expect(palette['L'].shape).toBe('small');
    expect(palette['S'].half).toBe('top');
    expect(palette['X'].shape).toBeUndefined();
    expect(result.plan!.sources).toEqual(['https://youtube.com/shorts/abc123XYZ']);
  });

  it('baut den Video-Prompt und erkennt YouTube-Links', () => {
    expect(isYoutubeUrl('https://youtube.com/shorts/AbC_12-xyz')).toBe(true);
    expect(isYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe(true);
    expect(isYoutubeUrl('https://vimeo.com/123456')).toBe(false);
    const prompt = ideaPrompt({
      ...EMPTY_IDEA,
      source: 'video',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
    expect(prompt).toContain('https://youtu.be/dQw4w9WgXcQ');
    expect(prompt).toContain('Ich kann dieses Video nicht ansehen.');
    expect(ideaPrompt(EMPTY_IDEA)).toContain('Recherche zuerst');
  });

  it('meldet, wenn die KI das Video nicht ansehen konnte', () => {
    expect(parsePlan('Ich kann dieses Video nicht ansehen.').error).toContain('Gemini');
  });
});

describe('Block-Texturen', () => {
  it('erkennt die Textur am Namen', () => {
    expect(textureKind({ name: 'Fichtenholzbretter', color: '#000' })).toBe('planks');
    expect(textureKind({ name: 'Bruchstein', color: '#000' })).toBe('cobblestone');
    expect(textureKind({ name: 'Glasscheibe', color: '#000' })).toBe('glass');
    expect(textureKind({ name: 'Irgendwas', color: '#000' })).toBe('smooth');
  });

  it('erzeugt immer dieselben 16 × 16 Pixel', () => {
    const def = { name: 'Bretter', color: '#b38b52', texture: 'planks' as const };
    const a = blockTextures(def);
    expect(a.side.length).toBe(TEX * TEX * 4);
    expect(blockTextures({ ...def })).toBe(a);
  });
});
