// Routen-Check: Autostrecken auf Stau, Baustellen und Sperrungen beobachten.
//
// Quellen: TomTom (Route mit Live-Verkehr auf allen Straßen, Ortssuche; Secret
// TOMTOM_API_KEY) und die Autobahn GmbH (verkehr.autobahn.de, offen, ohne Schlüssel).
//
// Aufrufe (POST, Body { action, … }):
//   search { query }                    Orte/Adressen suchen (angemeldet)
//   save   { id?, name, origin, dest, schedules, live_alerts, notify_clear }
//                                       Route planen und speichern (angemeldet, max. 5)
//   check  { id, reverse }              Jetzt prüfen, Ergebnis zurück (angemeldet)
//   plan   { origin, dest, vias }       Strecken zum Vergleichen (schnellste + Alternativen)
//   reroute { id, vias, path? }         Strecke der Route ändern: über Zwischenziele, mit
//                                       path genau diese Strecke (TomTom folgt ihr)
//   cron                                pg_cron alle 5 Min. mit x-push-secret: fällige
//                                       Check-Zeiten melden, neue Staus/Sperrungen sofort
// Deploy ohne JWT-Prüfung (verify_jwt = false), die Funktion prüft selbst.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  type AutobahnItem,
  type AutobahnService,
  autobahnIncident,
  autobahnRoads,
  berlinNow,
  type CheckResult,
  delayMessage,
  departureMessage,
  dueSchedules,
  type Incident,
  type LatLon,
  liveMessage,
  MAX_VIAS,
  mergeIncidents,
  nearPath,
  orderVias,
  parsePath,
  parseSchedules,
  parseVias,
  pathLengthM,
  type RouteStep,
  routeSteps,
  simplifyPath,
  supportingPoints,
  type TomTomRoute,
  tomtomIncidents,
  tomtomPoints,
  tomtomRoadNumbers,
  type Via,
} from './route-logic.ts';

const TOMTOM = 'https://api.tomtom.com';
const AUTOBAHN = 'https://verkehr.autobahn.de/o/autobahn';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ROUTES = 5;
const SENDER = 'Routen-Check';
// Live-Verkehr per TomTom: tagsüber alle 30 Min., nachts alle 2 Std. (Richtungen abwechselnd);
// Push ab 10 Min. Verzögerung, danach erst wieder, wenn sie um weitere 10 Min. wächst
const TOMTOM_DAY_MIN = 30;
const TOMTOM_NIGHT_MIN = 120;
const LIVE_DELAY_MIN = 10;

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

class UserError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, 'public', any>;

interface Place {
  label: string;
  lat: number;
  lon: number;
}

interface RouteRow {
  id: string;
  user_id: string;
  name: string;
  origin_label: string;
  origin_lat: number;
  origin_lon: number;
  dest_label: string;
  dest_lat: number;
  dest_lon: number;
  schedules: unknown;
  live_alerts: boolean;
  notify_clear: boolean;
  path: LatLon[];
  roads: string[];
  vias: Via[];
  follow_path: boolean;
  steps: RouteStep[];
  length_m: number | null;
  base_seconds: number | null;
  last_tomtom_at: string | null;
  last_slot: string | null;
  live_delay_notified: number;
  last_check: { reverse?: boolean } | null;
}

