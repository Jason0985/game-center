# Beta-Datenbank synchronisieren

Die Beta läuft gegen ein eigenes Supabase-Projekt. Ihr Stand war Ende September
(`history/`), die App braucht aber das Schema aus `supabase/migrations`.

## Einmalig auf den aktuellen Stand bringen

1. Supabase-Dashboard des **Beta**-Projekts öffnen → SQL Editor.
2. Den kompletten Inhalt von `beta_full_sync.sql` einfügen und ausführen.
3. Für Push-Nachrichten die zwei Vault-Secrets anlegen (stehen im Abschnitt Push von
   `beta_full_sync.sql`, gleiche Befehle wie in `20260918220000_core_schema.sql`).

Das Skript läuft in einer Transaktion. Schlägt etwas fehl, bleibt die Datenbank wie sie war.

**Was erhalten bleibt:** Konten (auth.users), Profile mit Benutzername, Anzeigename und
Rollen (alte Rolle `admin` → `roles = {admin}`), Freundschaften.

**Was verloren geht:** alles andere in `public` – Lobbys, Spielstände, Rankings,
Benachrichtigungen, F1-Overrides und von Hand im Dashboard angelegte Tabellen – sowie alle
Cron-Jobs (die neuen werden wieder eingeplant).

## Nach neuen Migrationen

```bash
supabase/beta/build-sync.sh
```

baut `beta_full_sync.sql` aus `parts/` und `supabase/migrations` neu. Das Skript lässt
sich auf einer schon synchronisierten Beta-DB erneut ausführen (Profile, Rollen und
Freundschaften bleiben, der Rest wird neu aufgebaut).
