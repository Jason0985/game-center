-- ===========================================================================
-- Beta-Sync, Teil 1: sichern und abräumen
-- ===========================================================================
-- Profile (mit Rollen) und Freundschaften kommen in eine temporäre Sicherung; danach
-- wird alles entfernt, was die App im Schema public angelegt hat (Tabellen, Funktionen
-- samt ihrer Trigger auf auth.users, Views, eigene Typen) sowie alle Cron-Jobs.
-- Konten (auth.users) bleiben unangetastet. Objekte von Erweiterungen bleiben stehen.
-- Läuft auch auf einer schon synchronisierten Datenbank (z. B. nach neuen Migrationen).

create temp table beta_keep_profiles on commit drop as
  select p.id, p.username, p.display_name, p.created_at,
         -- Neues Schema: roles (Text-Array); alter Beta-Stand: role = 'admin' | 'user'
         case when to_jsonb(p) ? 'roles'
                then array(select jsonb_array_elements_text(to_jsonb(p) -> 'roles'))
              when to_jsonb(p) ->> 'role' = 'admin' then array['admin']
              else '{}'::text[] end as roles
  from public.profiles p;

create temp table beta_keep_friendships on commit drop as
  select id, requester_id, addressee_id, status, created_at, updated_at
  from public.friendships;

do $$
declare
  obj record;
begin
  -- Cron-Jobs (das neue Schema plant seine eigenen wieder ein)
  if to_regnamespace('cron') is not null then
    for obj in select jobid from cron.job loop
      perform cron.unschedule(obj.jobid);
    end loop;
  end if;

  for obj in
    select c.oid::regclass as name
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('v', 'm')
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  loop
    execute format('drop view if exists %s cascade', obj.name);
  end loop;

  for obj in
    select c.oid::regclass as name
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  loop
    execute format('drop table if exists %s cascade', obj.name);
  end loop;

  -- Funktionen; cascade nimmt die Trigger mit, auch die auf auth.users
  for obj in
    select p.oid::regprocedure as name
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('drop routine if exists %s cascade', obj.name);
  end loop;

  for obj in
    select t.oid::regtype as name
    from pg_type t
    where t.typnamespace = 'public'::regnamespace
      and t.typtype in ('e', 'c', 'd')
      and (t.typrelid = 0 or (select relkind from pg_class where oid = t.typrelid) = 'c')
      and not exists (select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e')
  loop
    execute format('drop type if exists %s cascade', obj.name);
  end loop;
end $$;
