-- Fehler-Überwachung: Unerwartete Fehler aus dem Browser (AppErrorHandler) landen hier,
-- Admins sehen sie auf der Admin-Seite. Schreiben dürfen alle (auch ohne Konto), lesen
-- und löschen nur Admins. Nach 30 Tagen räumt pg_cron auf.

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  message text not null check (char_length(message) <= 1000),
  stack text check (char_length(stack) <= 8000),
  url text check (char_length(url) <= 500),
  user_agent text check (char_length(user_agent) <= 500),
  app_version text check (char_length(app_version) <= 20)
);

create index if not exists client_errors_created_at_idx on public.client_errors (created_at desc);
create index if not exists client_errors_user_id_idx on public.client_errors (user_id);

alter table public.client_errors enable row level security;

-- user_id muss zur Sitzung passen, damit niemand Fehler anderen unterschiebt
drop policy if exists "Anyone can report errors" on public.client_errors;
create policy "Anyone can report errors"
  on public.client_errors for insert
  to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));

drop policy if exists "Admins read errors" on public.client_errors;
create policy "Admins read errors"
  on public.client_errors for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins delete errors" on public.client_errors;
create policy "Admins delete errors"
  on public.client_errors for delete
  to authenticated
  using ((select public.is_admin()));

revoke all on public.client_errors from anon, authenticated;
grant insert (message, stack, url, user_agent, app_version) on public.client_errors to anon, authenticated;
grant select, delete on public.client_errors to authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-client-errors', '43 4 * * *',
  $$delete from public.client_errors where created_at < now() - interval '30 days'$$
);
