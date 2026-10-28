import { ResultRow, SessionMeta, findTeam, findTrack } from './race-results.model';

// Baut eine Session-Datei genau so, wie Racing League Tools sie über "Export results (json)"
// schreibt (Vorlage: supabase/functions/race-result-ocr/examples/rlt-export-baku.json).
// Unbekannte Werte werden weggelassen statt als null geschrieben, wie im Original.

// RLT schreibt überrundete und ausgefallene Fahrer als "+N Laps" mit N * 10^9 ms
const LAP_GAP_MS = 1_000_000_000;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

// 83456 -> "1:23.456", 3014562 -> "50:14.562", ab einer Stunde "1:02:03.456"
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = `${pad(totalSeconds % 60)}.${pad(ms % 1000, 3)}`;
  return hours > 0 ? `${hours}:${pad(minutes)}:${seconds}` : `${minutes}:${seconds}`;
}

// 5234 -> "+5.234", 62345 -> "+1:02.345"
export function formatGap(ms: number): string {
  return ms < 60000 ? `+${Math.floor(ms / 1000)}.${pad(ms % 1000, 3)}` : `+${formatTime(ms)}`;
}

// 1 -> "+1 Lap", 26 -> "+26 Laps"
export function formatLapGap(laps: number): string {
  return `+${laps} ${laps === 1 ? 'Lap' : 'Laps'}`;
}

// Liest Zeiten wie "1:23.456", "+5.123", "50:14,562" oder "1:02:03.456" in Millisekunden
export function parseTime(text: string): number | null {
  const cleaned = text
    .trim()
    .replace(/^\+\s*/, '')
    .replace(',', '.');
  if (!/^\d+(:\d{1,2}){0,2}(\.\d{1,3})?$/.test(cleaned)) {
    return null;
  }

  const [secondsPart, ...higherParts] = cleaned.split(':').reverse();
  const [whole, fraction = ''] = secondsPart.split('.');
  const minutes = Number(higherParts[0] ?? 0);
  const hours = Number(higherParts[1] ?? 0);
  return ((hours * 60 + minutes) * 60 + Number(whole)) * 1000 + Number(fraction.padEnd(3, '0'));
}

// "+1 Lap", "+2 Laps", "+1 Runde", "+1L" -> Anzahl Runden Rückstand
export function parseLapsBehind(text: string): number | null {
  const match = text.trim().match(/^\+?\s*(\d+)\s*(?:laps?|runden?|rnd\.?|l)$/i);
  return match ? Number(match[1]) : null;
}

export function sortRows(rows: ResultRow[]): ResultRow[] {
  return [...rows].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
}

interface Timing {
  lapsCompleted: number;
  totalMs?: number;
  gap?: string;
  gapMs?: number;
}

function lapGap(laps: number): Pick<Timing, 'gap' | 'gapMs'> {
  return { gap: formatLapGap(laps), gapMs: laps * LAP_GAP_MS };
}

function raceTimings(rows: ResultRow[], totalLaps: number | null): Timing[] {
  let leaderMs: number | undefined;

  return rows.map((row) => {
    // Ausfälle zählt RLT mit 0 Runden und der vollen Distanz als Rückstand
    if (row.status !== 'Finished') {
      return { lapsCompleted: 0, ...(totalLaps ? lapGap(totalLaps) : {}) };
    }

    const lapsBehind = parseLapsBehind(row.time);
    const lapsCompleted = Math.max((totalLaps ?? 0) - (lapsBehind ?? 0), 0);
    if (lapsBehind !== null) {
      return { lapsCompleted, ...lapGap(lapsBehind) };
    }

    // Der Sieger hat eine Gesamtzeit, alle anderen nur den Abstand zu ihm
    if (row.time.trim().startsWith('+')) {
      const gapMs = parseTime(row.time) ?? undefined;
      if (gapMs === undefined) return { lapsCompleted };
      const totalMs = leaderMs !== undefined ? leaderMs + gapMs : undefined;
      return { lapsCompleted, totalMs, gap: formatGap(gapMs), gapMs };
    }

    const totalMs = parseTime(row.time) ?? undefined;
    if (totalMs === undefined) return { lapsCompleted };
    leaderMs ??= totalMs;
    const gapMs = totalMs - leaderMs;
    return { lapsCompleted, totalMs, gap: gapMs === 0 ? '0' : formatGap(gapMs), gapMs };
  });
}

// Im Qualifying zählt die schnellste Runde; der Abstand bezieht sich auf die Pole
function lapTimings(lapTimes: (number | undefined)[]): Timing[] {
  const poleMs = lapTimes.find((lapMs) => lapMs !== undefined);

  return lapTimes.map((lapMs) => {
    if (lapMs === undefined || poleMs === undefined) return { lapsCompleted: 0 };
    const gapMs = lapMs - poleMs;
    return { lapsCompleted: 0, gap: gapMs === 0 ? '0' : formatGap(gapMs), gapMs };
  });
}

function teamBlock(teamName: string) {
  const name = teamName.trim();
  if (!name) return undefined;

  const info = findTeam(name);
  return info ? { ...info } : { name };
}

