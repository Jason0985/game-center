-- GT7-Tracker entfernt (Auto ist gekauft, wird nicht mehr gebraucht).
-- Räumt alles aus 20261109120000_gt7_tracker.sql und 20261117100000_gt7_gt7info.sql weg:
-- Cron-Job, Aufruf-Funktion und die drei gt7_-Tabellen. Mitteilungen des Trackers in
-- notifications bleiben (normale Mitteilungen). Lässt sich gefahrlos erneut ausführen.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'gt7-legend-check') then
    perform cron.unschedule('gt7-legend-check');
  end if;
end;
$$;

drop function if exists public._gt7_trigger_check(boolean);

drop table if exists public.gt7_watchlist;
drop table if exists public.gt7_dealer;
drop table if exists public.gt7_status;
