// Routen-Check: reine Logik ohne Deno und Netz, damit sie auch die Tests der App prüfen
// können (route-logic.spec.ts). Strecke vereinfachen, Autobahn-Meldungen der Strecke
// zuordnen (mit Richtung), TomTom-Verkehrsabschnitte lesen, fällige Check-Zeiten und
// Texte der Mitteilungen.

export type LatLon = [number, number];

export interface Schedule {
  // "06:45", Uhrzeit in Deutschland
  time: string;
  // 1 = Montag … 7 = Sonntag
  days: number[];
  // false = Hinweg (Start -> Ziel), true = Rückweg
  reverse: boolean;
}

export type IncidentKind = 'jam' | 'closure' | 'roadworks' | 'warning';

export interface Incident {
  id: string;
  source: 'tomtom' | 'autobahn';
  kind: IncidentKind;
  road: string | null;
  title: string;
  detail: string;
  delayMinutes: number | null;
  // 0–1 entlang des Hinwegs (Start = 0, Ziel = 1)
  position: number;
  // Fahrtrichtung: false = Hinweg, true = Rückweg, null = unbekannt/beide
  reverse: boolean | null;
  // Gilt erst später (geplante Sperrung)
  future: boolean;
}

export interface CheckResult {
  checkedAt: string;
  reverse: boolean;
  // Mit TomTom: Fahrzeit jetzt, Verzögerung durch Verkehr, Fahrzeit ohne Verkehr
  travelMinutes: number | null;
  delayMinutes: number | null;
  baseMinutes: number | null;
  lengthKm: number | null;
  incidents: Incident[];
  // Quellen, die geantwortet haben
  sources: ('tomtom' | 'autobahn')[];
}

// ---------------------------------------------------------------- Geometrie

const EARTH_M = 6_371_000;
const RAD = Math.PI / 180;

// Abstand in Metern (gleichabstandige Näherung, für kurze Abstände genau genug)
export function distanceM(a: LatLon, b: LatLon): number {
  const x = (b[1] - a[1]) * RAD * Math.cos(((a[0] + b[0]) / 2) * RAD);
  const y = (b[0] - a[0]) * RAD;
  return Math.hypot(x, y) * EARTH_M;
}

// Punkte mindestens minM auseinander; Start und Ziel bleiben
export function simplifyPath(points: LatLon[], minM = 150): LatLon[] {
  if (points.length <= 2) return points.map(round);
  const out: LatLon[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    if (distanceM(out[out.length - 1], points[i]) >= minM) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out.map(round);
}

const round = (p: LatLon): LatLon => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];

export function pathLengthM(path: LatLon[]): number {
  let sum = 0;
  for (let i = 1; i < path.length; i++) sum += distanceM(path[i - 1], path[i]);
  return sum;
}

// Nächster Punkt auf der Strecke: Abstand und Lage als gebrochener Abschnittsindex
export function nearestOnPath(point: LatLon, path: LatLon[]): { distance: number; index: number } {
  let best = { distance: Infinity, index: 0 };
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    // In lokale Meter umrechnen, Punkt auf die Strecke a-b projizieren
    const cos = Math.cos(a[0] * RAD);
    const bx = (b[1] - a[1]) * cos;
    const by = b[0] - a[0];
    const px = (point[1] - a[1]) * cos;
    const py = point[0] - a[0];
    const len2 = bx * bx + by * by;
    const t = len2 ? Math.max(0, Math.min(1, (px * bx + py * by) / len2)) : 0;
    const foot: LatLon = [a[0] + by * t, a[1] + (bx * t) / (cos || 1)];
    const distance = distanceM(point, foot);
    if (distance < best.distance) best = { distance, index: i - 1 + t };
  }
  if (path.length === 1) best = { distance: distanceM(point, path[0]), index: 0 };
  return best;
}

// Höchstens so weit neben der Strecke zählt eine Meldung noch dazu
export const MATCH_DISTANCE_M = 200;

/**
 * Liegt eine Meldung (Linie in GeoJSON-Reihenfolge [lon, lat]) auf der Strecke? Dann Lage
 * entlang des Hinwegs und Richtung: Die Linien der Autobahn GmbH folgen der Fahrtrichtung,
 * läuft sie entlang der Strecke rückwärts, betrifft sie den Rückweg.
 */
