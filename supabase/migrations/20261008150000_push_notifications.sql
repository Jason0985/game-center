-- Push-Nachrichten (Web Push): Mitteilungen kommen als System-Benachrichtigung aufs Gerät,
-- auch wenn die App geschlossen ist.
--
-- Ablauf: Die App meldet das Gerät über save_push_subscription an. Jede neue Zeile in
-- notifications ruft per pg_net die Edge Function send-push auf, die an alle Geräte des
-- Empfängers schickt und abgelaufene Geräte löscht.
--
-- Einrichtung (einmalig, nicht im Repo, weil geheim):
--   select vault.create_secret('https://<projekt>.supabase.co', 'project_url');
--   select vault.create_secret('<zufälliger Wert>', 'push_webhook_secret');
-- und dieselben Werte als Edge-Function-Secrets: PUSH_WEBHOOK_SECRET, VAPID_PUBLIC_KEY,
-- VAPID_PRIVATE_KEY. Fehlt etwas, verschickt der Trigger einfach nichts.

create extension if not exists pg_net;

create table if not exists public.push_subscriptions (
  -- Adresse beim Push-Dienst des Browsers, je Gerät und Browser eine
  endpoint text primary key check (char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read their own push subscriptions" on public.push_subscriptions;
create policy "Users can read their own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own push subscriptions" on public.push_subscriptions;
create policy "Users can remove their own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Anlegen nur über save_push_subscription
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

-- Gerät für das aktuelle Konto speichern. Meldet sich auf dem Gerät ein anderes Konto an,
-- gehört es danach diesem. Nur bekannte Push-Dienste, damit send-push keine beliebigen
-- Adressen aufruft.
create or replace function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_guest() then
    raise exception 'Push-Nachrichten gibt es nur mit Konto.' using errcode = '42501';
  end if;

  if p_endpoint !~ '^https://(fcm\.googleapis\.com|[a-z0-9.-]+\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)/' then
    raise exception 'Dieser Browser wird nicht unterstützt.' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update
  set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
      created_at = now();
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- pg_net schickt erst nach dem Commit und asynchron, die Mitteilung wartet also nie darauf.
-- Ein Fehler hier darf das Anlegen der Mitteilung nie verhindern.
create or replace function public._push_notification()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.push_subscriptions where user_id = new.recipient_id) then
    return null;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object(
      'recipient_id', new.recipient_id,
      'type', new.type,
      'title', new.title,
      'message', new.message));
  return null;
exception when others then
  raise warning 'Push für Mitteilung % nicht verschickt: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
after insert on public.notifications
for each row execute function public._push_notification();

revoke execute on function public._push_notification() from public, anon, authenticated;
