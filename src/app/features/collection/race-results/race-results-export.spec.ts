import rltExport from '../../../../../supabase/functions/race-result-ocr/examples/rlt-export-baku.json';
import {
  buildRltSessionExport,
  formatGap,
  formatLapGap,
  formatTime,
  parseLapsBehind,
  parseTime,
} from './race-results-export';
import { ResultRow, SessionMeta } from './race-results.model';

const META: SessionMeta = {
  leagueName: 'GFSL',
  seasonName: 'Season 4',
  championshipName: 'F1 2026',
  round: 9,
  sessionStart: '2026-09-25T20:00',
  trackName: 'Baku City Circuit',
  sessionType: 'Race',
  raceType: 'Main',
  totalLaps: 26,
};

type Line = [string, string, number, string, string, ResultRow['status'], number];

// Baku-Rennen, wie es auf dem Ergebnisbildschirm steht (Punkte nach GFSL-Punktesystem)
const BAKU_SCREEN: Line[] = [
  ['GFO_Giannisch_GR', 'Cadillac', 4, '48:55.048', '1:42.403', 'Finished', 30],
  ['[HLR] Spezi', 'Cadillac', 1, '+8.001', '1:41.960', 'Finished', 25],
  ['Agent47_ln1', 'Oracle Red Bull Racing', 5, '+9.581', '1:42.270', 'Finished', 22],
  ['[VLS] Samuel', 'Williams', 6, '+10.282', '1:43.431', 'Finished', 19],
  ['HLR_Nico09', 'Red Bull', 2, '+21.017', '1:42.063', 'Finished', 17],
  ['IDL_Enki_GFSL', 'Ferrari', 8, '+21.068', '1:43.888', 'Finished', 15],
  ['Fetzi', 'Haas', 11, '+42.027', '1:44.293', 'Finished', 13],
  ['Unrundsocken', 'McLaren', 3, '+47.793', '1:42.274', 'Finished', 11],
  ['trauriger_Comic', 'Williams', 7, '+1:10.135', '1:42.717', 'Finished', 9],
  ['GFSL_Grajo', 'Mercedes', 14, '+1:11.834', '1:43.785', 'Finished', 7],
  ['GFSL_Treesixty', 'Mercedes', 10, '+1:19.514', '1:43.462', 'Finished', 5],
  ['KaiserPinguin197', 'Aston Martin', 13, '', '', 'DNF', 0],
  ['IBaldi', 'Ferrari', 12, '', '', 'DNF', 0],
  ['[GRL] Sisiabi', 'Haas', 9, 'DNF', '', 'DNF', 0],
];

const bakuRows = (): ResultRow[] =>
  BAKU_SCREEN.map(([driverName, teamName, gridPosition, time, bestLap, status, points], index) => ({
    id: index,
    position: index + 1,
    driverName,
    teamName,
    gridPosition,
    time,
    bestLap,
    status,
    penaltySeconds: null,
    points,
  }));

function row(overrides: Partial<ResultRow>): ResultRow {
  return {
    id: 0,
    position: 1,
    driverName: 'Driver',
    teamName: '',
    gridPosition: null,
    bestLap: '',
    time: '',
    status: 'Finished',
    penaltySeconds: null,
    points: null,
    ...overrides,
  };
}

describe('race results export', () => {
  it('parses game time formats into milliseconds', () => {
    expect(parseTime('1:23.456')).toBe(83456);
    expect(parseTime('50:14.562')).toBe(3014562);
    expect(parseTime('+5.123')).toBe(5123);
    expect(parseTime('+1:02.3')).toBe(62300);
    expect(parseTime('1:02:03.456')).toBe(3723456);
    expect(parseTime('50:14,562')).toBe(3014562);
    expect(parseTime('DNF')).toBeNull();
    expect(parseTime('+1 Lap')).toBeNull();
  });

  it('recognises lapped cars', () => {
    expect(parseLapsBehind('+1 Lap')).toBe(1);
    expect(parseLapsBehind('+2 Laps')).toBe(2);
    expect(parseLapsBehind('+1 Runde')).toBe(1);
    expect(parseLapsBehind('+1L')).toBe(1);
    expect(parseLapsBehind('+5.123')).toBeNull();
  });

  it('formats times and gaps like RLT', () => {
    expect(formatTime(83456)).toBe('1:23.456');
    expect(formatTime(3014562)).toBe('50:14.562');
    expect(formatTime(5535123)).toBe('1:32:15.123');
    expect(formatGap(5234)).toBe('+5.234');
    expect(formatGap(62345)).toBe('+1:02.345');
    expect(formatLapGap(1)).toBe('+1 Lap');
    expect(formatLapGap(26)).toBe('+26 Laps');
  });

  it('reproduces the real RLT export of the Baku race', () => {
    const result = buildRltSessionExport(
      META,
      bakuRows(),
      new Date(rltExport.metadata.exportedAt),
      rltExport.session.sessionInfo.sessionId,
    );
    // driverInfo (Nationalität, Startnummer, ...) steht nicht auf dem Ergebnisbildschirm
    const expectedDrivers = rltExport.session.drivers.map(({ driverInfo, ...driver }) => driver);

    expect(result.metadata).toEqual(rltExport.metadata);
    expect(result.event).toEqual(rltExport.event);
    expect(result.session.sessionInfo).toEqual(rltExport.session.sessionInfo);
    expect(result.session.fastestLap).toEqual(rltExport.session.fastestLap);
    expect(result.session.raceDetails).toEqual(rltExport.session.raceDetails);
    expect(result.session.drivers).toEqual(expectedDrivers);
  });

  it('writes lapped cars with the RLT lap gap', () => {
    const result = buildRltSessionExport(META, [
      row({ position: 1, time: '45:00.000' }),
      row({ position: 2, time: '+1 Lap', driverName: 'Lapped' }),
    ]);

    expect(result.session.drivers[1]).toEqual(
      expect.objectContaining({ lapsCompleted: 25, gap: '+1 Lap', gapMs: 1_000_000_000 }),
    );
    expect(result.session.drivers[1].totalTime).toBeUndefined();
  });

  it('builds a qualification session with gaps to pole', () => {
    const result = buildRltSessionExport({ ...META, sessionType: 'Qualification' }, [
      row({ position: 1, driverName: 'Pole', bestLap: '1:40.500', gridPosition: 1 }),
      row({ position: 2, driverName: 'Second', time: '1:41.000' }),
    ]);
    const [pole, second] = result.session.drivers;

    expect(result.session.sessionInfo.raceType).toBeUndefined();
    expect(result.session.raceDetails).toBeUndefined();
    expect(result.session.fastestLap?.lapTime).toBe('1:40.500');
    expect(pole).toEqual(expect.objectContaining({ classificationPosition: 1, gap: '0' }));
    expect(pole.status).toBeUndefined();
    expect(pole.gridPosition).toBeUndefined();
    expect(second).toEqual(
      expect.objectContaining({ fastestLapTime: '1:41.000', gap: '+0.500', gapMs: 500 }),
    );
  });
});
