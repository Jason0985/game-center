import {
  autobahnIncident,
  autobahnRoads,
  berlinNow,
  departureMessage,
  dueSchedules,
  forDirection,
  type LatLon,
  matchLine,
  mergeIncidents,
  orderVias,
  parsePath,
  parseSchedules,
  parseVias,
  routeSteps,
  supportingPoints,
  simplifyPath,
  tomtomIncidents,
  type CheckResult,
  type Incident,
} from '../../../../../supabase/functions/route-traffic/route-logic';
import { formatDays, routeState } from './route-format';

// Gerade Strecke nach Norden, ca. 11 km (Breite 50.00 -> 50.10 bei Länge 8.60)
const path: LatLon[] = Array.from({ length: 21 }, (_, i) => [50 + i * 0.005, 8.6]);
// GeoJSON-Linie [lon, lat] von lat a nach lat b, lon versetzt
const line = (a: number, b: number, lon = 8.6): [number, number][] =>
  Array.from({ length: 10 }, (_, i) => [lon, a + ((b - a) * i) / 9]);

describe('Routen-Check: Strecke und Abgleich', () => {
  it('thins out the path but keeps start and goal', () => {
    const dense: LatLon[] = Array.from({ length: 1001 }, (_, i) => [50 + i * 0.0001, 8.6]);
    const thin = simplifyPath(dense, 150);
    expect(thin[0]).toEqual([50, 8.6]);
    expect(thin.at(-1)).toEqual([50.1, 8.6]);
    expect(thin.length).toBeLessThan(120);
  });

  it('matches a report on the route with its driving direction', () => {
    expect(matchLine(line(50.03, 50.05), path)).toEqual({
      position: expect.closeTo(0.3, 1),
      reverse: false,
    });
    expect(matchLine(line(50.05, 50.03), path)?.reverse).toBe(true);
  });

  it('ignores reports next to the route', () => {
    // ~1,4 km östlich parallel
    expect(matchLine(line(50.03, 50.05, 8.62), path)).toBeNull();
  });

  it('reads Autobahn jams with delay and event number', () => {
    const incident = autobahnIncident(
      {
        identifier: 'NLW_2026_1--vi-hind.2026-11-10_00-13',
        title: 'A3 | Limburg-Nord - Diez',
        subtitle: ' Frankfurt -> Köln',
        abnormalTrafficType: 'QUEUING_TRAFFIC',
        delayTimeValue: '17',
        description: ['Ereignismeldung:', '- Im Stillstand', '- Reisezeitverlust: 17 Minuten'],
        geometry: { type: 'LineString', coordinates: line(50.06, 50.04) },
      },
      'warning',
      'A3',
      path,
    );
    expect(incident).toMatchObject({
      id: 'ab:NLW_2026_1',
      kind: 'jam',
      title: 'A3 Limburg-Nord - Diez',
      detail: 'Frankfurt -> Köln, Im Stillstand',
      delayMinutes: 17,
      reverse: true,
    });
  });

  it('finds Autobahn numbers in TomTom road numbers', () => {
    expect(autobahnRoads(['E35/A5', 'B3', 'A 661', 'A5', 'L3004', 'A64a'])).toEqual([
      'A5',
      'A64a',
      'A661',
    ]);
  });

  it('reads TomTom traffic sections and merges twins with Autobahn reports', () => {
    const route = {
      legs: [{ points: path.map(([latitude, longitude]) => ({ latitude, longitude })) }],
      sections: [
        { sectionType: 'TRAFFIC', startPointIndex: 8, simpleCategory: 'JAM', delayInSeconds: 600 },
        { sectionType: 'CAR', startPointIndex: 0 },
      ],
      guidance: { instructions: [{ pointIndex: 0, roadNumbers: ['A3'] }] },
    };
    const tt = tomtomIncidents(route, false);
    expect(tt).toHaveLength(1);
    expect(tt[0]).toMatchObject({ kind: 'jam', title: 'Stau A3', delayMinutes: 10, position: 0.4 });

    const ab: Incident = {
      ...tt[0],
      id: 'ab:1',
      source: 'autobahn',
      delayMinutes: 17,
      reverse: null,
    };
    const merged = mergeIncidents(tt, [ab], 11_000);
    expect(merged).toHaveLength(1);
    expect(merged[0].delayMinutes).toBe(17);
  });
});

