// Antworten der Edge Function "train-connections"

export type TrainLocationKind = 'stop' | 'address' | 'place';

export interface TrainLocation {
  // Haltestellen-ID oder "lat,lon"
  place: string;
  name: string;
  detail: string | null;
  kind: TrainLocationKind;
}

export interface TrainStopTime {
  name: string | null;
  time: string;
  scheduledTime: string;
  track: string | null;
  // Gleiswechsel laut Echtzeitdaten
  trackChanged: boolean;
}

export interface TrainLeg {
  kind: 'walk' | 'transit';
  mode: string;
  line: string | null;
  headsign: string | null;
  operator: string | null;
  durationMinutes: number;
  distanceMeters: number | null;
  stopCount: number;
  realTime: boolean;
  cancelled: boolean;
  from: TrainStopTime;
  to: TrainStopTime;
}

export interface TrainJourney {
  departure: string;
  arrival: string;
  durationMinutes: number;
  transfers: number;
  legs: TrainLeg[];
}

// --- Einstellungen --------------------------------------------------------------------------

export interface TrainPlannerSettings {
  preparationMinutes: number;
  // Nur wenn der Start ein Bahnhof ist; bei einer Adresse plant Transitous den Fußweg selbst
  walkToStationMinutes: number;
  arrivalBufferMinutes: number;
}

export const DEFAULT_TRAIN_PLANNER_SETTINGS: TrainPlannerSettings = {
  preparationMinutes: 30,
  walkToStationMinutes: 10,
  arrivalBufferMinutes: 5,
};

export function isValidTrainSettings(settings: Partial<TrainPlannerSettings>): boolean {
  return [
    settings.preparationMinutes,
    settings.walkToStationMinutes,
    settings.arrivalBufferMinutes,
  ].every((value) => Number.isInteger(value) && value! >= 0 && value! <= 300);
}

// --- Zeitplan -------------------------------------------------------------------------------

const MINUTE = 60 * 1000;

export interface TrainSchedule {
  alarm: Date;
  leaveHome: Date;
  firstTrain: TrainLeg | null;
  arrival: Date;
  // Wie viele Minuten man vor der Wunschzeit ankommt
  spareMinutes: number;
}

// Die Verbindung mit der spätesten Abfahrt lässt am längsten schlafen
export function pickRecommendedJourney(journeys: TrainJourney[]): number {
  let best = -1;
  journeys.forEach((journey, index) => {
    if (journey.legs.some((leg) => leg.cancelled)) {
      return;
    }
    if (best < 0 || journey.departure > journeys[best].departure) {
      best = index;
    }
  });
  return best;
}

export function buildTrainSchedule(
  journey: TrainJourney,
  target: Date,
  settings: TrainPlannerSettings,
  startsAtStop: boolean,
): TrainSchedule {
  const departure = new Date(journey.departure);
  const walkMinutes = startsAtStop ? settings.walkToStationMinutes : 0;
  const leaveHome = new Date(departure.getTime() - walkMinutes * MINUTE);
  const arrival = new Date(journey.arrival);

  return {
    alarm: new Date(leaveHome.getTime() - settings.preparationMinutes * MINUTE),
    leaveHome,
    firstTrain: journey.legs.find((leg) => leg.kind === 'transit') ?? null,
    arrival,
    spareMinutes: Math.round((target.getTime() - arrival.getTime()) / MINUTE),
  };
}

export function delayMinutes(stop: TrainStopTime): number {
  return Math.round(
    (new Date(stop.time).getTime() - new Date(stop.scheduledTime).getTime()) / MINUTE,
  );
}

// Wartezeit zwischen zwei Fahrten in Minuten
export function transferMinutes(previous: TrainLeg, next: TrainLeg): number {
  return Math.round(
    (new Date(next.from.time).getTime() - new Date(previous.to.time).getTime()) / MINUTE,
  );
}
