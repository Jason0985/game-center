-- Users can hold several extra roles on top of the base "user" role; an empty
-- array means plain user. Admins implicitly have every role.
-- Clients still cannot write profiles.roles directly (only display_name is
-- updatable); admins change roles through set_user_roles.
--
--   admin         everything, incl. system notifications and role management
--   race_results  may extract race results from screenshots (race-result-ocr)

alter table public.profiles
  add column if not exists roles text[] not null default '{}'
  constraint profiles_roles_known check (roles <@ array['admin', 'race_results']::text[]);

-- The single-role column and its setter are replaced by roles / set_user_roles.
drop function if exists public.set_user_role(uuid, text);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    update public.profiles set roles = array['admin'] where role = 'admin';
    alter table public.profiles drop column role;
  end if;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and 'admin' = any(roles)
  );
$$;

-- True if the current user has the role; admins have every role.
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (p_role = any(roles) or 'admin' = any(roles))
  );
$$;

-- Replaces all extra roles of a user. Admins cannot change their own roles, so
-- at least one admin always remains.
create or replace function public.set_user_roles(p_user_id uuid, p_roles text[])
returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  cleaned text[];
  updated public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Rollen verwalten.' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du kannst deine eigenen Rollen nicht ändern.' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct role order by role), '{}')
  into cleaned
  from unnest(coalesce(p_roles, '{}')) as role;

  if not cleaned <@ array['admin', 'race_results']::text[] then
    raise exception 'Unbekannte Rolle.' using errcode = '22023';
  end if;

  update public.profiles set roles = cleaned where id = p_user_id returning * into updated;

  if updated.id is null then
    raise exception 'Nutzer nicht gefunden.' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke execute on function public.set_user_roles(uuid, text[]) from public, anon;
grant execute on function public.set_user_roles(uuid, text[]) to authenticated;
