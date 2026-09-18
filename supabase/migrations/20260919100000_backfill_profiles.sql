-- Backfill profiles for users created before the auth trigger was installed.

insert into public.profiles (id, username, display_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'username', ''),
    'user_' || replace(left(u.id::text, 8), '-', '')
  ),
  nullif(u.raw_user_meta_data ->> 'display_name', '')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;
