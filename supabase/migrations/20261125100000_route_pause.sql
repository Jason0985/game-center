-- Routen-Check: Route pausieren. Bis paused_until laufen für die Route keine Check-Zeiten und
-- keine Sofort-Meldungen ('infinity' = bis man sie wieder einschaltet, null = aktiv). Prüfen
-- von Hand geht weiter. Der Besitzer setzt die Pause selbst (Spaltenrecht wie bei den Schaltern).
-- Lässt sich gefahrlos erneut ausführen.

alter table public.route_watches add column if not exists paused_until timestamptz;

grant update (paused_until) on public.route_watches to authenticated;
