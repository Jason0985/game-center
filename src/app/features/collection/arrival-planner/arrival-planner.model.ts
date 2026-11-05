export interface ArrivalPlannerSettings {
  travelMinutes: number;
  trafficBufferMinutes: number;
  preparationMinutes: number;
  // Nur Admins: Rapla-Link (DHBW) für die Ansicht „Uni“ und wie früh man vor der Vorlesung da sein will
  raplaUrl?: string;
  lectureEarlyMinutes?: number;
  // Titel, die nicht als Vorlesung zählen (z. B. „Freie Zeit …“); fehlt die Liste, gilt SKIP_LECTURE
  raplaIgnore?: string[];
}

// Rapla-Einträge, die standardmäßig nicht als Vorlesung zählen
export const SKIP_LECTURE =
  /freie zeit|selbststudium|tech caf|langer abend|vorlesungsfrei|feiertag|ferien|urlaub|reserviert/i;

export const DEFAULT_ARRIVAL_PLANNER_SETTINGS: ArrivalPlannerSettings = {
  travelMinutes: 30,
  trafficBufferMinutes: 15,
  preparationMinutes: 30,
};
