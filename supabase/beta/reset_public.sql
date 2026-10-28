-- Beta-Datenbank leeren, damit supabase/migrations/20261028120000_core_schema.sql sie
-- komplett neu aufbauen kann. NUR im Beta-Projekt ausführen!
--
-- Löscht alles, was die App im Schema public angelegt hat (Tabellen mit allen Daten,
-- Views, Funktionen samt ihrer Trigger auf auth.users, eigene Typen), alle Cron-Jobs und
-- die Migrations-Historie der Supabase-CLI. Konten (auth.users) bleiben; ihre Profile legt
-- das Core-Schema danach neu an. Objekte von Erweiterungen bleiben stehen.

begin;

do $$
declare
  obj record;
begin
  if to_regnamespace('cron') is not null then
    for obj in select jobid from cron.job loop
      perform cron.unschedule(obj.jobid);
    end loop;
  end if;

  -- Sonst hält die CLI das alte Core-Schema für schon ausgeführt und überspringt es
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    delete from supabase_migrations.schema_migrations;
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

  -- cascade nimmt die Trigger mit, auch die auf auth.users
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

  -- Prüfen, dass wirklich nichts übrig ist (sonst überspringt "create table if not exists"
  -- alte Tabellen und später fehlen Spalten wie profiles.roles)
  if exists (
    select 1
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p', 'v', 'm')
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  ) then
    raise exception 'public ist noch nicht leer';
  end if;
end $$;

commit;