export function matchLine(
  coordinates: [number, number][],
  path: LatLon[],
): { position: number; reverse: boolean | null } | null {
  if (path.length < 2 || !coordinates.length) return null;
  const step = Math.max(1, Math.floor(coordinates.length / 12));
  const samples: LatLon[] = [];
  for (let i = 0; i < coordinates.length; i += step)
    samples.push([coordinates[i][1], coordinates[i][0]]);
  const last = coordinates[coordinates.length - 1];
  samples.push([last[1], last[0]]);

  const near = samples
    .map((sample) => nearestOnPath(sample, path))
    .filter((hit) => hit.distance <= MATCH_DISTANCE_M);
  // Mehr als die Hälfte der Linie muss an der Strecke liegen (sonst nur Kreuzung/Parallele)
  if (!near.length || near.length * 2 < samples.length) return null;

  const segments = path.length - 1;
  const first = near[0].index;
  const end = near[near.length - 1].index;
  const moved = (end - first) * (pathLengthM(path) / segments);
  const reverse = Math.abs(moved) < 50 ? null : moved < 0;
  return { position: clamp01(Math.min(first, end) / segments), reverse };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// ---------------------------------------------------------------- Autobahn GmbH

export interface AutobahnItem {
  identifier?: string;
  title?: string;
  subtitle?: string;
  description?: string[];
  display_type?: string;
  abnormalTrafficType?: string | null;
  delayTimeValue?: string | number | null;
  future?: boolean;
  coordinate?: { lat: number | string; long: number | string };
  geometry?: { type?: string; coordinates?: unknown };
}

export type AutobahnService = 'warning' | 'closure' | 'roadworks';

// Die Kennung ändert sich bei jeder Aktualisierung (Zeitstempel hinten), die Ereignisnummer
// vorne bleibt
export function autobahnId(identifier: string): string {
  return `ab:${identifier.split('--')[0]}`.slice(0, 200);
}

function lineOf(item: AutobahnItem): [number, number][] {
  const coords = item.geometry?.coordinates;
  if (item.geometry?.type === 'LineString' && Array.isArray(coords)) {
    return (coords as unknown[]).filter(
      (c): c is [number, number] => Array.isArray(c) && typeof c[0] === 'number',
    );
  }
  const lat = Number(item.coordinate?.lat);
  const lon = Number(item.coordinate?.long);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [[lon, lat]] : [];
}

// "- Im Stillstand", "- Reisezeitverlust: 17 Minuten": die Stichpunkte der Meldung
function bulletLines(description: string[] = []): string[] {
  return description
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && !/^Reisezeitverlust/i.test(line));
}

export function autobahnIncident(
  item: AutobahnItem,
  service: AutobahnService,
  road: string,
  path: LatLon[],
): Incident | null {
  if (!item.identifier) return null;
  const hit = matchLine(lineOf(item), path);
  if (!hit) return null;

  const display = item.display_type ?? '';
  const kind: IncidentKind =
    service === 'closure' || display.includes('CLOSURE')
      ? 'closure'
      : service === 'roadworks'
        ? 'roadworks'
        : item.abnormalTrafficType
          ? 'jam'
          : 'warning';
  const delay = Number(item.delayTimeValue);
  const direction = (item.subtitle ?? '').trim();
  const bullets = bulletLines(item.description);
  const detail = [direction, ...bullets.slice(0, 2)].filter(Boolean).join(', ');

  return {
    id: autobahnId(item.identifier),
    source: 'autobahn',
    kind,
    road,
    title: (item.title ?? road)
      .replace(/\s*\|\s*/, ' ')
      .trim()
      .slice(0, 120),
    detail: detail.slice(0, 200),
    delayMinutes: Number.isFinite(delay) && delay > 0 ? Math.round(delay) : null,
    position: hit.position,
    reverse: hit.reverse,
    future: item.future === true,
  };
}

// Autobahnen aus TomTom-Straßennummern ("A5", "A 5", "E35/A5")
export function autobahnRoads(roadNumbers: string[]): string[] {
  const roads = new Set<string>();
  for (const value of roadNumbers) {
    for (const part of value.split(/[/,;]/)) {
      const match = part.trim().match(/^A\s?(\d{1,3}[a-z]?)$/i);
      if (match) roads.add(`A${match[1].toLowerCase()}`);
    }
  }
  return [...roads].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
}

// ---------------------------------------------------------------- TomTom

export interface TomTomRoute {
  summary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
    noTrafficTravelTimeInSeconds?: number;
  };
  legs?: { points?: { latitude: number; longitude: number }[] }[];
  sections?: {
    sectionType?: string;
    startPointIndex?: number;
    endPointIndex?: number;
    simpleCategory?: string;
    effectiveSpeedInKmh?: number;
    delayInSeconds?: number;
    magnitudeOfDelay?: number;
    eventId?: string;
  }[];
  guidance?: {
    instructions?: { pointIndex?: number; roadNumbers?: string[]; street?: string }[];
  };
}

