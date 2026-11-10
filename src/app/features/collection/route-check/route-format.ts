import type { CheckResult, Incident, IncidentKind, Schedule } from './route-check.service';

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const DAYS = DAY_SHORT.map((label, index) => ({ day: index + 1, label }));

// [1,2,3,4,5] -> "Mo–Fr", [6,7] -> "Sa, So", alle -> "täglich"
export function formatDays(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'täglich';
  const runs: number[][] = [];
  for (const day of sorted) {
    const run = runs[runs.length - 1];
    if (run && day === run[run.length - 1] + 1) run.push(day);
    else runs.push([day]);
  }
  return runs
    .map((run) =>
      run.length >= 3
        ? `${DAY_SHORT[run[0] - 1]}–${DAY_SHORT[run[run.length - 1] - 1]}`
        : run.map((day) => DAY_SHORT[day - 1]).join(', '),
    )
    .join(', ');
}

export function formatSchedule(schedule: Schedule): string {
  return `${formatDays(schedule.days)} ${schedule.time} ${schedule.reverse ? 'Rückweg' : 'Hinweg'}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} Std. ${rest} Min.` : `${minutes / 60} Std.`;
}

export const KIND: Record<IncidentKind, { label: string; icon: string }> = {
  jam: { label: 'Stau', icon: 'traffic' },
  closure: { label: 'Sperrung', icon: 'block' },
  roadworks: { label: 'Baustelle', icon: 'construction' },
  warning: { label: 'Hinweis', icon: 'warning' },
};

export type RouteState = 'clear' | 'slow' | 'blocked' | 'unknown';

// Ampel für den letzten Check: frei, zäh (Verzögerung/Baustelle), Stau oder Sperrung
export function routeState(result: CheckResult | null, incidents: Incident[]): RouteState {
  if (!result) return 'unknown';
  const delay = result.delayMinutes ?? 0;
  if (incidents.some((i) => i.kind === 'closure') || delay >= 15) return 'blocked';
  if (incidents.some((i) => i.kind === 'jam') || delay >= 5) return 'slow';
  return 'clear';
}

export function stateText(result: CheckResult | null, state: RouteState): string {
  if (!result) return 'Noch nicht geprüft';
  const time = result.travelMinutes !== null ? formatMinutes(result.travelMinutes) : null;
  const delay = result.delayMinutes ?? 0;
  if (state === 'clear') return time ? `Frei · ${time}` : 'Frei';
  if (delay >= 1) return time ? `+${delay} Min. · ${time}` : `+${delay} Min.`;
  return state === 'blocked' ? 'Gesperrt' : 'Stau';
}
