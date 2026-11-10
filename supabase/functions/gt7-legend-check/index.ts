// GT7-Tracker: liest den Legend Cars Dealer von gtdb.io aus, speichert die Händlerliste in
// gt7_dealer und meldet Autos von der Merkliste (gt7_watchlist), sobald sie verfügbar sind
// (beim Händler und nicht ausverkauft), je Verfügbarkeit einmal als "Wichtig"-Mitteilung;
// die Push kommt über den Trigger auf notifications.
//
// Aufruf: pg_cron (public._gt7_trigger_check) mit Header x-push-secret = PUSH_WEBHOOK_SECRET,
// oder ein Admin aus der App mit seinem Login. Body { test: true }: statt zu prüfen eine
// Test-Mitteilung zu einem gerade verfügbaren Auto (an den Admin, per Cron an alle Admins).
// Deploy ohne JWT-Prüfung (verify_jwt = false), die Funktion prüft selbst.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { DealerCar, parseDealerPage } from './gt7-parser.ts';

const DEALER_URL = 'https://gtdb.io/gt7/legend-cars-dealer/';
const FETCH_TIMEOUT_MS = 20_000;
const SENDER = 'GT7-Tracker';

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

const credits = (price: number | null) =>
  price === null ? '' : `für Cr. ${price.toLocaleString('de-DE')} `;

const carTitle = (car: { maker: string; name: string }) =>
  // gtdb nennt manche Autos schon mit Marke ("Ford Roadster")
  car.maker && !car.name.startsWith(car.maker) ? `${car.maker} ${car.name}` : car.name;

function availableMessage(car: DealerCar): string {
  const stock = car.limitedStock ? ' Nur noch wenige auf Lager.' : '';
  return `Gerade ${credits(car.price)}im Legend Cars Dealer.${stock}`.slice(0, 500);
}

// Ohne generierte Datenbank-Typen
// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, 'public', any>;

async function notify(
  db: Admin,
  recipients: string[],
  car: DealerCar,
  title: string,
  message: string,
): Promise<void> {
  if (!recipients.length) return;
  const { error } = await db.from('notifications').insert(
    recipients.map((recipient) => ({
      recipient_id: recipient,
      sender_name: SENDER,
      type: 'system_alert',
      title: title.slice(0, 100),
      message,
      related_id: car.carId,
    })),
  );
  if (error) throw new Error(`Mitteilung nicht angelegt: ${error.message}`);
}

async function setStatus(
  db: Admin,
  ok: boolean,
  message: string,
  extra: Record<string, unknown> = {},
) {
  await db
    .from('gt7_status')
    .upsert({ id: 1, checked_at: new Date().toISOString(), ok, message, ...extra });
}

async function readDealer(): Promise<ReturnType<typeof parseDealerPage>> {
  const response = await fetch(DEALER_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GameCenterGT7Tracker/1.0)' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`gtdb antwortet mit ${response.status}`);
  return parseDealerPage(await response.text());
}

// Händlerliste speichern; gibt die Autos zurück, die jetzt verfügbar sind, mit seit wann
async function saveDealer(db: Admin, cars: DealerCar[]): Promise<Map<string, string>> {
  const now = new Date().toISOString();
  const { data: before, error } = await db
    .from('gt7_dealer')
    .select('car_id, in_dealer, first_seen_at, available_since');
  if (error) throw new Error(`Händlerliste nicht gelesen: ${error.message}`);
  const previous = new Map((before ?? []).map((row) => [row.car_id as string, row]));

  const available = new Map<string, string>();
  const rows = cars.map((car) => {
    const old = previous.get(car.carId);
    const isAvailable = !car.soldOut;
    const since = isAvailable ? (old?.in_dealer && old.available_since) || now : null;
    if (since) available.set(car.carId, since);
    return {
      car_id: car.carId,
      maker: car.maker,
      name: car.name,
      price: car.price,
      image_url: car.imageUrl,
      sold_out: car.soldOut,
      limited_stock: car.limitedStock,
      in_dealer: true,
      first_seen_at: old?.in_dealer ? old.first_seen_at : now,
      last_seen_at: now,
      available_since: since,
    };
  });
  if (rows.length) {
    const { error: upsertError } = await db.from('gt7_dealer').upsert(rows);
    if (upsertError) throw new Error(`Händlerliste nicht gespeichert: ${upsertError.message}`);
  }

  const gone = [...previous.keys()].filter((id) => !cars.some((car) => car.carId === id));
  if (gone.length) {
    await db
      .from('gt7_dealer')
      .update({ in_dealer: false, available_since: null })
      .in('car_id', gone);
  }
  return available;
}

