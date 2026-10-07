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

interface AuthLikeError extends SupabaseLikeError {
  name?: string;
  details?: { code?: string } | null;
}

// Fehler aus supabase.auth (Codes von GoTrue) auf Deutsch
export function describeAuthError(error: AuthLikeError | null | undefined): string {
  if (error?.name === 'AuthSessionMissingError') {
    return 'Deine Sitzung ist abgelaufen. Fordere bitte einen neuen Link an.';
  }

  // Fehler aus dem Link der Mail (AuthImplicitGrantRedirectError) tragen den Code in details
  switch (error?.code ?? error?.details?.code) {
    case 'invalid_credentials':
      return 'E-Mail oder Passwort ist falsch.';
    case 'email_not_confirmed':
      return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
    case 'user_already_exists':
      return 'Für diese E-Mail-Adresse gibt es schon ein Konto.';
    case 'weak_password':
      return 'Das Passwort ist zu schwach. Nimm mindestens 8 Zeichen.';
    case 'same_password':
      return 'Das neue Passwort muss sich vom alten unterscheiden.';
    case 'otp_expired':
      return 'Der Link ist abgelaufen oder wurde schon benutzt.';
    case 'session_not_found':
      return 'Deine Sitzung ist abgelaufen. Fordere bitte einen neuen Link an.';
    case 'reauthentication_needed':
      return 'Bitte melde dich neu an und ändere dann dein Passwort.';
    case 'over_email_send_rate_limit':
      return 'Bitte warte kurz, bevor du eine weitere E-Mail anforderst.';
    case 'over_request_rate_limit':
      return 'Zu viele Versuche. Bitte warte einen Moment.';
    case 'anonymous_provider_disabled':
      return 'Der Gastzugang ist gerade nicht verfügbar.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Bitte gib eine gültige E-Mail-Adresse ein.';
    default:
      return describeSupabaseError(error);
  }
}

export type ActionResult = { ok: true } | { ok: false; message: string };

export function failure(
  context: string,
  error: SupabaseLikeError | null | undefined,
): ActionResult {
  console.error(context, error);
  return { ok: false, message: describeSupabaseError(error) };
}
