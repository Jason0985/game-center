-- Roles, real friend-request notifications and admin system broadcasts.

-- ===========================================================================
-- Roles
-- ===========================================================================
-- Users cannot assign themselves a role: authenticated may only update
-- profiles.display_name (column grant in the core schema).

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

update public.profiles set role = 'admin' where username = 'brjason';

-- ===========================================================================
-- Notification types
-- ===========================================================================
-- friend_request / friend_accepted: created by the friendship trigger below
-- game_invite:                      reserved for multiplayer invites
-- system_info / system_alert:       admin broadcasts, dismiss only

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('friend_request', 'friend_accepted', 'game_invite', 'system_info', 'system_alert'));

-- ===========================================================================
-- Friend request notifications
-- ===========================================================================

create or replace function public.notify_friendship_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  actor_name text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    select coalesce(display_name, username) into actor_name
    from public.profiles where id = new.requester_id;
    actor_name := left(coalesce(actor_name, 'Jemand'), 50);

    insert into public.notifications
      (recipient_id, sender_id, sender_name, type, title, message, related_id)
    values
      (new.addressee_id, new.requester_id, actor_name, 'friend_request',
       'Freundschaftsanfrage', actor_name || ' möchte dich als Freund hinzufügen.', new.id::text);

  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    -- Answered: the request notification is no longer actionable.
    delete from public.notifications
    where type = 'friend_request' and related_id = new.id::text;

    if new.status = 'accepted' then
      select coalesce(display_name, username) into actor_name
      from public.profiles where id = new.addressee_id;
      actor_name := left(coalesce(actor_name, 'Jemand'), 50);

      insert into public.notifications
        (recipient_id, sender_id, sender_name, type, title, message, related_id)
      values
        (new.requester_id, new.addressee_id, actor_name, 'friend_accepted',
         'Anfrage angenommen', actor_name || ' hat deine Freundschaftsanfrage angenommen.',
         new.id::text);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists friendships_notify on public.friendships;
create trigger friendships_notify
after insert or update of status on public.friendships
for each row execute function public.notify_friendship_change();

revoke execute on function public.notify_friendship_change() from public, anon, authenticated;

-- Existing pending requests get their notification too.
insert into public.notifications
  (recipient_id, sender_id, sender_name, type, title, message, related_id, created_at)
select
  f.addressee_id,
  f.requester_id,
  left(coalesce(p.display_name, p.username, 'Jemand'), 50),
  'friend_request',
  'Freundschaftsanfrage',
  left(coalesce(p.display_name, p.username, 'Jemand'), 50) || ' möchte dich als Freund hinzufügen.',
  f.id::text,
  f.created_at
from public.friendships f
left join public.profiles p on p.id = f.requester_id
where f.status = 'pending'
  and not exists (
    select 1 from public.notifications n
    where n.type = 'friend_request' and n.related_id = f.id::text
  );

-- ===========================================================================
-- System notifications (admin broadcast to every user)
-- ===========================================================================

create or replace function public.send_system_notification(
  p_type text,
  p_title text,
  p_message text
)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  sent integer;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Systembenachrichtigungen senden.'
      using errcode = '42501';
  end if;

  if p_type not in ('system_info', 'system_alert') then
    raise exception 'Ungültiger Benachrichtigungstyp.' using errcode = '22023';
  end if;

  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_message), '') = '' then
    raise exception 'Titel und Nachricht sind erforderlich.' using errcode = '22023';
  end if;

  insert into public.notifications (recipient_id, sender_id, sender_name, type, title, message)
  select p.id, auth.uid(), 'Game Center', p_type, btrim(p_title), btrim(p_message)
  from public.profiles p;

  get diagnostics sent = row_count;
  return sent;
end;
$$;

revoke execute on function public.send_system_notification(text, text, text) from public, anon;
grant execute on function public.send_system_notification(text, text, text) to authenticated;

-- ===========================================================================
-- Realtime (new notifications update the badge live; still filtered by RLS)
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