const tomtomKey = () => Deno.env.get('TOMTOM_API_KEY')?.trim() || null;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${new URL(url).host} antwortet mit ${response.status}`);
  return (await response.json()) as T;
}

// ---------------------------------------------------------------- TomTom

async function searchPlaces(query: string): Promise<Place[]> {
  const key = tomtomKey();
  if (!key)
    throw new UserError('Die Ortssuche ist noch nicht eingerichtet (TomTom-Schlüssel fehlt).', 503);
  const url =
    `${TOMTOM}/search/2/search/${encodeURIComponent(query)}.json?` +
    new URLSearchParams({
      key,
      limit: '6',
      language: 'de-DE',
      countrySet: 'DE,AT,CH,FR,NL,BE,LU,DK,PL,CZ',
      typeahead: 'true',
    });
  const data = await getJson<{
    results?: {
      poi?: { name?: string };
      address?: { freeformAddress?: string; municipality?: string };
      position?: { lat: number; lon: number };
    }[];
  }>(url);
  return (data.results ?? [])
    .filter((r) => r.position)
    .map((r) => ({
      label: (r.poi?.name
        ? `${r.poi.name}, ${r.address?.municipality ?? r.address?.freeformAddress ?? ''}`
        : (r.address?.freeformAddress ?? query)
      )
        .replace(/,\s*$/, '')
        .slice(0, 160),
      lat: r.position!.lat,
      lon: r.position!.lon,
    }));
}

interface RouteOptions {
  // Zwischenziele in Fahrtrichtung
  vias?: Via[];
  // Strecke nachbauen statt die schnellste suchen
  supporting?: { latitude: number; longitude: number }[];
  // Zusätzliche Alternativen (nur ohne Zwischenziele und Stützpunkte)
  alternatives?: number;
}

async function tomtomRoutes(
  from: Place,
  to: Place,
  options: RouteOptions = {},
): Promise<TomTomRoute[]> {
  const key = tomtomKey();
  if (!key) return [];
  const stops = [from, ...(options.vias ?? []), to].map((p) => `${p.lat},${p.lon}`).join(':');
  const alternatives =
    !options.vias?.length && !options.supporting?.length ? (options.alternatives ?? 0) : 0;
  const url =
    `${TOMTOM}/routing/1/calculateRoute/${stops}/json?` +
    new URLSearchParams({
      key,
      traffic: 'true',
      travelMode: 'car',
      routeType: 'fastest',
      instructionsType: 'text',
      language: 'de-DE',
      sectionType: 'traffic',
      computeTravelTimeFor: 'all',
      departAt: 'now',
      ...(alternatives ? { maxAlternatives: String(alternatives) } : {}),
    });
  const data = options.supporting?.length
    ? await postJson<{ routes?: TomTomRoute[] }>(url, { supportingPoints: options.supporting })
    : await getJson<{ routes?: TomTomRoute[] }>(url);
  return data.routes ?? [];
}

async function tomtomRoute(from: Place, to: Place, options: RouteOptions = {}) {
  return (await tomtomRoutes(from, to, options))[0] ?? null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${new URL(url).host} antwortet mit ${response.status}`);
  return (await response.json()) as T;
}

// Wie die gespeicherte Route geplant wird: Zwischenziele, auf Wunsch genau ihre Strecke
function optionsFor(route: RouteRow, reverse: boolean): RouteOptions {
  // Genau die gespeicherte Strecke: sie führt schon über die Zwischenziele
  if (route.follow_path && route.path.length > 1) {
    return { supporting: supportingPoints(route.path, reverse) };
  }
  const vias = parseVias(route.vias) ?? [];
  return { vias: reverse ? [...vias].reverse() : vias };
}

// Was von einer geplanten Strecke gespeichert wird
function plannedColumns(route: TomTomRoute) {
  return {
    path: simplifyPath(tomtomPoints(route)),
    roads: autobahnRoads(tomtomRoadNumbers(route)),
    steps: routeSteps(route),
    length_m: route.summary?.lengthInMeters ?? null,
    base_seconds: route.summary?.noTrafficTravelTimeInSeconds ?? null,
  };
}

// ---------------------------------------------------------------- Autobahn GmbH

// Je Aufruf nur einmal je Autobahn und Dienst laden (mehrere Routen teilen sich Autobahnen)
const autobahnCache = new Map<string, Promise<AutobahnItem[]>>();

