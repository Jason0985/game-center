-- Multiplayer opens up for every signed-in user with a profile.
create or replace function public.can_use_multiplayer(p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = p_user_id);
$$;