// Merkliste: neu verfügbare Autos je Konto einmal melden
async function notifyWatchers(
  db: Admin,
  cars: DealerCar[],
  available: Map<string, string>,
): Promise<number> {
  const ids = [...available.keys()];
  if (!ids.length) return 0;
  const { data: watches, error } = await db
    .from('gt7_watchlist')
    .select('user_id, car_id, notified_at')
    .in('car_id', ids);
  if (error) throw new Error(`Merkliste nicht gelesen: ${error.message}`);

  let sent = 0;
  for (const watch of watches ?? []) {
    const since = available.get(watch.car_id)!;
    // Zeitpunkte vergleichen, nicht Text (Datenbank: +00:00, JavaScript: Z)
    if (watch.notified_at && Date.parse(watch.notified_at) >= Date.parse(since)) continue;
    const car = cars.find((c) => c.carId === watch.car_id)!;
    await notify(db, [watch.user_id], car, `${carTitle(car)} ist da`, availableMessage(car));
    await db
      .from('gt7_watchlist')
      .update({ notified_at: new Date().toISOString(), maker: car.maker, name: car.name })
      .eq('user_id', watch.user_id)
      .eq('car_id', watch.car_id);
    sent++;
  }
  return sent;
}

async function adminIds(db: Admin): Promise<string[]> {
  const { data, error } = await db.from('profiles').select('id').contains('roles', ['admin']);
  if (error) throw new Error(`Admins nicht gelesen: ${error.message}`);
  return (data ?? []).map((row) => row.id as string);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Nur POST ist erlaubt.' }, 405);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Wer ruft: pg_cron mit dem Push-Secret oder ein angemeldeter Admin
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  const fromCron = !!secret && request.headers.get('x-push-secret') === secret;
  let caller: string | null = null;
  if (!fromCron) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data } = await db.auth.getUser(token);
    if (!data.user) {
      return jsonResponse({ error: 'Bitte melde dich an.' }, 401);
    }
    const { data: profile } = await db
      .from('profiles')
      .select('roles')
      .eq('id', data.user.id)
      .maybeSingle();
    if (!(profile?.roles as string[] | undefined)?.includes('admin')) {
      return jsonResponse({ error: 'Der GT7-Tracker ist nur für Admins.' }, 403);
    }
    caller = data.user.id;
  }

  const body = (await request.json().catch(() => null)) as { test?: unknown } | null;
  const test = body?.test === true;

  let page: ReturnType<typeof parseDealerPage>;
  try {
    page = await readDealer();
  } catch (error) {
    console.error('GT7-Tracker: gtdb nicht gelesen', error);
    await setStatus(db, false, 'gtdb.io war nicht erreichbar.');
    return jsonResponse({ error: 'gtdb.io ist gerade nicht erreichbar.' }, 502);
  }
  if (!page.cars.length) {
    // Seite umgebaut: alte Liste lieber stehen lassen als alles als weg zu markieren
    console.error('GT7-Tracker: keine Autos erkannt');
    await setStatus(db, false, 'Auf der gtdb-Seite wurden keine Autos erkannt.');
    return jsonResponse({ error: 'Auf der gtdb-Seite wurden keine Autos erkannt.' }, 422);
  }

  try {
    if (test) {
      // Test: Mitteilung wie im Ernstfall, zu einem Auto, das gerade verfügbar ist
      const car = page.cars.find((c) => !c.soldOut) ?? page.cars[0];
      const recipients = caller ? [caller] : await adminIds(db);
      await notify(db, recipients, car, `Test: ${carTitle(car)} ist da`, availableMessage(car));
      return jsonResponse({ test: true, car: car.carId, recipients: recipients.length });
    }

    const available = await saveDealer(db, page.cars);
    const notified = await notifyWatchers(db, page.cars, available);
    await setStatus(
      db,
      true,
      notified ? `${notified} Auto(s) von der Merkliste gemeldet.` : 'Geprüft.',
      { page_updated_at: page.updatedAt, car_count: page.cars.length },
    );
    return jsonResponse({ cars: page.cars.length, notified });
  } catch (error) {
    console.error('GT7-Tracker:', error);
    await setStatus(db, false, 'Prüfung fehlgeschlagen.');
    return jsonResponse({ error: 'Die Prüfung ist fehlgeschlagen.' }, 500);
  }
});
