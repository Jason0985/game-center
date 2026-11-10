-- GT7-Tracker: Legend Cars Dealer aus Gran Turismo 7 beobachten (nur für Admins).
--
-- Die Edge Function gt7-legend-check liest zweimal täglich gtdb.io/gt7/legend-cars-dealer/
-- aus, speichert die aktuelle Händlerliste in gt7_dealer und legt für jedes Auto auf einer
-- Merkliste (gt7_watchlist), das neu verfügbar ist, eine Mitteilung an; die Push kommt dann
-- über den bestehenden Trigger auf notifications. Aufgerufen wird sie per pg_cron mit dem
-- vorhandenen push_webhook_secret (Vault und Edge-Function-Secret PUSH_WEBHOOK_SECRET).
--
-- Alles trägt das Präfix gt7_; zum Entfernen: Cron-Job gt7-legend-check abmelden, die drei
-- Tabellen und _gt7_trigger_check löschen. Lässt sich gefahrlos erneut ausführen.

-- Autos, die gerade beim Händler stehen oder zuletzt standen. car_id ist die ID bei gtdb
-- (z. B. xj13-66 aus /gt7/car/xj13-66/). available_since: seit wann das Auto beim Händler und
-- nicht ausverkauft ist (null sonst); daran erkennt der Tracker eine neue Verfügbarkeit.
create table if not exists public.gt7_dealer (
  car_id text primary key check (car_id ~ '^[a-z0-9-]{1,80}$'),
  maker text not null default '',
  name text not null,
  price bigint,
  image_url text,
  sold_out boolean not null default false,
  limited_stock boolean not null default false,
  in_dealer boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  available_since timestamptz
);

-- Merkliste je Konto; notified_at: wann zuletzt gemeldet (je Verfügbarkeit einmal)
create table if not exists public.gt7_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  car_id text not null check (car_id ~ '^[a-z0-9-]{1,80}$'),
  maker text not null default '' check (char_length(maker) <= 60),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (user_id, car_id)
);

-- Letzte Prüfung (eine Zeile): wann, ob es geklappt hat, Stand der Seite bei gtdb
create table if not exists public.gt7_status (
  id smallint primary key default 1 check (id = 1),
  checked_at timestamptz,
  ok boolean not null default false,
  message text,
  page_updated_at timestamptz,
  car_count integer not null default 0
);

insert into public.gt7_status (id) values (1) on conflict do nothing;

alter table public.gt7_dealer enable row level security;
alter table public.gt7_watchlist enable row level security;
alter table public.gt7_status enable row level security;

drop policy if exists "Admins read the GT7 dealer" on public.gt7_dealer;
create policy "Admins read the GT7 dealer"
  on public.gt7_dealer for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins read the GT7 status" on public.gt7_status;
create policy "Admins read the GT7 status"
  on public.gt7_status for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins manage their GT7 watchlist" on public.gt7_watchlist;
create policy "Admins manage their GT7 watchlist"
  on public.gt7_watchlist for all
  to authenticated
  using ((select public.is_admin()) and user_id = (select auth.uid()))
  with check ((select public.is_admin()) and user_id = (select auth.uid()));

revoke all on public.gt7_dealer, public.gt7_watchlist, public.gt7_status from anon, authenticated;
grant select on public.gt7_dealer, public.gt7_status to authenticated;
grant select, insert, delete on public.gt7_watchlist to authenticated;

-- Ruft die Edge Function auf (pg_cron bzw. von Hand: select public._gt7_trigger_check(true)
-- schickt allen Admins eine Test-Mitteilung). Fehlen die Vault-Secrets, passiert nichts.
create or replace function public._gt7_trigger_check(p_test boolean default false)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select btrim(decrypted_secret, E' \r\n\t') into v_url
  from vault.decrypted_secrets where name = 'project_url';
  select btrim(decrypted_secret, E' \r\n\t') into v_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    raise warning 'GT7-Tracker: project_url oder push_webhook_secret fehlt im Vault';
    return null;
  end if;

  return net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/gt7-legend-check',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('test', p_test),
    timeout_milliseconds := 60000);
end;
$$;

revoke execute on function public._gt7_trigger_check(boolean) from public, anon, authenticated;

-- Zweimal täglich; gtdb aktualisiert die Seite nachts (UTC)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'gt7-legend-check') then
    perform cron.unschedule('gt7-legend-check');
  end if;
end;
$$;

select cron.schedule('gt7-legend-check', '23 1,13 * * *', 'select public._gt7_trigger_check()');

-- Erster Eintrag auf der Merkliste aller Admins: Jaguar XJ13 '66
insert into public.gt7_watchlist (user_id, car_id, maker, name)
select p.id, 'xj13-66', 'Jaguar', 'XJ13 ''66'
from public.profiles p
where 'admin' = any(p.roles)
on conflict do nothing;
