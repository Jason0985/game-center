// Löscht das Konto des angemeldeten Nutzers endgültig (Recht auf Löschung, Art. 17 DSGVO).
// Profil, Freundschaften, Mitteilungen, Lobbys und Spielstände hängen per "on delete cascade"
// an auth.users und verschwinden mit. Braucht den Service-Role-Key, den Supabase in Edge
// Functions automatisch bereitstellt.
import { createClient } from 'npm:@supabase/supabase-js@2';

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
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Nur POST ist erlaubt.' }, 405);
  }

  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (!user) {
    return jsonResponse({ error: 'Bitte melde dich an, um dein Konto zu löschen.' }, 401);
  }

  // Schutz vor versehentlichen Aufrufen: Die App schickt das erst nach der Bestätigung im Dialog
  const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
  if (body?.confirm !== true) {
    return jsonResponse({ error: 'Die Löschung wurde nicht bestätigt.' }, 400);
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY fehlt');
    return jsonResponse({ error: 'Das Löschen ist gerade nicht möglich.' }, 500);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(`Konto ${user.id} konnte nicht gelöscht werden:`, error.message);
    return jsonResponse({ error: 'Dein Konto konnte nicht gelöscht werden.' }, 500);
  }

  return jsonResponse({ deleted: true });
});