function autobahnItems(road: string, service: AutobahnService): Promise<AutobahnItem[]> {
  const key = `${road}/${service}`;
  let pending = autobahnCache.get(key);
  if (!pending) {
    pending = getJson<Record<string, AutobahnItem[]>>(
      `${AUTOBAHN}/${encodeURIComponent(road)}/services/${service}`,
    ).then((data) => data[service] ?? []);
    autobahnCache.set(key, pending);
  }
  return pending;
}

async function autobahnIncidents(
  route: Pick<RouteRow, 'roads' | 'path'>,
  services: AutobahnService[],
): Promise<{ incidents: Incident[]; ok: boolean }> {
  let ok = route.roads.length > 0;
  const lists = await Promise.all(
    route.roads.flatMap((road) =>
      services.map(async (service) => {
        try {
          const items = await autobahnItems(road, service);
          return items
            .map((item) => autobahnIncident(item, service, road, route.path))
            .filter((i): i is Incident => i !== null);
        } catch (error) {
          console.error(`Routen-Check: ${road}/${service} nicht geladen`, error);
          ok = false;
          return [];
        }
      }),
    ),
  );
  // Eine Meldung kann in mehreren Diensten stehen (Sperrung in einer Baustelle)
  const byId = new Map<string, Incident>();
  for (const incident of lists.flat()) {
    if (!byId.has(incident.id)) byId.set(incident.id, incident);
  }
  return { incidents: [...byId.values()], ok };
}

// ---------------------------------------------------------------- Prüfen

const placesOf = (route: RouteRow, reverse: boolean): [Place, Place] => {
  const origin = { label: route.origin_label, lat: route.origin_lat, lon: route.origin_lon };
  const dest = { label: route.dest_label, lat: route.dest_lat, lon: route.dest_lon };
  return reverse ? [dest, origin] : [origin, dest];
};

async function checkRoute(
  route: RouteRow,
  reverse: boolean,
  options: { tomtom: boolean; roadworks: boolean },
): Promise<CheckResult> {
  const [from, to] = placesOf(route, reverse);
  const services: AutobahnService[] = options.roadworks
    ? ['warning', 'closure', 'roadworks']
    : ['warning', 'closure'];

  const [tt, ab] = await Promise.all([
    options.tomtom
      ? tomtomRoute(from, to, optionsFor(route, reverse)).catch((error) => {
          console.error('Routen-Check: TomTom nicht erreichbar', error);
          return null;
        })
      : Promise.resolve(null),
    autobahnIncidents(route, services),
  ]);

  const lengthM = route.length_m ?? pathLengthM(route.path);
  const incidents = mergeIncidents(tt ? tomtomIncidents(tt, reverse) : [], ab.incidents, lengthM);
  const sources: CheckResult['sources'] = [];
  if (tt) sources.push('tomtom');
  if (ab.ok) sources.push('autobahn');
  const summary = tt?.summary;
  return {
    checkedAt: new Date().toISOString(),
    reverse,
    travelMinutes: summary?.travelTimeInSeconds
      ? Math.round(summary.travelTimeInSeconds / 60)
      : null,
    delayMinutes: summary ? Math.round((summary.trafficDelayInSeconds ?? 0) / 60) : null,
    baseMinutes: summary?.noTrafficTravelTimeInSeconds
      ? Math.round(summary.noTrafficTravelTimeInSeconds / 60)
      : route.base_seconds
        ? Math.round(route.base_seconds / 60)
        : null,
    lengthKm: Math.round(lengthM / 100) / 10,
    incidents,
    sources,
  };
}

async function storeCheck(
  db: Admin,
  route: RouteRow,
  result: CheckResult,
  extra: Record<string, unknown> = {},
) {
  await db
    .from('route_watches')
    .update({ last_check: result, last_checked_at: result.checkedAt, ...extra })
    .eq('id', route.id);
}

