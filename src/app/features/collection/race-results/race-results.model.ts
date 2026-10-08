export type SessionType = 'Race' | 'Qualification' | 'Practice';
// Bezeichnungen wie im RLT-Export ("Main" = Hauptrennen)
export type RaceType = 'Main' | 'Sprint';
export type DriverStatus = 'Finished' | 'DNF' | 'DNS' | 'DSQ';

export const DRIVER_STATUSES: DriverStatus[] = ['Finished', 'DNF', 'DNS', 'DSQ'];

// Antwort der Edge Function race-result-ocr
export interface ExtractedResult {
  sessionType: SessionType | 'Unknown';
  trackName: string | null;
  totalLaps: number | null;
  drivers: {
    position: number;
    driverName: string;
    teamName: string | null;
    gridPosition: number | null;
    bestLap: string | null;
    time: string | null;
    status: DriverStatus;
    penaltySeconds: number | null;
    points: number | null;
  }[];
}

// Eine editierbare Zeile der Ergebnistabelle; Zeiten bleiben Text wie im Spiel angezeigt
export interface ResultRow {
  id: number;
  position: number | null;
  driverName: string;
  teamName: string;
  gridPosition: number | null;
  bestLap: string;
  time: string;
  status: DriverStatus;
  penaltySeconds: number | null;
  points: number | null;
}

export interface SessionMeta {
  leagueName: string;
  seasonName: string;
  championshipName: string;
  round: number | null;
  // datetime-local Wert, z. B. "2026-09-30T20:00"
  sessionStart: string;
  trackName: string;
  sessionType: SessionType;
  raceType: RaceType;
  totalLaps: number | null;
}

// Strecken und Teams aus der RLT-Datenbank, damit der Import sie zuordnen kann
export interface TrackInfo {
  name: string;
  country: string;
  turnsCount: number;
}

export const KNOWN_TRACKS: TrackInfo[] = [
  { name: 'Bahrain', country: 'Bahrain', turnsCount: 15 },
  { name: 'Jeddah', country: 'Saudi Arabia', turnsCount: 27 },
  { name: 'Melbourne', country: 'Australia', turnsCount: 14 },
  { name: 'Suzuka', country: 'Japan', turnsCount: 18 },
  { name: 'Shanghai', country: 'China', turnsCount: 16 },
  { name: 'Miami', country: 'United States Of America', turnsCount: 19 },
  { name: 'Imola', country: 'Italy', turnsCount: 19 },
  { name: 'Monaco', country: 'Monaco', turnsCount: 19 },
  { name: 'Montreal', country: 'Canada', turnsCount: 14 },
  { name: 'Barcelona', country: 'Spain', turnsCount: 14 },
  { name: 'Spielberg', country: 'Austria', turnsCount: 10 },
  { name: 'Silverstone', country: 'United Kingdom', turnsCount: 18 },
  { name: 'Hungaroring', country: 'Hungary', turnsCount: 14 },
  { name: 'Spa-Francorchamps', country: 'Belgium', turnsCount: 20 },
  { name: 'Zandvoort', country: 'Netherlands', turnsCount: 14 },
  { name: 'Monza', country: 'Italy', turnsCount: 11 },
  { name: 'Baku', country: 'Azerbaijan', turnsCount: 20 },
  { name: 'Singapore', country: 'Singapore', turnsCount: 19 },
  { name: 'Austin', country: 'United States Of America', turnsCount: 20 },
  { name: 'Mexico', country: 'Mexico', turnsCount: 17 },
  { name: 'Interlagos', country: 'Brazil', turnsCount: 15 },
  { name: 'Las Vegas', country: 'United States Of America', turnsCount: 17 },
  { name: 'Losail', country: 'Qatar', turnsCount: 16 },
  { name: 'Yas Marina', country: 'United Arab Emirates', turnsCount: 16 },
  { name: 'Paul Ricard', country: 'France', turnsCount: 15 },
  { name: 'Portimão', country: 'Portugal', turnsCount: 15 },
  { name: 'Madrid', country: 'Spain', turnsCount: 22 },
  { name: 'Silverstone Short', country: 'United Kingdom', turnsCount: 10 },
  { name: 'Austin Short', country: 'United States Of America', turnsCount: 19 },
  { name: 'Bahrain Short', country: 'Bahrain', turnsCount: 11 },
  { name: 'Suzuka Short', country: 'Japan', turnsCount: 7 },
  { name: 'Silverstone Reverse', country: 'United Kingdom', turnsCount: 18 },
  { name: 'Zandvoort Reverse', country: 'Netherlands', turnsCount: 14 },
  { name: 'Spielberg Reverse', country: 'Austria', turnsCount: 10 },
];

