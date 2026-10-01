import { eventAge, formatClock } from './table.model';

describe('formatClock', () => {
  it('shows minutes and padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(48.9)).toBe('0:48');
    expect(formatClock(125)).toBe('2:05');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('eventAge', () => {
  const latest = '2026-10-01T12:01:00Z';

  it('measures from local arrival plus the server gap', () => {
    // Neuestes Ereignis kam vor 5 s an: "jetzt"
    expect(eventAge(105_000, 100_000, latest, latest)).toBe('jetzt');
    // Älteres Ereignis lag laut Server 60 s davor
    expect(eventAge(105_000, 100_000, latest, '2026-10-01T12:00:00Z')).toBe('1:05');
  });

  it('is empty without a valid time', () => {
    expect(eventAge(105_000, 100_000, latest, undefined)).toBe('');
    expect(eventAge(105_000, 100_000, undefined, latest)).toBe('');
  });
});