// Schon gemeldete Ereignisse; neue eintragen
async function unseen(db: Admin, routeId: string, incidents: Incident[]): Promise<Incident[]> {
  if (!incidents.length) return [];
  const { data } = await db
    .from('route_alerts_seen')
    .select('alert_id')
    .eq('route_id', routeId)
    .in(
      'alert_id',
      incidents.map((i) => i.id),
    );
  const seen = new Set((data ?? []).map((row) => row.alert_id as string));
  return incidents.filter((i) => !seen.has(i.id));
}

// Auch schon bekannte neu stempeln: was noch läuft, bleibt so gemerkt (siehe forgetOld)
async function markSeen(db: Admin, routeId: string, incidents: Incident[]) {
  if (!incidents.length) return;
  const seenAt = new Date().toISOString();
  await db
    .from('route_alerts_seen')
    .upsert(incidents.map((i) => ({ route_id: routeId, alert_id: i.id, seen_at: seenAt })));
}

// Seit Tagen nicht mehr gemeldet: vorbei. Taucht es wieder auf, ist es eine neue Lage.
const FORGET_AFTER_MS = 2 * 24 * 60 * 60_000;

async function forgetOld(db: Admin) {
  await db
    .from('route_alerts_seen')
    .delete()
    .lt('seen_at', new Date(Date.now() - FORGET_AFTER_MS).toISOString());
}

async function notify(db: Admin, route: RouteRow, title: string, message: string) {
  const { error } = await db.from('notifications').insert({
    recipient_id: route.user_id,
    sender_name: SENDER,
    type: 'route_alert',
    title: title.slice(0, 100),
    message: message.slice(0, 500),
    related_id: route.id,
  });
  if (error) throw new Error(`Mitteilung nicht angelegt: ${error.message}`);
}

// Nur Staus und Sperrungen, die gerade gelten, melden sich sofort
const isLive = (i: Incident) => !i.future && (i.kind === 'jam' || i.kind === 'closure');

// ---------------------------------------------------------------- Aktionen

async function save(db: Admin, userId: string, body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const origin = parsePlace(body.origin);
  const dest = parsePlace(body.dest);
  const schedules = parseSchedules(body.schedules ?? []);
  if (!name || name.length > 60) throw new UserError('Gib der Route einen Namen (bis 60 Zeichen).');
  if (!origin || !dest) throw new UserError('Wähle Start und Ziel aus der Suche aus.');
  if (!schedules) throw new UserError('Eine Check-Zeit ist ungültig.');

  const id = typeof body.id === 'string' ? body.id : null;
  let existing: RouteRow | null = null;
  if (id) {
    const { data } = await db
      .from('route_watches')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) throw new UserError('Diese Route gibt es nicht mehr.', 404);
    existing = data as RouteRow;
  } else {
    const { count } = await db
      .from('route_watches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if ((count ?? 0) >= MAX_ROUTES) throw new UserError(`Höchstens ${MAX_ROUTES} Routen.`);
  }

  // Strecke nur neu planen, wenn Start oder Ziel neu sind
  const samePlaces =
    existing &&
    existing.origin_lat === origin.lat &&
    existing.origin_lon === origin.lon &&
    existing.dest_lat === dest.lat &&
    existing.dest_lon === dest.lon &&
    existing.path.length > 1;

  let planned: Partial<RouteRow> = {};
  if (!samePlaces) {
    if (!tomtomKey())
      throw new UserError(
        'Die Routenplanung ist noch nicht eingerichtet (TomTom-Schlüssel fehlt).',
        503,
      );
    const route = await tomtomRoute(origin, dest);
    if (!route) throw new UserError('Zwischen Start und Ziel wurde keine Autoroute gefunden.', 422);
    // Neue Orte: eigene Zwischenziele und Strecke gelten nicht mehr
    planned = { ...plannedColumns(route), vias: [], follow_path: false };
  }

  const row = {
    user_id: userId,
    name,
    origin_label: origin.label,
    origin_lat: origin.lat,
    origin_lon: origin.lon,
    dest_label: dest.label,
    dest_lat: dest.lat,
    dest_lon: dest.lon,
    schedules,
    live_alerts: body.live_alerts !== false,
    notify_clear: body.notify_clear !== false,
    ...planned,
  };
  const query = existing
    ? db.from('route_watches').update(row).eq('id', existing.id)
    : db.from('route_watches').insert(row);
  const { data, error } = await query.select('*').single();
  if (error || !data) throw new Error(`Route nicht gespeichert: ${error?.message}`);
  const saved = data as RouteRow;

  // Erster Blick auf die Strecke; was jetzt schon los ist, gilt als bekannt (keine Push-Flut)
  const result = await checkRoute(saved, false, { tomtom: !samePlaces, roadworks: true });
  if (!result.sources.length) return { route: saved };
  await storeCheck(
    db,
    saved,
    result,
    result.sources.includes('tomtom') ? { last_tomtom_at: result.checkedAt } : {},
  );
  if (!samePlaces) await markSeen(db, saved.id, result.incidents.filter(isLive));
  return { route: { ...saved, last_check: result, last_checked_at: result.checkedAt } };
}