// Team-Block wie im RLT-Export (Farben als #AARRGGBB)
export interface TeamInfo {
  name: string;
  uniqueId: string;
  fullName: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  country: string;
}

export const KNOWN_TEAMS: TeamInfo[] = [
  {
    name: 'Alpine',
    uniqueId: 'alpine.2026',
    fullName: 'BWT Alpine F1 Team',
    abbreviation: 'ALP',
    primaryColor: '#FF0093CC',
    secondaryColor: '#FFFF87BC',
    country: 'France',
  },
  {
    name: 'Aston Martin',
    uniqueId: 'aston.martin.2026',
    fullName: 'Aston Martin Aramco F1 Team',
    abbreviation: 'AMR',
    primaryColor: '#FF229971',
    secondaryColor: '#FFCCF738',
    country: 'United Kingdom',
  },
  {
    name: 'Audi',
    uniqueId: 'audi.2026',
    fullName: 'Audi Formula One Team',
    abbreviation: 'AUD',
    primaryColor: '#FFB4B4B4',
    secondaryColor: '#FF232323',
    country: 'Germany',
  },
  {
    name: 'Cadillac',
    uniqueId: 'cadillac.2026',
    fullName: 'Cadillac Formula One Team',
    abbreviation: 'CAD',
    primaryColor: '#FF001E5F',
    secondaryColor: '#FFFFFFFF',
    country: 'United States Of America',
  },
  {
    name: 'Ferrari',
    uniqueId: 'ferrari.2026',
    fullName: 'Scuderia Ferrari',
    abbreviation: 'FER',
    primaryColor: '#FFE80020',
    secondaryColor: '#FFFFF200',
    country: 'Italy',
  },
  {
    name: 'Haas',
    uniqueId: 'haas.2026',
    fullName: 'Haas F1 Team',
    abbreviation: 'HAS',
    primaryColor: '#FFB6BABD',
    secondaryColor: '#FF333333',
    country: 'United States Of America',
  },
  {
    name: 'McLaren',
    uniqueId: 'mclaren.2026',
    fullName: 'McLaren Formula 1 Team',
    abbreviation: 'MCL',
    primaryColor: '#FFFF8000',
    secondaryColor: '#FF333333',
    country: 'United Kingdom',
  },
  {
    name: 'Mercedes',
    uniqueId: 'mercedes.2026',
    fullName: 'Mercedes-AMG Petronas F1 Team',
    abbreviation: 'MER',
    primaryColor: '#FF27F4D2',
    secondaryColor: '#FFA3A3A3',
    country: 'Germany',
  },
  {
    name: 'Racing Bulls',
    uniqueId: 'racing.bulls.2026',
    fullName: 'Visa Cash App Racing Bulls F1 Team',
    abbreviation: 'VRB',
    primaryColor: '#FF6692FF',
    secondaryColor: '#FFFFFFFF',
    country: 'Italy',
  },
  {
    name: 'Red Bull',
    uniqueId: 'red.bull.2026',
    fullName: 'Oracle Red Bull Racing',
    abbreviation: 'RB',
    primaryColor: '#FF3671C6',
    secondaryColor: '#FFE00008',
    country: 'Austria',
  },
  {
    name: 'Williams',
    uniqueId: 'williams.2026',
    fullName: 'Williams Racing',
    abbreviation: 'WIL',
    primaryColor: '#FF64C4FF',
    secondaryColor: '#FF0D66D9',
    country: 'United Kingdom',
  },
];

// Längste Namen zuerst, damit "Silverstone Short" nicht als "Silverstone" erkannt wird
function findByName<T extends { name: string }>(items: T[], text: string): T | undefined {
  const lower = text.trim().toLowerCase();
  return [...items]
    .sort((a, b) => b.name.length - a.name.length)
    .find((item) => lower.includes(item.name.toLowerCase()));
}

// "Baku City Circuit" -> Baku
export function findTrack(text: string): TrackInfo | undefined {
  return findByName(KNOWN_TRACKS, text);
}

// "Oracle Red Bull Racing" -> Red Bull
export function findTeam(text: string): TeamInfo | undefined {
  return findByName(KNOWN_TEAMS, text);
}