export function buildRltSessionExport(
  meta: SessionMeta,
  rows: ResultRow[],
  exportedAt = new Date(),
  sessionId: string = crypto.randomUUID(),
) {
  const isRace = meta.sessionType === 'Race';
  const sorted = sortRows(rows);
  const lapTimes = sorted.map(
    (row) => parseTime(isRace ? row.bestLap : row.bestLap || row.time) ?? undefined,
  );
  const timings = isRace ? raceTimings(sorted, meta.totalLaps) : lapTimings(lapTimes);

  const fastestIndex = lapTimes.reduce<number | undefined>(
    (best, lapMs, index) =>
      lapMs !== undefined && (best === undefined || lapMs < lapTimes[best]!) ? index : best,
    undefined,
  );

  const drivers = sorted.map((row, index) => {
    const timing = timings[index];
    const previousTotal = index > 0 ? timings[index - 1].totalMs : undefined;
    const intervalMs =
      timing.totalMs !== undefined && previousTotal !== undefined
        ? timing.totalMs - previousTotal
        : undefined;
    const lapMs = lapTimes[index];
    const position = row.position ?? index + 1;
    const classified = !isRace || row.status === 'Finished';
    const points = row.points !== null ? String(row.points) : isRace ? '0' : undefined;

    return {
      driverName: row.driverName.trim(),
      position,
      classificationPosition: classified ? position : -1,
      gridPosition: isRace ? (row.gridPosition ?? undefined) : undefined,
      positionChange:
        isRace && classified && row.gridPosition !== null ? row.gridPosition - position : undefined,
      status: isRace ? row.status : undefined,
      lapsCompleted: timing.lapsCompleted,
      driverPoints: points,
      teamPoints: points,
      totalTime: timing.totalMs !== undefined ? formatTime(timing.totalMs) : undefined,
      totalTimeMs: timing.totalMs,
      gap: timing.gap,
      gapMs: timing.gapMs,
      interval: intervalMs !== undefined ? formatGap(intervalMs) : undefined,
      intervalMs,
      fastestLapTime: lapMs !== undefined ? formatTime(lapMs) : undefined,
      fastestLapTimeMs: lapMs,
      team: teamBlock(row.teamName),
    };
  });

  const round = meta.round ?? 1;
  const track = findTrack(meta.trackName);
  const fastestMs = fastestIndex !== undefined ? lapTimes[fastestIndex] : undefined;
  const caption = isRace
    ? meta.raceType === 'Sprint'
      ? 'Sprint'
      : 'Race'
    : meta.sessionType === 'Qualification'
      ? 'Qualification'
      : 'Practice';

  const data = {
    metadata: {
      formatVersion: 1,
      exportType: 'Session',
      exportedAt: exportedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      sourceApplication: 'Racing League Tools',
      leagueName: meta.leagueName.trim() || undefined,
    },
    // Saison-Kontext ist nur Info; RLT ordnet beim Import die Saison der geöffneten Datenbank zu
    season: {
      seasonName: meta.seasonName.trim(),
      championshipName: meta.championshipName.trim() || undefined,
      totalRounds: round,
      completedRounds: round,
      isMulticlass: false,
    },
    event: {
      round,
      championshipPosition: round,
      eventDate: meta.sessionStart ? meta.sessionStart.slice(0, 10) : undefined,
      // RLT schreibt die Ortszeit mit "Z" (siehe Vorlage: 20:00 Uhr -> "T20:00:00Z")
      eventDateTime: meta.sessionStart ? `${meta.sessionStart.slice(0, 16)}:00Z` : undefined,
      racesCount: 1,
      qualificationsCount: 1,
      track: {
        trackName: track?.name ?? meta.trackName.trim(),
        country: track?.country,
        turnsCount: track?.turnsCount,
      },
    },
    session: {
      sessionInfo: {
        sessionId,
        sessionType: meta.sessionType,
        raceType: isRace ? meta.raceType : undefined,
        sessionPosition: 1,
        sessionCaption: caption,
        completedStatus: 'Completed',
        totalLaps: isRace ? (meta.totalLaps ?? undefined) : undefined,
        driversCount: drivers.length,
        // Wetter und Safety Cars zeigt der Ergebnisbildschirm nicht; RLT-Standardwerte
        weatherType: 'Clear',
        airTemperature: 0,
        trackTemperature: 0,
        safetyCarCount: isRace ? 0 : undefined,
        virtualSafetyCarCount: isRace ? 0 : undefined,
      },
      fastestLap:
        fastestIndex !== undefined && fastestMs !== undefined
          ? {
              lapTime: formatTime(fastestMs),
              lapTimeMs: fastestMs,
              driverName: sorted[fastestIndex].driverName.trim(),
            }
          : undefined,
      raceDetails: isRace
        ? { raceType: meta.raceType, isMajorRace: meta.raceType === 'Main' }
        : undefined,
      drivers,
    },
  };

  // undefined-Felder fallen hier heraus, so wie RLT leere Werte weglässt
  return JSON.parse(JSON.stringify(data)) as typeof data;
}
