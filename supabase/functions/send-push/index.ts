// Schickt eine Mitteilung als Push-Nachricht an alle Geräte des Empfängers. Aufgerufen nur vom
// Trigger notifications_push (pg_net) mit dem gemeinsamen Geheimnis, deshalb ohne JWT-Prüfung
// deployen (verify_jwt = false). Abgelaufene Geräte (404/410 vom Push-Dienst) werden gelöscht.
//
// Secrets: PUSH_WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, optional VAPID_SUBJECT.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://jason0985.github.io/game-center/';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? APP_URL,
  Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
);

Deno.serve(async (request) => {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (!secret || request.headers.get('x-push-secret') !== secret) {
    return jsonResponse({ error: 'Nicht erlaubt.' }, 401);
  }

  const body = (await request.json().catch(() => null)) as {
    recipient_id?: string;
    title?: string;
    message?: string;
  } | null;
  if (!body?.recipient_id || !body.title) {
    return jsonResponse({ error: 'Empfänger oder Titel fehlt.' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: devices, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', body.recipient_id);
  if (error) {
    console.error('Geräte konnten nicht geladen werden:', error.message);
    return jsonResponse({ error: 'Geräte konnten nicht geladen werden.' }, 500);
  }

  // Format des Angular-Service-Workers: er zeigt die Benachrichtigung selbst an, ein Tipp
  // darauf öffnet die Mitteilungen (URLs relativ zum Scope /game-center/)
  const payload = JSON.stringify({
    notification: {
      title: body.title,
      body: body.message ?? '',
      icon: 'icons/icon-192.png',
      lang: 'de',
      data: {
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: 'notifications' },
        },
      },
    },
  });

  let sent = 0;
  await Promise.all(
    (devices ?? []).map(async (device) => {
      try {
        await webpush.sendNotification(
          { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
          payload,
          { TTL: 24 * 60 * 60 },
        );
        sent++;
      } catch (pushError) {
        const status = (pushError as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', device.endpoint);
        } else {
          console.error(
            `Push an ${new URL(device.endpoint).host} fehlgeschlagen:`,
            status,
            pushError,
          );
        }
      }
    }),
  );

  return jsonResponse({ sent });
});
