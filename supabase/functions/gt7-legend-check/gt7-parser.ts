// Liest die Händlerliste aus dem HTML von gtdb.io/gt7/legend-cars-dealer/. Reines TypeScript
// ohne Deno, damit es auch die Tests der App prüfen können (gt7-parser.spec.ts).
//
// Aufbau je Auto (Stand November 2026):
//   <div><a href="/gt7/car/xj13-66/"><div class="text-xs …">Jaguar</div>
//   <div class="text-base …">XJ13 &#39;66</div><div …><img … src="…">[SOLD OUT]</div>
//   <div …> Cr. <span …>12,000,000</span></div>[Limited Stock]</a></div>
// Die Liste steht im ersten Raster "grid sm:grid-cols-3"; weiter unten verlinken andere
// Bereiche ("Most Wanted") ebenfalls auf /gt7/car/, die gehören nicht dazu.

export interface DealerCar {
  carId: string;
  maker: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  soldOut: boolean;
  limitedStock: boolean;
}

export interface DealerPage {
  cars: DealerCar[];
  // "Last updated on …" der Seite
  updatedAt: string | null;
}

const GRID_START = 'grid sm:grid-cols-3';
const GRID_END = '<!--]--></div></div>';
const CAR_LINK = '<a href="/gt7/car/';

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&#39;': "'",
  '&apos;': "'",
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
};

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDealerPage(html: string): DealerPage {
  const updatedAt = html.match(/Last updated on <time[^>]*datetime="([^"]+)"/)?.[1] ?? null;
  const start = html.indexOf(GRID_START);
  if (start < 0) return { cars: [], updatedAt };
  const end = html.indexOf(GRID_END, start);
  const grid = html.slice(start, end < 0 ? undefined : end);

  const cars: DealerCar[] = [];
  const seen = new Set<string>();
  for (const block of grid.split(CAR_LINK).slice(1)) {
    const carId = block.match(/^([a-z0-9-]+)\//)?.[1];
    if (!carId || seen.has(carId)) continue;
    const maker = block.match(/<div class="text-xs[^"]*">([^<]*)<\/div>/)?.[1];
    const name = block.match(/<div class="text-base[^"]*">([^<]*)<\/div>/)?.[1];
    if (name === undefined) continue;
    const price = block.match(/Cr\.\s*<span[^>]*>([\d.,\s]+)<\/span>/)?.[1];
    seen.add(carId);
    cars.push({
      carId,
      maker: decode(maker ?? ''),
      name: decode(name),
      price: price ? Number(price.replace(/[^\d]/g, '')) || null : null,
      imageUrl: block.match(/<img[^>]*\ssrc="(https:[^"]+)"/)?.[1] ?? null,
      soldOut: /SOLD OUT/i.test(block),
      limitedStock: /Limited Stock/i.test(block),
    });
  }
  return { cars, updatedAt };
}
