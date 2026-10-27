-- ===========================================================================
-- Beta-Sync, letzter Teil: Profile und Freundschaften zurückspielen
-- ===========================================================================
-- Ohne Trigger, damit beim Zurückspielen keine Benachrichtigungen oder Pushes entstehen.
-- Gäste (anonyme Konten) kennzeichnen.
-- Namen, die der neue Namensfilter ablehnt, bekommen einen neutralen Ersatz.

alter table public.profiles disable trigger user;
alter table public.friendships disable trigger user;

-- Das neue Schema hat für alle Konten schon Profile angelegt (Backfill); vor dem
-- Zurückspielen Platzhalternamen, damit sich keine Namen in die Quere kommen
update public.profiles p
set username = 'tmp_' || substr(replace(p.id::text, '-', ''), 1, 16)
where p.id in (select id from beta_keep_profiles);

insert into public.profiles (id, username, display_name, created_at, roles, is_guest)
select k.id,
       case when public.name_is_allowed(k.username) then k.username
            else 'spieler_' || substr(replace(k.id::text, '-', ''), 1, 8) end,
       case when k.display_name is null or public.name_is_allowed(k.display_name)
            then k.display_name end,
       k.created_at,
       k.roles,
       coalesce(u.is_anonymous, false)
from beta_keep_profiles k
join auth.users u on u.id = k.id
on conflict (id) do update
  set username = excluded.username,
      display_name = excluded.display_name,
      created_at = excluded.created_at,
      roles = excluded.roles;

insert into public.friendships (id, requester_id, addressee_id, status, created_at, updated_at)
select k.id, k.requester_id, k.addressee_id, k.status, k.created_at, k.updated_at
from beta_keep_friendships k
where exists (select 1 from public.profiles p where p.id = k.requester_id)
  and exists (select 1 from public.profiles p where p.id = k.addressee_id)
on conflict do nothing;

update public.profiles p
set is_guest = u.is_anonymous
from auth.users u
where u.id = p.id and p.is_guest is distinct from u.is_anonymous;

alter table public.profiles enable trigger user;
alter table public.friendships enable trigger user;
