export interface ArrivalPlannerSettings {
  travelMinutes: number;
  trafficBufferMinutes: number;
  preparationMinutes: number;
}

export const DEFAULT_ARRIVAL_PLANNER_SETTINGS: ArrivalPlannerSettings = {
  travelMinutes: 30,
  trafficBufferMinutes: 15,
  preparationMinutes: 30,
};
