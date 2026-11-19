-- GT7-Tracker: Quelle ist jetzt GT7 Info (ddm999.github.io/gt7info/data.json) statt gtdb.io.
-- Der Legend Cars Dealer wechselt jeden Tag um 00:00 UTC; GT7 Info ist kurz danach aktuell.
-- Neu je Auto: ob es neu beim Händler ist und wie viele Tage es noch (geschätzt) bleibt.
-- Lässt sich gefahrlos erneut ausführen.

alter table public.gt7_dealer add column if not exists is_new boolean not null default false;
alter table public.gt7_dealer add column if not exists days_left integer;

-- Nach dem Wechsel mehrmals nachsehen (GT7 Info braucht etwas), dazu tagsüber zweimal; neue
-- Autos melden sich je Wechsel nur einmal
do $$
begin
  if exists (select 1 from cron.job where jobname = 'gt7-legend-check') then
    perform cron.unschedule('gt7-legend-check');
  end if;
end;
$$;

select cron.schedule('gt7-legend-check', '17 0,1,3,9,15 * * *', 'select public._gt7_trigger_check()');
