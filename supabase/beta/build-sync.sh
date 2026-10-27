#!/usr/bin/env bash
# Baut supabase/beta/beta_full_sync.sql neu: Sicherung + Abräumen, dann alle Migrationen
# aus supabase/migrations in Reihenfolge, zuletzt das Zurückspielen. Nach neuen Migrationen
# erneut ausführen.
set -euo pipefail
cd "$(dirname "$0")"
out=beta_full_sync.sql
{
  cat <<'HEAD'
-- Game Center Beta: Datenbank auf den Stand von supabase/migrations bringen
-- (generiert von supabase/beta/build-sync.sh – nicht von Hand ändern).
--
-- Einmal komplett im SQL-Editor des Beta-Projekts ausführen. Läuft in einer Transaktion:
-- Schlägt etwas fehl, bleibt die Datenbank wie vorher.
--
-- Was passiert:
--   1. Profile (Rolle admin → roles {admin}) und Freundschaften werden gesichert.
--   2. Alles, was die App in public angelegt hat, wird gelöscht, dazu alle Cron-Jobs.
--      Spieldaten, Lobbys, Rankings, Benachrichtigungen usw. der Beta sind danach weg.
--      Konten (auth.users) bleiben.
--   3. Das aktuelle Schema wird komplett aufgebaut (alle Dateien aus supabase/migrations).
--   4. Profile und Freundschaften kommen zurück.
--
-- Für Push danach noch die zwei Vault-Secrets anlegen (siehe Abschnitt Push unten).

begin;

HEAD
  cat parts/00_backup_and_clear.sql
  for f in ../migrations/*.sql; do
    printf '\n\n-- ###########################################################################\n'
    printf -- '-- %s\n' "$(basename "$f")"
    printf -- '-- ###########################################################################\n\n'
    cat "$f"
  done
  printf '\n\n'
  cat parts/99_restore.sql
  printf '\ncommit;\n'
} > "$out"
echo "$out: $(wc -l < "$out") Zeilen"
