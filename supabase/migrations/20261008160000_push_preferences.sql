-- Push-Einstellungen pro Konto: welche Mitteilungsarten als Push kommen. Gespeichert wird,
-- was stumm ist, damit neue Arten automatisch an sind. Die Mitteilungen in der App bleiben
-- unberührt, es geht nur um die Benachrichtigung aufs Gerät.

create table if not exists public.push_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  muted_types text[] not null default '{}'
    check (muted_types <@ array['friend_request', 'friend_accepted', 'game_invite',
                                'system_info', 'system_alert']::text[]),
  updated_at timestamptz not null default now()
);

alter table public.push_preferences enable row level security;

drop policy if exists "Users manage their own push preferences" on public.push_preferences;
create policy "Users manage their own push preferences"
  on public.push_preferences for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests cannot save push preferences" on public.push_preferences;
create policy "Guests cannot save push preferences"
  on public.push_preferences as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

revoke all on public.push_preferences from anon, authenticated;
grant select, insert, update, delete on public.push_preferences to authenticated;

-- Wie in 20261008150000_push_notifications.sql, plus: stumme Arten überspringen und die
-- Secrets trimmen (ein mitkopierter Zeilenumbruch hat das Geheimnis schon einmal ungültig gemacht).
create or replace function public._push_notification()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.push_subscriptions where user_id = new.recipient_id)
     or exists (select 1 from public.push_preferences
                where user_id = new.recipient_id and new.type = any(muted_types)) then
    return null;
  end if;

  select btrim(decrypted_secret, E' \r\n\t') into v_url
  from vault.decrypted_secrets where name = 'project_url';
  select btrim(decrypted_secret, E' \r\n\t') into v_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-push',
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

revoke execute on function public._push_notification() from public, anon, authenticated;
