// Sucht Haltestellen/Adressen und Zugverbindungen über Transitous (MOTIS, offene Fahrplandaten
// inkl. DB Fern- und Nahverkehr). Kein API-Key nötig.
// Nutzungsbedingungen: https://transitous.org/api/ (Open Source, nicht kommerziell, Quellenangabe)
// Die bahn.de-Schnittstellen blocken Fremdzugriffe (OPS_BLOCKED), daher nicht DB direkt.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TRANSITOUS_API = 'https://api.transitous.org/api';
// Transitous verlangt App-Name, Version und Kontakt im User-Agent
const USER_AGENT = 'game-center/1.0 (+https://github.com/Jason0985/game-center)';
const MAX_SUGGESTIONS = 6;
const MAX_ITINERARIES = 6;
// Haltestellen-ID (z. B. "de-DELFI_de:05315:11201") oder Koordinate "lat,lon";
// wird per URLSearchParams kodiert, daher reicht eine Längen- und Steuerzeichenprüfung
const PLACE_PATTERN = /^[^\u0000-\u001f]{3,200}$/;
const MAX_DAYS_AHEAD = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

class UpstreamError extends Error {}

async function transitous<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${TRANSITOUS_API}${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  }).catch((error) => {
    console.error('Transitous nicht erreichbar:', error);
    throw new UpstreamError();
  });
  if (!response.ok) {
    console.error(`Transitous ${path} antwortet mit ${response.status}:`, await response.text());
    throw new UpstreamError();
  }
  return (await response.json()) as T;
}

// --- Orte suchen ----------------------------------------------------------------------------

interface GeocodeMatch {
  type: 'STOP' | 'ADDRESS' | 'PLACE';
  name: string;
  id: string;
  lat: number;
  lon: number;
  zip?: string;
  areas?: { name: string; default?: boolean; unique?: boolean }[];
}

async function searchLocations(query: string) {
  const matches = await transitous<GeocodeMatch[]>('/v1/geocode', { text: query, language: 'de' });
  return matches.slice(0, MAX_SUGGESTIONS).map((match) => {
    const area = match.areas?.find((entry) => entry.default) ?? match.areas?.find((e) => e.unique);
    const kind = match.type === 'STOP' ? 'stop' : match.type === 'ADDRESS' ? 'address' : 'place';
    return {
      place: kind === 'stop' && match.id ? match.id : `${match.lat},${match.lon}`,
      name: match.name,
      detail: [match.zip, area?.name].filter(Boolean).join(' ') || null,
      kind,
    };
  });
}

// --- Verbindungen suchen --------------------------------------------------------------------

interface MotisPlace {
  name: string;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  stopId?: string;
  track?: string;
  scheduledTrack?: string;
  description?: string;
  cancelled?: boolean;
}

interface MotisLeg {
  mode: string;
  from: MotisPlace;
  to: MotisPlace;
  duration: number;
  startTime: string;
  endTime: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  realTime: boolean;
  distance?: number;
  headsign?: string;
  displayName?: string;
  routeShortName?: string;
  agencyName?: string;
  cancelled?: boolean;
  intermediateStops?: unknown[];
}

interface MotisItinerary {
  duration: number;
  startTime: string;
  endTime: string;
  transfers: number;
  legs: MotisLeg[];
}

const WALKING_MODES = new Set(['WALK', 'BIKE', 'CAR', 'RENTAL', 'FLEX', 'ODM']);

// START/END sind Platzhalter von MOTIS, wenn mit Koordinaten gesucht wurde
function placeName(place: MotisPlace): string | null {
  return place.name === 'START' || place.name === 'END' ? null : place.name;
}

// In den deutschen DELFI-Daten ist "track" eine interne Haltepunktnummer (z. B. "78");
// das echte Gleis steht nur in der Beschreibung ("Bahnsteig Gleis 1", "Gleis 17+18").
function platform(place: MotisPlace): { track: string | null; trackChanged: boolean } {
  const fromDescription = place.description?.match(/Gleis\s+(\S+)$/i)?.[1];
  const trackChanged =
    !!place.track && !!place.scheduledTrack && place.track !== place.scheduledTrack;
  if (fromDescription && !trackChanged) {
    return { track: fromDescription, trackChanged };
  }
  const isDelfi = place.stopId?.startsWith('de-DELFI') ?? false;
  return { track: isDelfi && !trackChanged ? null : (place.track ?? null), trackChanged };
}