export function tomtomPoints(route: TomTomRoute): LatLon[] {
  return (route.legs ?? []).flatMap((leg) =>
    (leg.points ?? []).map((p): LatLon => [p.latitude, p.longitude]),
  );
}

export function tomtomRoadNumbers(route: TomTomRoute): string[] {
  return (route.guidance?.instructions ?? []).flatMap((i) => i.roadNumbers ?? []);
}

const TOMTOM_KIND: Record<string, IncidentKind> = {
  JAM: 'jam',
  ROAD_WORK: 'roadworks',
  ROAD_CLOSURE: 'closure',
};

// Straße an einem Punkt der Route: letzte Anweisung davor
function roadAt(route: TomTomRoute, pointIndex: number): string | null {
  let road: string | null = null;
  for (const instruction of route.guidance?.instructions ?? []) {
    if ((instruction.pointIndex ?? 0) > pointIndex) break;
    road = instruction.roadNumbers?.[0] ?? instruction.street ?? road;
  }
  return road;
}

const MAGNITUDE = ['', 'leicht', 'mäßig', 'stark', 'gesperrt'];

export function tomtomIncidents(route: TomTomRoute, reverse: boolean): Incident[] {
  const count = Math.max(1, tomtomPoints(route).length - 1);
  return (route.sections ?? [])
    .filter((section) => section.sectionType === 'TRAFFIC')
    .map((section) => {
      const start = section.startPointIndex ?? 0;
      const kind = TOMTOM_KIND[section.simpleCategory ?? ''] ?? 'warning';
      const road = roadAt(route, start);
      const delay = Math.round((section.delayInSeconds ?? 0) / 60);
      const speed = section.effectiveSpeedInKmh;
      const label =
        kind === 'jam'
          ? 'Stau'
          : kind === 'closure'
            ? 'Sperrung'
            : kind === 'roadworks'
              ? 'Baustelle'
              : 'Behinderung';
      const detail = [
        MAGNITUDE[section.magnitudeOfDelay ?? 0] ?? '',
        speed && kind !== 'closure' ? `${Math.round(speed)} km/h` : '',
      ]
        .filter(Boolean)
        .join(', ');
      const along = start / count;
      return {
        id: `tt:${section.eventId ?? `${reverse ? 'r' : 'h'}${start}`}`.slice(0, 200),
        source: 'tomtom' as const,
        kind,
        road,
        title: road ? `${label} ${road}` : label,
        detail,
        delayMinutes: delay > 0 ? delay : null,
        position: clamp01(reverse ? 1 - along : along),
        reverse,
        future: false,
      };
    });
}

// TomTom und Autobahn melden oft denselben Stau: an derselben Stelle und Art nur einmal
// zeigen, die Autobahn-Meldung (mit Anschlussstellen) gewinnt
export function mergeIncidents(
  tomtom: Incident[],
  autobahn: Incident[],
  lengthM: number,
): Incident[] {
  const sameSpot = (a: Incident, b: Incident) =>
    a.kind === b.kind &&
    Math.abs(a.position - b.position) * lengthM < 3000 &&
    (a.reverse === null || b.reverse === null || a.reverse === b.reverse);
  const merged = [...autobahn];
  for (const incident of tomtom) {
    const twin = merged.find((other) => sameSpot(other, incident));
    if (twin) {
      twin.delayMinutes = Math.max(twin.delayMinutes ?? 0, incident.delayMinutes ?? 0) || null;
    } else {
      merged.push(incident);
    }
  }
  return merged.sort((a, b) => a.position - b.position);
}

// ---------------------------------------------------------------- Zeitplan

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseSchedules(value: unknown): Schedule[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const out: Schedule[] = [];
  for (const entry of value) {
    const time = typeof entry?.time === 'string' ? entry.time : '';
    const days = Array.isArray(entry?.days) ? [...new Set(entry.days as unknown[])] : [];
    if (!TIME.test(time)) return null;
    if (
      !days.length ||
      !days.every((d) => Number.isInteger(d) && (d as number) >= 1 && (d as number) <= 7)
    ) {
      return null;
    }
    out.push({ time, days: (days as number[]).sort(), reverse: entry?.reverse === true });
  }
  return out;
}

export interface LocalNow {
  // 1 = Montag … 7 = Sonntag
  weekday: number;
  minutes: number;
  date: string;
}

// Uhrzeit in Deutschland, unabhängig von der Zeitzone des Servers
export function berlinNow(date: Date): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts['weekday']) + 1;
  return {
    weekday,
    minutes: Number(parts['hour']) * 60 + Number(parts['minute']),
    date: `${parts['year']}-${parts['month']}-${parts['day']}`,
  };
}

