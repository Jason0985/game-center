// Liest Vorlesungen aus der Wochenansicht von Rapla (DHBW, /rapla/calendar?key=…).
// Aufbau der Seite: eine Tabelle mit Kopfzeile (Zellen class="week_header", z. B. "Mo 13.01.",
// mit colspan für parallele Termine) und Zeilen pro Zeitraster. Termine sind Zellen
// class="week_block" mit rowspan; ihr Text beginnt mit "08:30 -10:00<br>Titel", dahinter folgt
// ein Tooltip mit Details (verschachtelte Tabelle class="infotable").
// Ohne Deno-APIs, damit auch die App-Tests ihn prüfen können.

export interface Lecture {
  // YYYY-MM-DD
  date: string;
  // HH:MM
  start: string;
  end: string;
  title: string;
}

interface Cell {
  row: number;
  col: number;
  span: number;
  cls: string;
  html: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function decodeEntities(text: string): string {
  return text
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

const stripTags = (html: string) =>
  decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .trim();

const attr = (attrs: string, name: string) =>
  attrs.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\\s>]+)`, 'i'))?.[1] ?? '';

const TIME_RANGE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;

/** Alle Termine der Woche, die die Seite zeigt. year = Jahr des angefragten Datums. */
export function parseRaplaWeek(html: string, year: number, month: number): Lecture[] {
  // Tooltips enthalten eigene Tabellen; die würden die Zellensuche durcheinanderbringen
  const clean = html.replace(/<table[^>]*class=["']?infotable[\s\S]*?<\/table>/gi, '');
  const headerAt = clean.search(/class=["']?week_header/i);
  if (headerAt < 0) return parseTooltips(clean, year);
  const tableStart = clean.lastIndexOf('<table', headerAt);
  const tableEnd = clean.indexOf('</table>', headerAt);
  const table = clean.slice(tableStart, tableEnd < 0 ? undefined : tableEnd);

  // Raster mit rowspan/colspan nachbauen, damit jede Zelle ihre echte Spalte bekommt
  const cells: Cell[] = [];
  const taken = new Map<number, Set<number>>();
  const isTaken = (r: number, c: number) => taken.get(r)?.has(c) ?? false;
  const take = (r: number, c: number) => {
    if (!taken.has(r)) taken.set(r, new Set());
    taken.get(r)!.add(c);
  };
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  rows.forEach((rowMatch, r) => {
    let col = 0;
    for (const cell of rowMatch[1].matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      while (isTaken(r, col)) col++;
      const span = Math.max(1, Number(attr(cell[2], 'colspan')) || 1);
      const rowspan = Math.max(1, Number(attr(cell[2], 'rowspan')) || 1);
      for (let dr = 0; dr < rowspan; dr++) for (let dc = 0; dc < span; dc++) take(r + dr, col + dc);
      cells.push({ row: r, col, span, cls: attr(cell[2], 'class'), html: cell[3] });
      col += span;
    }
  });

  // Kopfzeile: Spaltenbereich je Tag
  const days: { from: number; to: number; date: string }[] = [];
  for (const cell of cells.filter((c) => /week_header/i.test(c.cls))) {
    const m = stripTags(cell.html).match(/(\d{1,2})\.(\d{1,2})\./);
    if (!m) continue;
    const day = Number(m[1]);
    const mon = Number(m[2]);
    // Jahreswechsel: Dezember-Woche im Januar angefragt und umgekehrt
    const y = mon === 12 && month === 1 ? year - 1 : mon === 1 && month === 12 ? year + 1 : year;
    days.push({ from: cell.col, to: cell.col + cell.span, date: `${y}-${pad(mon)}-${pad(day)}` });
  }

  const lectures: Lecture[] = [];
  for (const cell of cells.filter((c) => /week_block/i.test(c.cls))) {
    const day = days.find((d) => cell.col >= d.from && cell.col < d.to);
    // Sichtbarer Teil vor dem Tooltip: "08:30 -10:00<br>Titel"
    const visible = cell.html.split(/<span[^>]*class=["']?tooltip/i)[0];
    const text = stripTags(visible);
    const time = text.match(TIME_RANGE);
    if (!day || !time) continue;
    const title = text
      .slice(text.indexOf(time[0]) + time[0].length)
      .trim()
      .split('\n')[0]
      .trim();
    lectures.push({
      date: day.date,
      start: `${pad(Number(time[1]))}:${time[2]}`,
      end: `${pad(Number(time[3]))}:${time[4]}`,
      title: title || 'Termin',
    });
  }
  return sortLectures(lectures);
}

/** Notlösung ohne Kopfzeile: Datum und Uhrzeit aus den Tooltips ("Mo 13.01.25 08:30-10:00"). */
function parseTooltips(html: string, year: number): Lecture[] {
  const lectures: Lecture[] = [];
  for (const block of html.matchAll(/class=["']?week_block[\s\S]*?(?=class=["']?week_block|$)/gi)) {
    const text = stripTags(block[0]);
    const m = text.match(
      /(\d{1,2})\.(\d{1,2})\.(\d{2,4})?\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
    );
    if (!m) continue;
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : year;
    const first = stripTags(block[0].split(/<span[^>]*class=["']?tooltip/i)[0]);
    const time = first.match(TIME_RANGE);
    const title = time ? first.slice(first.indexOf(time[0]) + time[0].length).trim() : '';
    lectures.push({
      date: `${y}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`,
      start: `${pad(Number(m[4]))}:${m[5]}`,
      end: `${pad(Number(m[6]))}:${m[7]}`,
      title: title.split('\n')[0].trim() || 'Termin',
    });
  }
  return sortLectures(lectures);
}

function sortLectures(list: Lecture[]): Lecture[] {
  const seen = new Set<string>();
  return list
    .filter((l) => {
      const key = `${l.date} ${l.start} ${l.end} ${l.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

/** Nur Rapla-Links von DHBW-Servern zulassen (kein Abruf beliebiger Adressen). */
export function isAllowedRaplaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'dhbw.de' || url.hostname.endsWith('.dhbw.de')) &&
      url.pathname.includes('/rapla') &&
      url.searchParams.has('key')
    );
  } catch {
    return false;
  }
}

/** Link auf die Woche mit dem gewünschten Datum (Rapla nimmt day, month, year). */
export function weekUrl(base: string, date: string): string {
  const url = new URL(base);
  const [y, m, d] = date.split('-').map(Number);
  url.searchParams.set('day', String(d));
  url.searchParams.set('month', String(m));
  url.searchParams.set('year', String(y));
  return url.toString();
}
