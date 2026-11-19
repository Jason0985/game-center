// Liest den Legend Cars Dealer aus den Daten von GT7 Info (ddm999.github.io/gt7info/data.json).
// Reines TypeScript ohne Deno, damit es auch die Tests der App prüfen können
// (gt7-parser.spec.ts).
//
// Der Händler wechselt in GT7 jeden Tag um 00:00 UTC; GT7 Info liest ihn kurz danach aus.
// Aufbau (Stand November 2026):
//   { "updatetimestamp": "2026-11-17",
//     "legend": { "date": "26-11-17", "cars": [
//       { "carid": "1551", "manufacturer": "Ferrari", "name": "330 P4 '67",
//         "credits": 20000000, "state": "normal" | "limited" | "soldout",
//         "new": false, "estimatedays": 1, … } ] } }
// estimatedays: geschätzte Tage, bis das Auto den Händler verlässt (0 = heute letzter Tag).

export interface DealerCar {
  // ID wie bei gtdb.io (/gt7/car/xj13-66/), aus dem Namen gebildet; so bleiben Merklisten gültig
  carId: string;
  maker: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  soldOut: boolean;
  limitedStock: boolean;
  // Neu beim Händler (zum ersten Mal oder nach langer Pause)
  isNew: boolean;
  // Geschätzte Tage, bis das Auto wieder weg ist
  daysLeft: number | null;
}

export interface DealerPage {
  cars: DealerCar[];
  // Stand der Händlerliste (Tag des Wechsels, 00:00 UTC)
  updatedAt: string | null;
}

// "330 P4 '67" -> "330-p4-67", "E-type Coupé '61" -> "e-type-coupe-61" (wie gtdb)
export function carSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

interface Gt7InfoCar {
  manufacturer?: unknown;
  name?: unknown;
  credits?: unknown;
  state?: unknown;
  new?: unknown;
  estimatedays?: unknown;
}

// "26-11-17" -> "2026-11-17T00:00:00.000Z"
function legendDate(value: unknown): string | null {
  const match = typeof value === 'string' ? value.match(/^(\d{2})-(\d{2})-(\d{2})$/) : null;
  if (!match) return null;
  const date = new Date(Date.UTC(2000 + Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseGt7Info(data: unknown): DealerPage {
  const legend = (data as { legend?: { date?: unknown; cars?: unknown } } | null)?.legend;
  const list = Array.isArray(legend?.cars) ? (legend.cars as Gt7InfoCar[]) : [];
  const cars: DealerCar[] = [];
  const seen = new Set<string>();
  for (const car of list) {
    const name = typeof car?.name === 'string' ? car.name.replace(/\s+/g, ' ').trim() : '';
    const carId = carSlug(name);
    if (!name || !carId || seen.has(carId)) continue;
    seen.add(carId);
    const price = Number(car.credits);
    const days = Number(car.estimatedays);
    cars.push({
      carId,
      maker: typeof car.manufacturer === 'string' ? car.manufacturer.trim().slice(0, 60) : '',
      name: name.slice(0, 100),
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : null,
      imageUrl: null,
      soldOut: car.state === 'soldout',
      limitedStock: car.state === 'limited',
      isNew: car.new === true,
      daysLeft: Number.isInteger(days) && days >= 0 ? days : null,
    });
  }
  return { cars, updatedAt: legendDate(legend?.date) };
}

// ---------------------------------------------------------------- Texte

// gt7info nennt manche Autos schon mit Marke ("McLaren F1 '94")
export const carTitle = (car: { maker: string; name: string }) =>
  car.maker && !car.name.startsWith(car.maker) ? `${car.maker} ${car.name}` : car.name;

const credits = (price: number | null) =>
  price === null ? '' : ` (Cr. ${price.toLocaleString('de-DE')})`;

/** Mitteilung, wenn der Händler neue Autos hat; leer, wenn keins neu ist. */
export function dealerUpdateMessage(
  arrived: DealerCar[],
): { title: string; message: string } | null {
  if (!arrived.length) return null;
  const title =
    arrived.length === 1
      ? `GT7: ${carTitle(arrived[0])} beim Legend-Händler`
      : `GT7: ${arrived.length} neue Autos beim Legend-Händler`;
  const lines = arrived.map(
    (car) =>
      `${carTitle(car)}${credits(car.price)}` +
      (car.daysLeft === null
        ? ''
        : car.daysLeft === 0
          ? ', heute letzter Tag'
          : `, ca. ${car.daysLeft} ${car.daysLeft === 1 ? 'Tag' : 'Tage'}`),
  );
  return { title: title.slice(0, 100), message: lines.join(' · ').slice(0, 500) };
}
