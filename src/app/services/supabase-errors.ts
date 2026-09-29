// Einheitliche, verständliche Fehlermeldungen für Supabase-Aufrufe
interface SupabaseLikeError {
  code?: string;
  message?: string;
}

export function describeSupabaseError(error: SupabaseLikeError | null | undefined): string {
  const message = error?.message ?? '';

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.';
  }

  switch (error?.code) {
    case '42501':
      return 'Dafür fehlt dir die Berechtigung.';
    case '23505':
      return 'Das existiert bereits.';
    case '23514':
    case '22023':
      return 'Die Eingabe ist ungültig.';
    case 'PGRST116':
      return 'Der Eintrag wurde nicht gefunden.';
    case 'PGRST301':
    case 'PGRST303':
      return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
    default:
      return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
  }
}

export type ActionResult = { ok: true } | { ok: false; message: string };

export function failure(context: string, error: SupabaseLikeError | null | undefined): ActionResult {
  console.error(context, error);
  return { ok: false, message: describeSupabaseError(error) };
}
