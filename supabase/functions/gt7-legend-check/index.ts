// GT7-Tracker: liest den Legend Cars Dealer aus den Daten von GT7 Info (ddm999.github.io/gt7info,
// täglich kurz nach dem Händlerwechsel um 00:00 UTC aktuell), speichert die Händlerliste in
// gt7_dealer und meldet
//   - Autos von der Merkliste (gt7_watchlist), sobald sie verfügbar sind (beim Händler und
//     nicht ausverkauft), je Verfügbarkeit einmal als "Wichtig"-Mitteilung,
//   - neue Autos beim Händler an alle Admins als "Info"-Mitteilung (je Wechsel einmal).
// Die Push kommt über den Trigger auf notifications.
//
// Aufruf: pg_cron (public._gt7_trigger_check) mit Header x-push-secret = PUSH_WEBHOOK_SECRET,
// oder ein Admin aus der App mit seinem Login. Body { test: true }: statt zu prüfen eine
// Test-Mitteilung zu einem gerade verfügbaren Auto (an den Admin, per Cron an alle Admins).
// Deploy ohne JWT-Prüfung (verify_jwt = false), die Funktion prüft selbst.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { carTitle, DealerCar, dealerUpdateMessage, parseGt7Info } from './gt7-parser.ts';

const DEALER_URL = 'https://ddm999.github.io/gt7info/data.json';
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

function availableMessage(car: DealerCar): string {
  const stock = car.limitedStock ? ' Nur noch wenige auf Lager.' : '';
  const days =
    car.daysLeft === null
      ? ''
      : car.daysLeft === 0
        ? ' Heute ist der letzte Tag.'
        : ` Noch ca. ${car.daysLeft} ${car.daysLeft === 1 ? 'Tag' : 'Tage'}.`;
  return `Gerade ${credits(car.price)}im Legend Cars Dealer.${stock}${days}`.slice(0, 500);
}

// Ohne generierte Datenbank-Typen
// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, 'public', any>;

async function notify(
  db: Admin,
  recipients: string[],
  relatedId: string,
  title: string,
  message: string,
  type: 'system_alert' | 'system_info' = 'system_alert',
): Promise<void> {
  if (!recipients.length) return;
  const { error } = await db.from('notifications').insert(
    recipients.map((recipient) => ({
      recipient_id: recipient,
      sender_name: SENDER,
      type,
      title: title.slice(0, 100),
      message,
      related_id: relatedId.slice(0, 64),
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

async function readDealer(): Promise<ReturnType<typeof parseGt7Info>> {
  const response = await fetch(`${DEALER_URL}?t=${Date.now()}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'GameCenterGT7Tracker/1.1' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GT7 Info antwortet mit ${response.status}`);
  return parseGt7Info(await response.json());
}

// Händlerliste speichern; gibt die Autos zurück, die jetzt verfügbar sind (mit seit wann),
// und die neu beim Händler sind (leer beim allerersten Einlesen)
async function saveDealer(
  db: Admin,
  cars: DealerCar[],
): Promise<{ available: Map<string, string>; arrived: DealerCar[] }> {
  const now = new Date().toISOString();
  const { data: before, error } = await db
    .from('gt7_dealer')
    .select('car_id, in_dealer, first_seen_at, available_since, image_url');
  if (error) throw new Error(`Händlerliste nicht gelesen: ${error.message}`);
  const previous = new Map((before ?? []).map((row) => [row.car_id as string, row]));
  const hadList = (before ?? []).some((row) => row.in_dealer);
  const arrived = hadList ? cars.filter((car) => !previous.get(car.carId)?.in_dealer) : [];

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
      // GT7 Info hat keine Bilder: das von früher behalten
      image_url: car.imageUrl ?? old?.image_url ?? null,
      sold_out: car.soldOut,
      limited_stock: car.limitedStock,
      is_new: car.isNew,
      days_left: car.daysLeft,
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
  return { available, arrived };
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
    await notify(db, [watch.user_id], car.carId, `${carTitle(car)} ist da`, availableMessage(car));
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

  let page: ReturnType<typeof parseGt7Info>;
  try {
    page = await readDealer();
  } catch (error) {
    console.error('GT7-Tracker: GT7 Info nicht gelesen', error);
    await setStatus(db, false, 'GT7 Info war nicht erreichbar.');
    return jsonResponse({ error: 'GT7 Info ist gerade nicht erreichbar.' }, 502);
  }
  if (!page.cars.length) {
    // Daten umgebaut: alte Liste lieber stehen lassen als alles als weg zu markieren
    console.error('GT7-Tracker: keine Autos erkannt');
    await setStatus(db, false, 'In den Daten von GT7 Info wurden keine Autos erkannt.');
    return jsonResponse({ error: 'In den Daten von GT7 Info wurden keine Autos erkannt.' }, 422);
  }

  try {
    if (test) {
      // Test: Mitteilung wie im Ernstfall, zu einem Auto, das gerade verfügbar ist
      const car = page.cars.find((c) => !c.soldOut) ?? page.cars[0];
      const recipients = caller ? [caller] : await adminIds(db);
      await notify(
        db,
        recipients,
        car.carId,
        `Test: ${carTitle(car)} ist da`,
        availableMessage(car),
      );
      return jsonResponse({ test: true, car: car.carId, recipients: recipients.length });
    }

    const { available, arrived } = await saveDealer(db, page.cars);
    const notified = await notifyWatchers(db, page.cars, available);
    // Händler hat gewechselt: neue Autos allen Admins melden (Info, eigene Push-Art)
    const update = dealerUpdateMessage(arrived);
    if (update) {
      await notify(
        db,
        await adminIds(db),
        `gt7-dealer-${page.updatedAt?.slice(0, 10) ?? 'neu'}`,
        update.title,
        update.message,
        'system_info',
      );
    }
    const parts = [
      arrived.length ? `${arrived.length} neu beim Händler` : '',
      notified ? `${notified} von der Merkliste gemeldet` : '',
    ].filter(Boolean);
    await setStatus(db, true, parts.length ? `${parts.join(', ')}.` : 'Geprüft.', {
      page_updated_at: page.updatedAt,
      car_count: page.cars.length,
    });
    return jsonResponse({ cars: page.cars.length, notified, arrived: arrived.length });
  } catch (error) {
    console.error('GT7-Tracker:', error);
    await setStatus(db, false, 'Prüfung fehlgeschlagen.');
    return jsonResponse({ error: 'Die Prüfung ist fehlgeschlagen.' }, 500);
  }
});
