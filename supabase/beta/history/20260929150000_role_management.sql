-- Admins change user roles through this function; clients cannot write
-- profiles.role directly. Admins cannot change their own role, so at least
-- one admin always remains.

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  updated public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Rollen verwalten.' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du kannst deine eigene Rolle nicht ändern.' using errcode = '42501';
  end if;

  if p_role not in ('user', 'admin') then
    raise exception 'Unbekannte Rolle.' using errcode = '22023';
  end if;

  update public.profiles set role = p_role where id = p_user_id returning * into updated;

  if updated.id is null then
    raise exception 'Nutzer nicht gefunden.' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;
