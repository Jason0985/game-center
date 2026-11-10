-- Routen-Check: eigene Autostrecken (z. B. Wohnung -> Arbeit) auf Stau, Baustellen und
-- Sperrungen beobachten, für alle Konten, jedes Konto sieht nur seine Routen.
--
-- Die Edge Function route-traffic plant die Strecke mit TomTom (Live-Verkehr auf allen
-- Straßen) und gleicht sie mit den Meldungen der Autobahn GmbH ab (verkehr.autobahn.de).
-- pg_cron ruft sie alle 5 Minuten auf: zu den eingestellten Check-Zeiten kommt eine
-- Mitteilung mit Fahrzeit und Störungen (auf Wunsch auch "frei"), dazu rund um die Uhr
-- sofort eine Mitteilung bei neuem Stau oder neuer Sperrung auf der Strecke. Die Push
-- kommt über den bestehenden Trigger auf notifications (Art route_alert, stummschaltbar).
--
-- Alles trägt das Präfix route_; zum Entfernen: Cron-Job route-traffic abmelden, die beiden
-- Tabellen und _route_traffic_cron löschen. Lässt sich gefahrlos erneut ausführen.

create table if not exists public.route_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  origin_label text not null check (char_length(origin_label) between 1 and 160),
  origin_lat double precision not null check (origin_lat between -90 and 90),
  origin_lon double precision not null check (origin_lon between -180 and 180),
  dest_label text not null check (char_length(dest_label) between 1 and 160),
  dest_lat double precision not null check (dest_lat between -90 and 90),
  dest_lon double precision not null check (dest_lon between -180 and 180),
  -- Check-Zeiten: [{"time": "06:45", "days": [1,2,3,4,5], "reverse": false}], 1 = Montag
  schedules jsonb not null default '[]'::jsonb
    check (jsonb_typeof(schedules) = 'array' and jsonb_array_length(schedules) <= 8),
  -- Rund um die Uhr bei neuem Stau/neuer Sperrung melden
  live_alerts boolean not null default true,
  -- Zur Check-Zeit auch melden, wenn alles frei ist
  notify_clear boolean not null default true,
  -- Von der Edge Function gesetzt: Strecke (vereinfacht, [[lat, lon], …]), Autobahnen darauf,
  -- Länge und Fahrzeit ohne Verkehr
  path jsonb not null default '[]'::jsonb,
  roads text[] not null default '{}',
  length_m integer,
  base_seconds integer,
  -- Letzter Check (für die Anzeige) und Stand der Benachrichtigungen
  last_check jsonb,
  last_checked_at timestamptz,
  last_tomtom_at timestamptz,
  last_slot text,
  live_delay_notified integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists route_watches_user_idx on public.route_watches (user_id);

-- Schon gemeldete Ereignisse je Route (Autobahn-Ereignisnummer bzw. TomTom-Ereignis)
create table if not exists public.route_alerts_seen (
  route_id uuid not null references public.route_watches(id) on delete cascade,
  alert_id text not null check (char_length(alert_id) <= 200),
  seen_at timestamptz not null default now(),
  primary key (route_id, alert_id)
);

alter table public.route_watches enable row level security;
alter table public.route_alerts_seen enable row level security;

-- Anlegen und Strecke ändern nur über die Edge Function (sie plant die Route);
-- lesen, Zeiten/Schalter ändern und löschen darf jeder bei seinen eigenen Routen
drop policy if exists "Users read their routes" on public.route_watches;
create policy "Users read their routes"
  on public.route_watches for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users update their routes" on public.route_watches;
create policy "Users update their routes"
  on public.route_watches for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users delete their routes" on public.route_watches;
create policy "Users delete their routes"
  on public.route_watches for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.route_watches, public.route_alerts_seen from anon, authenticated;
grant select, delete on public.route_watches to authenticated;
grant update (name, schedules, live_alerts, notify_clear) on public.route_watches to authenticated;

-- Neue Mitteilungsart route_alert (Mitteilung und Push, in den Push-Einstellungen abschaltbar)
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('friend_request', 'friend_accepted', 'game_invite', 'system_info',
                  'system_alert', 'route_alert'));

alter table public.push_preferences drop constraint if exists push_preferences_muted_types_check;
alter table public.push_preferences add constraint push_preferences_muted_types_check
  check (muted_types <@ array['friend_request', 'friend_accepted', 'game_invite',
                              'system_info', 'system_alert', 'route_alert']::text[]);

-- Ruft die Edge Function im Cron-Modus auf. Fehlen die Vault-Secrets, passiert nichts.
create or replace function public._route_traffic_cron()
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.route_watches) then
    return null;
  end if;
  select btrim(decrypted_secret, E' \r\n\t') into v_url
  from vault.decrypted_secrets where name = 'project_url';
  select btrim(decrypted_secret, E' \r\n\t') into v_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    raise warning 'Routen-Check: project_url oder push_webhook_secret fehlt im Vault';
    return null;
  end if;

  return net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/route-traffic',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('action', 'cron'),
    timeout_milliseconds := 120000);
end;
$$;

revoke execute on function public._route_traffic_cron() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'route-traffic') then
    perform cron.unschedule('route-traffic');
  end if;
end;
$$;

select cron.schedule('route-traffic', '*/5 * * * *', 'select public._route_traffic_cron()');
