# Beta-Datenbank neu aufbauen

Die Beta läuft gegen ein eigenes Supabase-Projekt. Ihr alter Stand von Ende September
liegt in `history/`. Das komplette aktuelle Schema steht in einer einzigen Datei:
`supabase/migrations/20261028120000_core_schema.sql` (alle Migrationen bis 2026-10-22
zusammengefasst, Inhalt unverändert).

## So geht's (SQL Editor im Supabase-Dashboard des **Beta**-Projekts)

1. `supabase/beta/reset_public.sql` komplett einfügen und ausführen.
   Leert das Schema public (alle Tabellen mit Daten, Funktionen, Trigger), alle Cron-Jobs
   und die Migrations-Historie der Supabase-CLI. Konten (auth.users) bleiben.
2. `supabase/migrations/20261028120000_core_schema.sql` komplett einfügen und ausführen.
   Legt alles neu an; bestehende Konten bekommen automatisch wieder ein Profil.
3. Dich wieder zum Admin machen (E-Mail anpassen):

   ```sql
   update public.profiles set roles = '{admin}'
   where id = (select id from auth.users where email = 'deine@mail.de');
   ```

4. Für Push-Nachrichten die zwei Vault-Secrets anlegen (Befehle im Abschnitt Push des
   Core-Schemas).

Mit der Supabase-CLI geht Schritt 2 auch per `supabase db push` – nach Schritt 1 ist die
Historie leer, die CLI führt das neue Core-Schema dann aus.

**Was verloren geht:** alle Daten in public – Profile (werden mit dem Namen aus der
Registrierung neu angelegt), Rollen, Freundschaften, Lobbys, Spielstände, Rankings,
Benachrichtigungen.
