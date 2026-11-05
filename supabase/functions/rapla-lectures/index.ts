// Holt den Stundenplan aus Rapla (DHBW) für die Woche eines Datums und gibt die Termine zurück.
// Nur für Admins: der Ankunftsplaner rechnet daraus die Weckzeit für die erste Vorlesung.
// Rapla erlaubt keinen Abruf aus dem Browser (CORS), daher läuft das hier auf dem Server.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isAllowedRaplaUrl, parseRaplaWeek, weekUrl } from './rapla-parser.ts';

const MAX_BYTES = 3_000_000;

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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Nur POST ist erlaubt.' }, 405);

  // Angemeldet und Admin? Profil mit dem Token des Nutzers lesen (RLS gilt)
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (!user) return jsonResponse({ error: 'Bitte melde dich an.' }, 401);
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .maybeSingle();
  if (!(profile?.roles as string[] | undefined)?.includes('admin')) {
    return jsonResponse({ error: 'Nur für Admins.' }, 403);
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown; date?: unknown } | null;
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const date = typeof body?.date === 'string' ? body.date : '';
  if (!isAllowedRaplaUrl(url)) {
    return jsonResponse(
      { error: 'Das ist kein Rapla-Link der DHBW (https://rapla.dhbw.de/…?key=…).' },
      400,
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonResponse({ error: 'Ungültiges Datum.' }, 400);

  let html: string;
  try {
    const response = await fetch(weekUrl(url, date), {
      headers: { 'User-Agent': 'game-center/1.0 (Stundenplan)', Accept: 'text/html' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (!response.ok) {
      console.error('Rapla antwortet mit', response.status);
      return jsonResponse({ error: `Rapla antwortet mit Fehler ${response.status}.` }, 502);
    }
    html = (await response.text()).slice(0, MAX_BYTES);
  } catch (error) {
    console.error('Rapla nicht erreichbar:', error);
    return jsonResponse({ error: 'Rapla ist gerade nicht erreichbar.' }, 502);
  }

  const [year, month] = date.split('-').map(Number);
  const lectures = parseRaplaWeek(html, year, month);
  // Hinweis für die Fehlersuche, falls Rapla sein HTML ändert
  const recognized = /week_header/i.test(html) || /week_block/i.test(html);
  return jsonResponse({ lectures, recognized });
});