/**
 * Check-Zeiten, die gerade dran sind: im Fenster der letzten windowMin Minuten (der Cron läuft
 * alle 5 Minuten). Kennung je Tag und Zeit, damit jede Zeit nur einmal meldet.
 */
export function dueSchedules(
  schedules: Schedule[],
  now: LocalNow,
  windowMin = 5,
): { schedule: Schedule; slot: string }[] {
  return schedules
    .filter((schedule) => schedule.days.includes(now.weekday))
    .filter((schedule) => {
      const [h, m] = schedule.time.split(':').map(Number);
      const age = now.minutes - (h * 60 + m);
      return age >= 0 && age < windowMin;
    })
    .map((schedule) => ({
      schedule,
      slot: `${now.date} ${schedule.time} ${schedule.reverse ? 'r' : 'h'}`,
    }));
}

// ---------------------------------------------------------------- Texte

const KIND_LABEL: Record<IncidentKind, string> = {
  jam: 'Stau',
  closure: 'Sperrung',
  roadworks: 'Baustelle',
  warning: 'Hinweis',
};

export const directionLabel = (reverse: boolean) => (reverse ? 'Rückweg' : 'Hinweg');

// Für eine Richtung relevant: gleiche Richtung oder unbekannt; geplante zählen nicht
export function forDirection(incidents: Incident[], reverse: boolean): Incident[] {
  return incidents.filter((i) => !i.future && (i.reverse === null || i.reverse === reverse));
}

export function incidentLine(incident: Incident): string {
  const head = incident.title.toLowerCase().startsWith(KIND_LABEL[incident.kind].toLowerCase())
    ? incident.title
    : `${KIND_LABEL[incident.kind]} ${incident.title}`;
  const delay = incident.delayMinutes ? ` (+${incident.delayMinutes} Min.)` : '';
  return `${head}${delay}`;
}

const minutesText = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` : `${minutes} Min.`;

/** Mitteilung zur Check-Zeit: Fahrzeit, Verzögerung und was auf der Strecke los ist. */
export function departureMessage(
  name: string,
  result: CheckResult,
): { title: string; message: string; clear: boolean } {
  const relevant = forDirection(result.incidents, result.reverse);
  const urgent = relevant.filter((i) => i.kind !== 'roadworks' && i.kind !== 'warning');
  const works = relevant.filter((i) => i.kind === 'roadworks');
  const delay = result.delayMinutes ?? 0;
  const clear = !urgent.length && delay < 5;

  const time = result.travelMinutes !== null ? minutesText(result.travelMinutes) : null;
  const state = clear
    ? `frei${time ? `, ${time}` : ''}`
    : delay >= 1
      ? `+${delay} Min.${time ? `, ${time}` : ''}`
      : `${urgent.length} Störung${urgent.length === 1 ? '' : 'en'}`;
  const title = `${name} (${directionLabel(result.reverse)}): ${state}`;

  const lines = urgent.slice(0, 3).map(incidentLine);
  if (urgent.length > 3) lines.push(`und ${urgent.length - 3} weitere`);
  if (works.length)
    lines.push(`${works.length} Baustelle${works.length === 1 ? '' : 'n'} auf dem Weg`);
  const message = lines.length ? lines.join(' · ') : 'Keine Staus oder Sperrungen auf der Strecke.';
  return { title: title.slice(0, 100), message: message.slice(0, 500), clear };
}

/** Sofort-Mitteilung bei neuem Stau oder neuer Sperrung. */
export function liveMessage(name: string, incident: Incident): { title: string; message: string } {
  const where = incident.reverse === null ? '' : ` (${directionLabel(incident.reverse)})`;
  return {
    title: `${KIND_LABEL[incident.kind]} auf ${name}${where}`.slice(0, 100),
    message: [incidentLine(incident), incident.detail].filter(Boolean).join(' – ').slice(0, 500),
  };
}

/** Sofort-Mitteilung, wenn die Fahrzeit laut TomTom deutlich länger wird. */
export function delayMessage(
  name: string,
  result: CheckResult,
): { title: string; message: string } {
  const relevant = forDirection(result.incidents, result.reverse).filter(
    (i) => i.kind === 'jam' || i.kind === 'closure',
  );
  const time =
    result.travelMinutes !== null ? `, ${minutesText(result.travelMinutes)} insgesamt` : '';
  return {
    title: `${name} (${directionLabel(result.reverse)}): +${result.delayMinutes} Min.`.slice(
      0,
      100,
    ),
    message: (
      (relevant.length
        ? relevant.slice(0, 3).map(incidentLine).join(' · ')
        : 'Mehr Verkehr als sonst') + time
    ).slice(0, 500),
  };
}