// Fußwege innerhalb desselben Bahnhofs zeigt die App als "Umstieg" an
function isStationTransfer(leg: MotisLeg): boolean {
  return (
    WALKING_MODES.has(leg.mode) && placeName(leg.from) !== null && leg.from.name === leg.to.name
  );
}

function mapLeg(leg: MotisLeg) {
  const walking = WALKING_MODES.has(leg.mode);
  return {
    kind: walking ? 'walk' : 'transit',
    mode: leg.mode,
    line: walking ? null : (leg.displayName ?? leg.routeShortName ?? null),
    headsign: leg.headsign ?? null,
    operator: leg.agencyName ?? null,
    durationMinutes: Math.round(leg.duration / 60),
    distanceMeters: leg.distance != null ? Math.round(leg.distance) : null,
    stopCount: leg.intermediateStops?.length ?? 0,
    realTime: leg.realTime,
    cancelled: leg.cancelled === true,
    from: {
      name: placeName(leg.from),
      time: leg.startTime,
      scheduledTime: leg.scheduledStartTime,
      ...platform(leg.from),
    },
    to: {
      name: placeName(leg.to),
      time: leg.endTime,
      scheduledTime: leg.scheduledEndTime,
      ...platform(leg.to),
    },
  };
}

async function searchJourneys(from: string, to: string, arriveBy: Date) {
  const plan = await transitous<{ itineraries?: MotisItinerary[] }>('/v5/plan', {
    fromPlace: from,
    toPlace: to,
    time: arriveBy.toISOString(),
    arriveBy: 'true',
    numItineraries: String(MAX_ITINERARIES),
    language: 'de',
  });

  return (plan.itineraries ?? [])
    .filter((itinerary) => new Date(itinerary.endTime) <= arriveBy)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((itinerary) => ({
      departure: itinerary.startTime,
      arrival: itinerary.endTime,
      durationMinutes: Math.round(itinerary.duration / 60),
      transfers: itinerary.transfers,
      legs: itinerary.legs.filter((leg) => !isStationTransfer(leg)).map(mapLeg),
    }));
}

// --- Request --------------------------------------------------------------------------------

function readArriveBy(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  const now = Date.now();
  const inRange =
    date.getTime() > now - 24 * 60 * 60 * 1000 &&
    date.getTime() < now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  return Number.isNaN(date.getTime()) || !inRange ? null : date;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Nur POST ist erlaubt.' }, 405);
  }

  // Nur angemeldete Nutzer, damit die offene Transitous-API nicht über uns zugespammt wird
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) {
    return jsonResponse({ error: 'Bitte melde dich an, um Verbindungen zu suchen.' }, 401);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  try {
    if (body?.action === 'locations') {
      const query = typeof body.query === 'string' ? body.query.trim() : '';
      if (query.length < 2 || query.length > 100) {
        return jsonResponse({ error: 'Bitte gib 2 bis 100 Zeichen ein.' }, 400);
      }
      return jsonResponse({ locations: await searchLocations(query) });
    }

    if (body?.action === 'journeys') {
      const { from, to } = body;
      const arriveBy = readArriveBy(body.arriveBy);
      const validPlaces = [from, to].every(
        (place) => typeof place === 'string' && PLACE_PATTERN.test(place),
      );
      if (!validPlaces) {
        return jsonResponse({ error: 'Bitte wähle Start und Ziel aus der Liste.' }, 400);
      }
      if (!arriveBy) {
        return jsonResponse(
          { error: `Die Ankunftszeit muss innerhalb der nächsten ${MAX_DAYS_AHEAD} Tage liegen.` },
          400,
        );
      }
      return jsonResponse({
        journeys: await searchJourneys(from as string, to as string, arriveBy),
      });
    }

    return jsonResponse({ error: 'Unbekannte Aktion.' }, 400);
  } catch (error) {
    if (error instanceof UpstreamError) {
      return jsonResponse({ error: 'Die Fahrplanauskunft ist gerade nicht erreichbar.' }, 502);
    }
    console.error(error);
    return jsonResponse({ error: 'Unerwarteter Fehler bei der Verbindungssuche.' }, 500);
  }
});