function parsePlace(value: unknown): Place | null {
  const place = value as Partial<Place> | null;
  const label = typeof place?.label === 'string' ? place.label.trim().slice(0, 160) : '';
  const lat = Number(place?.lat);
  const lon = Number(place?.lon);
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { label, lat, lon };
}

async function loadOwn(db: Admin, userId: string, id: unknown): Promise<RouteRow> {
  if (typeof id !== 'string') throw new UserError('Route fehlt.');
  const { data } = await db
    .from('route_watches')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) throw new UserError('Diese Route gibt es nicht mehr.', 404);
  return data as RouteRow;
}

async function check(db: Admin, userId: string, body: Record<string, unknown>) {
  const route = await loadOwn(db, userId, body.id);
  const reverse = body.reverse === true;
  const result = await checkRoute(route, reverse, { tomtom: true, roadworks: true });
  if (!result.sources.length)
    throw new UserError('Die Verkehrsdaten sind gerade nicht erreichbar.', 502);
  await storeCheck(
    db,
    route,
    result,
    result.sources.includes('tomtom') ? { last_tomtom_at: result.checkedAt } : {},
  );
  // Was du gerade gesehen hast, kommt nicht noch einmal als Push
  await markSeen(db, route.id, result.incidents.filter(isLive));
  return { result };
}

// Strecken zum Vergleichen: die schnellste (über die Zwischenziele) und ohne Zwischenziele
// bis zu zwei Alternativen; je Strecke Verlauf, Straßen und Fahrzeit jetzt
async function plan(body: Record<string, unknown>) {
  const origin = parsePlace(body.origin);
  const dest = parsePlace(body.dest);
  const vias = parseVias(body.vias);
  if (!origin || !dest) throw new UserError('Start oder Ziel fehlt.');
  if (!vias) throw new UserError(`Höchstens ${MAX_VIAS} Zwischenziele.`);
  if (!tomtomKey())
    throw new UserError(
      'Die Routenplanung ist noch nicht eingerichtet (TomTom-Schlüssel fehlt).',
      503,
    );
  const routes = await tomtomRoutes(origin, dest, { vias, alternatives: 2 });
  if (!routes.length) throw new UserError('Über diese Punkte wurde keine Autoroute gefunden.', 422);
  return {
    options: routes.map((route) => ({
      path: simplifyPath(tomtomPoints(route), 80),
      roads: autobahnRoads(tomtomRoadNumbers(route)),
      steps: routeSteps(route),
      lengthM: route.summary?.lengthInMeters ?? null,
      travelSeconds: route.summary?.travelTimeInSeconds ?? null,
      delaySeconds: route.summary?.trafficDelayInSeconds ?? null,
      baseSeconds: route.summary?.noTrafficTravelTimeInSeconds ?? null,
    })),
  };
}

