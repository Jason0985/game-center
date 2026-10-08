import {
  buildTrainSchedule,
  pickRecommendedJourney,
  TrainJourney,
  TrainLeg,
  transferMinutes,
} from './arrival-planner-train.model';

function leg(from: string, to: string, overrides: Partial<TrainLeg> = {}): TrainLeg {
  return {
    kind: 'transit',
    mode: 'REGIONAL_RAIL',
    line: 'RE 1',
    headsign: null,
    operator: null,
    durationMinutes: 0,
    distanceMeters: null,
    stopCount: 0,
    realTime: false,
    cancelled: false,
    from: { name: 'A', time: from, scheduledTime: from, track: null, trackChanged: false },
    to: { name: 'B', time: to, scheduledTime: to, track: null, trackChanged: false },
    ...overrides,
  };
}

function journey(departure: string, arrival: string, legs: TrainLeg[]): TrainJourney {
  return { departure, arrival, durationMinutes: 0, transfers: legs.length - 1, legs };
}

describe('arrival planner train model', () => {
  const early = journey('2026-10-09T05:00:00Z', '2026-10-09T05:40:00Z', [
    leg('2026-10-09T05:00:00Z', '2026-10-09T05:40:00Z'),
  ]);
  const late = journey('2026-10-09T05:20:00Z', '2026-10-09T05:50:00Z', [
    leg('2026-10-09T05:20:00Z', '2026-10-09T05:50:00Z'),
  ]);

  it('recommends the connection with the latest departure', () => {
    expect(pickRecommendedJourney([early, late])).toBe(1);
  });

  it('skips cancelled connections', () => {
    const cancelled = { ...late, legs: [{ ...late.legs[0], cancelled: true }] };
    expect(pickRecommendedJourney([early, cancelled])).toBe(0);
    expect(pickRecommendedJourney([cancelled])).toBe(-1);
  });

  it('subtracts walk and preparation time when starting at a station', () => {
    const settings = { preparationMinutes: 30, walkToStationMinutes: 10, arrivalBufferMinutes: 5 };
    const target = new Date('2026-10-09T06:00:00Z');

    const schedule = buildTrainSchedule(late, target, settings, true);

    expect(schedule.leaveHome.toISOString()).toBe('2026-10-09T05:10:00.000Z');
    expect(schedule.alarm.toISOString()).toBe('2026-10-09T04:40:00.000Z');
    expect(schedule.firstTrain).toBe(late.legs[0]);
    expect(schedule.spareMinutes).toBe(10);
  });

  it('does not add a walk to the station when starting at an address', () => {
    const settings = { preparationMinutes: 20, walkToStationMinutes: 10, arrivalBufferMinutes: 0 };
    const walk = leg('2026-10-09T05:12:00Z', '2026-10-09T05:20:00Z', { kind: 'walk', line: null });
    const withWalk = journey('2026-10-09T05:12:00Z', '2026-10-09T05:50:00Z', [walk, ...late.legs]);

    const schedule = buildTrainSchedule(
      withWalk,
      new Date('2026-10-09T06:00:00Z'),
      settings,
      false,
    );

    expect(schedule.leaveHome.toISOString()).toBe('2026-10-09T05:12:00.000Z');
    expect(schedule.alarm.toISOString()).toBe('2026-10-09T04:52:00.000Z');
    expect(schedule.firstTrain).toBe(late.legs[0]);
  });

  it('computes the waiting time between two trains', () => {
    const first = leg('2026-10-09T05:00:00Z', '2026-10-09T05:20:00Z');
    const second = leg('2026-10-09T05:27:00Z', '2026-10-09T05:50:00Z');
    expect(transferMinutes(first, second)).toBe(7);
  });
});
