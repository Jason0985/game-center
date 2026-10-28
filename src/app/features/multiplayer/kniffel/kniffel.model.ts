// Kniffel: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20260918220000_core_schema.sql); points spiegelt die Wertung (Tests).

export interface KnPlayer {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  // Felder 0–12 (CATEGORIES); null = frei
  scores: (number | null)[];
  // Summe mit Bonus
  total: number;
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (kniffel.service.ts lädt genau diese)
export interface KnGame {
  id: string;
  status: 'playing' | 'finished';
  seat_count: number;
  turn_seat: number | null;
  // Leer vor dem ersten Wurf eines Zugs
  dice: number[];
  held: boolean[];
  // Würfe in diesem Zug (0–3)
  rolls: number;
  // Zählt jeden Wurf; ändert er sich, rollen die Würfel
  roll_seq: number;
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: KnPlayer[];
}

export const KNIFFEL_ROLLS = 3;
export const KNIFFEL_BONUS_AT = 63;
export const KNIFFEL_BONUS = 35;
// Erst nach so langem Warten kann der Host überspringen (die Datenbank lässt 25 s zu)
export const KNIFFEL_SKIP_AFTER_S = 30;

// Reihenfolge wie in der Datenbank (Feld 0–12); die ersten sechs sind der obere Block
export const CATEGORIES: readonly { name: string; hint: string }[] = [
  { name: 'Einser', hint: 'nur Einser zählen' },
  { name: 'Zweier', hint: 'nur Zweier zählen' },
  { name: 'Dreier', hint: 'nur Dreier zählen' },
  { name: 'Vierer', hint: 'nur Vierer zählen' },
  { name: 'Fünfer', hint: 'nur Fünfer zählen' },
  { name: 'Sechser', hint: 'nur Sechser zählen' },
  { name: 'Dreierpasch', hint: 'alle Augen' },
  { name: 'Viererpasch', hint: 'alle Augen' },
  { name: 'Full House', hint: '25 Punkte' },
  { name: 'Kleine Straße', hint: '30 Punkte' },
  { name: 'Große Straße', hint: '40 Punkte' },
  { name: 'Kniffel', hint: '50 Punkte' },
  { name: 'Chance', hint: 'alle Augen' },
];
export const UPPER = [0, 1, 2, 3, 4, 5];
export const LOWER = [6, 7, 8, 9, 10, 11, 12];

export const KNIFFEL_RULES = [
  'Jeder hat eine Spalte auf dem Block mit 13 Feldern. Wer alle gefüllt hat, ist fertig; die höchste Summe gewinnt.',
  'Wer dran ist, würfelt bis zu dreimal. Würfel antippen hält sie fest, sie bleiben beim nächsten Wurf liegen.',
  'Danach trägst du den Wurf in ein freies Feld ein (antippen, nochmal antippen). Passt nichts, streichst du ein Feld mit 0. Wie viele Punkte das bringt, rechnest du selbst.',
  'Die Summen bleiben bis zum Schluss verdeckt – am Ende wird für alle zusammengezählt.',
  'Einser bis Sechser: nur die Augen dieser Zahl zählen. Ab 63 Punkten oben gibt es 35 Bonus.',
  'Dreierpasch: drei gleiche Würfel – zählt alle Augen. Viererpasch: vier gleiche – zählt alle Augen.',
  'Full House: drei gleiche und zwei gleiche (z. B. 3-3-3-5-5) – 25 Punkte.',
  'Kleine Straße: vier aufeinanderfolgende Zahlen (1-2-3-4, 2-3-4-5 oder 3-4-5-6) – 30 Punkte.',
  'Große Straße: fünf aufeinanderfolgende Zahlen (1-2-3-4-5 oder 2-3-4-5-6) – 40 Punkte.',
  'Kniffel: fünf gleiche Würfel – 50 Punkte. Chance: beliebiger Wurf – zählt alle Augen.',
];

// Punkte von fünf Würfeln im Feld category; gespiegelt aus _kniffel_points
export function points(dice: readonly number[], category: number): number {
  const counts = [1, 2, 3, 4, 5, 6].map((face) => dice.filter((d) => d === face).length);
  const sum = dice.reduce((total, d) => total + d, 0);
  const most = Math.max(...counts);
  const run = (from: number, length: number) =>
    counts.slice(from - 1, from - 1 + length).every((n) => n > 0);
  switch (category) {
    case 6:
      return most >= 3 ? sum : 0;
    case 7:
      return most >= 4 ? sum : 0;
    case 8:
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case 9:
      return run(1, 4) || run(2, 4) || run(3, 4) ? 30 : 0;
    case 10:
      return run(1, 5) || run(2, 5) ? 40 : 0;
    case 11:
      return most === 5 ? 50 : 0;
    case 12:
      return sum;
    default:
      return (category + 1) * counts[category];
  }
}

export const upperSum = (scores: readonly (number | null)[]): number =>
  UPPER.reduce((sum, i) => sum + (scores[i] ?? 0), 0);

export const bonusOf = (scores: readonly (number | null)[]): number =>
  upperSum(scores) >= KNIFFEL_BONUS_AT ? KNIFFEL_BONUS : 0;

export const filledCount = (scores: readonly (number | null)[]): number =>
  scores.filter((score) => score !== null).length;

// Höchste Summe zuerst (gleich viel: gleicher Platz); Verlassene ans Ende ohne Platz
export function rankPlayers(
  players: readonly KnPlayer[],
): { player: KnPlayer; rank: number | null }[] {
  const active = players.filter((player) => player.state !== 'left');
  const sorted = [...active].sort((a, b) => b.total - a.total || a.seat - b.seat);
  return [
    ...sorted.map((player) => ({
      player,
      rank: sorted.findIndex((other) => other.total === player.total) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}
