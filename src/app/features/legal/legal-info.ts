// Angaben für Impressum und Datenschutzerklärung. Vor dem Veröffentlichen die Platzhalter in
// eckigen Klammern durch echte Angaben ersetzen (Impressumspflicht nach § 5 DDG).
export const LEGAL_INFO = {
  name: '[Vor- und Nachname]',
  street: '[Straße und Hausnummer]',
  city: '[PLZ und Ort]',
  email: '[E-Mail-Adresse]',
  // Supabase-Dashboard → Project Settings → General → Region
  supabaseRegion: '[Region, z. B. Frankfurt (eu-central-1)]',
  // Wer die Bestätigungs- und Passwort-Mails verschickt (eigener SMTP-Anbieter oder Supabase)
  mailProvider: 'Supabase (integrierter E-Mail-Versand)',
  updated: 'Oktober 2026',
  repositoryUrl: 'https://github.com/Jason0985/game-center',
} as const;