// Höchstens so weit dürfen Anfang und Ende einer geschickten Strecke von Start und Ziel weg sein
const PATH_END_M = 3000;

async function reroute(db: Admin, userId: string, body: Record<string, unknown>) {
  const route = await loadOwn(db, userId, body.id);
  const vias = parseVias(body.vias);
  if (!vias) throw new UserError(`Höchstens ${MAX_VIAS} Zwischenziele.`);
  if (!tomtomKey())
    throw new UserError(
      'Die Routenplanung ist noch nicht eingerichtet (TomTom-Schlüssel fehlt).',
      503,
    );
  const [origin, dest] = placesOf(route, false);

  // Mit path: genau diese Strecke (eine Alternative); TomTom baut sie aus Stützpunkten nach
  let follow = false;
  let supporting: RouteOptions['supporting'];
  if (body.path !== undefined && body.path !== null) {
    const path = parsePath(body.path);
    if (
      !path ||
      !nearPath([origin.lat, origin.lon], [path[0], path[1]], PATH_END_M) ||
      !nearPath([dest.lat, dest.lon], path.slice(-2), PATH_END_M)
    ) {
      throw new UserError('Diese Strecke passt nicht zu Start und Ziel.');
    }
    follow = true;
    supporting = supportingPoints(path, false);
  }

  const ordered = orderVias(vias, route.path);
  const planned = await tomtomRoute(origin, dest, supporting ? { supporting } : { vias: ordered });
  if (!planned) throw new UserError('Über diese Punkte wurde keine Autoroute gefunden.', 422);

  const { data, error } = await db
    .from('route_watches')
    .update({
      ...plannedColumns(planned),
      vias: ordered,
      follow_path: follow,
      live_delay_notified: 0,
    })
    .eq('id', route.id)
    .select('*')
    .single();
  if (error || !data) throw new Error(`Strecke nicht gespeichert: ${error?.message}`);
  const saved = data as RouteRow;

  // Gleich die neue Strecke prüfen; was dort jetzt los ist, gilt als bekannt
  const result = await checkRoute(saved, false, { tomtom: true, roadworks: true });
  if (!result.sources.length) return { route: saved };
  await storeCheck(
    db,
    saved,
    result,
    result.sources.includes('tomtom') ? { last_tomtom_at: result.checkedAt } : {},
  );
  await markSeen(db, saved.id, result.incidents.filter(isLive));
  return { route: { ...saved, last_check: result, last_checked_at: result.checkedAt } };
}

// ---------------------------------------------------------------- Cron

async function cron(db: Admin) {
  const { data, error } = await db.from('route_watches').select('*');
  if (error) throw new Error(`Routen nicht gelesen: ${error.message}`);
  const now = new Date();
  const local = berlinNow(now);
  const night = local.minutes < 5 * 60 || local.minutes >= 22 * 60;
  let sent = 0;
  let failed = 0;
  await forgetOld(db);

  for (const route of (data ?? []) as RouteRow[]) {
    try {
      sent += await cronRoute(db, route, now, local, night);
    } catch (err) {
      failed++;
      console.error(`Routen-Check: Route ${route.id} fehlgeschlagen`, err);
    }
  }
  return { routes: data?.length ?? 0, sent, failed };
}