describe('Routen-Check: Zeitplan und Texte', () => {
  it('validates schedules', () => {
    expect(parseSchedules([{ time: '06:45', days: [5, 1, 1], reverse: true }])).toEqual([
      { time: '06:45', days: [1, 5], reverse: true },
    ]);
    expect(parseSchedules([{ time: '25:00', days: [1] }])).toBeNull();
    expect(parseSchedules([{ time: '07:00', days: [] }])).toBeNull();
  });

  it('uses German local time', () => {
    // 10.11.2026 05:47 UTC = Dienstag 06:47 in Berlin
    expect(berlinNow(new Date('2026-11-10T05:47:00Z'))).toEqual({
      weekday: 2,
      minutes: 6 * 60 + 47,
      date: '2026-11-10',
    });
  });

  it('fires a check time once inside the five-minute window', () => {
    const schedules = [{ time: '06:45', days: [1, 2, 3, 4, 5], reverse: false }];
    const at = (minutes: number, weekday = 2) => ({ weekday, minutes, date: '2026-11-10' });
    expect(dueSchedules(schedules, at(6 * 60 + 47))).toHaveLength(1);
    expect(dueSchedules(schedules, at(6 * 60 + 47))[0].slot).toBe('2026-11-10 06:45 h');
    expect(dueSchedules(schedules, at(6 * 60 + 50))).toHaveLength(0);
    expect(dueSchedules(schedules, at(6 * 60 + 44))).toHaveLength(0);
    expect(dueSchedules(schedules, at(6 * 60 + 46, 6))).toHaveLength(0);
  });

  const result = (incidents: Incident[], delay: number): CheckResult => ({
    checkedAt: '2026-11-10T05:45:00Z',
    reverse: false,
    travelMinutes: 34 + delay,
    delayMinutes: delay,
    baseMinutes: 34,
    lengthKm: 41,
    incidents,
    sources: ['tomtom', 'autobahn'],
  });
  const jam: Incident = {
    id: 'ab:1',
    source: 'autobahn',
    kind: 'jam',
    road: 'A3',
    title: 'A3 Limburg-Nord - Diez',
    detail: '',
    delayMinutes: 17,
    position: 0.4,
    reverse: false,
    future: false,
  };

  it('writes the departure push', () => {
    expect(departureMessage('Arbeit', result([], 0))).toEqual({
      title: 'Arbeit (Hinweg): frei, 34 Min.',
      message: 'Keine Staus oder Sperrungen auf der Strecke.',
      clear: true,
    });
    const works = { ...jam, id: 'ab:2', kind: 'roadworks' as const, delayMinutes: null };
    expect(departureMessage('Arbeit', result([jam, works], 17))).toEqual({
      title: 'Arbeit (Hinweg): +17 Min., 51 Min.',
      message: 'Stau A3 Limburg-Nord - Diez (+17 Min.) · 1 Baustelle auf dem Weg',
      clear: false,
    });
  });

  it('only counts reports for the driving direction', () => {
    const back = { ...jam, reverse: true };
    expect(forDirection([back], false)).toEqual([]);
    expect(departureMessage('Arbeit', result([back], 0)).clear).toBe(true);
  });

  it('formats days and the traffic light', () => {
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Mo–Fr');
    expect(formatDays([6, 7])).toBe('Sa, So');
    expect(formatDays([1, 3, 4, 5, 7])).toBe('Mo, Mi–Fr, So');
    expect(formatDays([1, 2, 3, 4, 5, 6, 7])).toBe('täglich');
    expect(routeState(result([], 2), [])).toBe('clear');
    expect(routeState(result([jam], 6), [jam])).toBe('slow');
    expect(routeState(result([], 20), [])).toBe('blocked');
  });
});

describe('eigene Strecke', () => {
  const path: [number, number][] = [
    [50.0, 8.0],
    [50.05, 8.0],
    [50.1, 8.0],
    [50.15, 8.0],
  ];

  it('sortiert Zwischenziele entlang der Strecke', () => {
    const vias = [
      { label: 'spät', lat: 50.14, lon: 8.001 },
      { label: 'früh', lat: 50.02, lon: 8.001 },
    ];
    expect(orderVias(vias, path).map((v) => v.label)).toEqual(['früh', 'spät']);
  });

  it('prüft Zwischenziele und geschickte Strecken', () => {
    expect(parseVias(undefined)).toEqual([]);
    expect(parseVias([{ label: 'A', lat: 1, lon: 2 }])).toEqual([{ label: 'A', lat: 1, lon: 2 }]);
    expect(parseVias([{ label: '', lat: 1, lon: 2 }])).toBeNull();
    expect(parseVias(new Array(4).fill({ label: 'A', lat: 1, lon: 2 }))).toBeNull();
    expect(parsePath([[1, 2]])).toBeNull();
    expect(
      parsePath([
        [1, 2],
        [3, 'x'],
      ]),
    ).toBeNull();
    expect(
      parsePath([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('baut Stützpunkte, für den Rückweg umgekehrt', () => {
    const points = supportingPoints(path, false);
    expect(points[0]).toEqual({ latitude: 50.0, longitude: 8.0 });
    expect(supportingPoints(path, true)[0]).toEqual({ latitude: 50.15, longitude: 8.0 });
    expect(points.length).toBeLessThanOrEqual(150);
  });

  it('liest den Straßenverlauf aus den Anweisungen', () => {
    const points = Array.from({ length: 101 }, (_, i) => ({
      latitude: 50 + i * 0.002,
      longitude: 8,
    }));
    const steps = routeSteps({
      legs: [{ points }],
      guidance: {
        instructions: [
          { pointIndex: 0, street: 'Berger Straße' },
          { pointIndex: 10, roadNumbers: ['E451', 'A661'] },
          { pointIndex: 11, street: '' },
          { pointIndex: 40, roadNumbers: ['E35/A5'] },
          { pointIndex: 41, roadNumbers: ['A 5'] },
          { pointIndex: 90, roadNumbers: ['B3'], street: 'Rheinstraße' },
        ],
      },
    });
    expect(steps.map((s) => s.road)).toEqual(['Berger Straße', 'A661', 'A5', 'B3']);
    expect(steps[2].km).toBeGreaterThan(10);
  });
});