async function cronRoute(
  db: Admin,
  route: RouteRow,
  now: Date,
  local: ReturnType<typeof berlinNow>,
  night: boolean,
): Promise<number> {
  let sent = 0;
  const schedules = parseSchedules(route.schedules) ?? [];

  // 1. Check-Zeiten: Fahrzeit und Lage melden (auch "frei", wenn gewünscht)
  const due = dueSchedules(schedules, local).filter((d) => d.slot !== route.last_slot);
  for (const { schedule, slot } of due) {
    const result = await checkRoute(route, schedule.reverse, { tomtom: true, roadworks: true });
    if (!result.sources.length) continue;
    const { title, message, clear } = departureMessage(route.name, result);
    if (!clear || route.notify_clear) {
      await notify(db, route, title, message);
      sent++;
    }
    await markSeen(db, route.id, result.incidents.filter(isLive));
    await storeCheck(db, route, result, {
      last_slot: slot,
      ...(result.sources.includes('tomtom')
        ? { last_tomtom_at: result.checkedAt, live_delay_notified: result.delayMinutes ?? 0 }
        : {}),
    });
    route.last_slot = slot;
    route.last_tomtom_at = result.checkedAt;
  }
  if (due.length || !route.live_alerts) return sent;

  // 2. Rund um die Uhr: neue Staus und Sperrungen der Autobahn GmbH (beide Richtungen)
  const live = (await autobahnIncidents(route, ['warning', 'closure'])).incidents.filter(isLive);
  const fresh = await unseen(db, route.id, live);
  for (const incident of fresh.slice(0, 3)) {
    const { title, message } = liveMessage(route.name, incident);
    await notify(db, route, title, message);
    sent++;
  }
  await markSeen(db, route.id, live);

  // 3. Live-Verkehr per TomTom (auch Landstraßen): deutlich längere Fahrzeit melden
  const interval = (night ? TOMTOM_NIGHT_MIN : TOMTOM_DAY_MIN) * 60_000;
  const last = route.last_tomtom_at ? Date.parse(route.last_tomtom_at) : 0;
  if (!tomtomKey() || now.getTime() - last < interval - 60_000) return sent;

  const reverse = !(route.last_check?.reverse ?? true);
  const result = await checkRoute(route, reverse, { tomtom: true, roadworks: false });
  if (!result.sources.includes('tomtom')) return sent;
  const delay = result.delayMinutes ?? 0;
  let notified = route.live_delay_notified;
  if (delay >= LIVE_DELAY_MIN && delay >= notified + LIVE_DELAY_MIN) {
    const { title, message } = delayMessage(route.name, result);
    await notify(db, route, title, message);
    sent++;
    notified = delay;
  } else if (delay < LIVE_DELAY_MIN / 2) {
    notified = 0;
  }
  await markSeen(db, route.id, result.incidents.filter(isLive));
  await storeCheck(db, route, result, {
    last_tomtom_at: result.checkedAt,
    live_delay_notified: notified,
  });
  return sent;
}

// ---------------------------------------------------------------- Einstieg

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Nur POST ist erlaubt.' }, 405);

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  autobahnCache.clear();

  try {
    if (body.action === 'cron') {
      const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
      if (!secret || request.headers.get('x-push-secret') !== secret) {
        return jsonResponse({ error: 'Nicht erlaubt.' }, 403);
      }
      return jsonResponse(await cron(db));
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data } = await db.auth.getUser(token);
    if (!data.user) return jsonResponse({ error: 'Bitte melde dich an.' }, 401);
    const userId = data.user.id;

    switch (body.action) {
      case 'search': {
        const query = typeof body.query === 'string' ? body.query.trim() : '';
        if (query.length < 3 || query.length > 120) return jsonResponse({ places: [] });
        return jsonResponse({ places: await searchPlaces(query) });
      }
      case 'save':
        return jsonResponse(await save(db, userId, body));
      case 'check':
        return jsonResponse(await check(db, userId, body));
      case 'plan':
        return jsonResponse(await plan(body));
      case 'reroute':
        return jsonResponse(await reroute(db, userId, body));
      default:
        return jsonResponse({ error: 'Unbekannte Aktion.' }, 400);
    }
  } catch (error) {
    if (error instanceof UserError) return jsonResponse({ error: error.message }, error.status);
    console.error('Routen-Check:', error);
    return jsonResponse({ error: 'Der Routen-Check ist gerade fehlgeschlagen.' }, 500);
  }
});
