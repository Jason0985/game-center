-- Werkzeug-Stände pro Konto (Paddle Tabelle, Ankunftsplaner), damit sie nicht mit den
-- Browserdaten verloren gehen. localStorage bleibt Zwischenspeicher für Gäste und offline.

create table if not exists public.user_app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('paddle', 'arrival-planner', 'arrival-planner-train')),
  value jsonb not null check (octet_length(value::text) <= 65536),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_app_state enable row level security;

drop policy if exists "Users manage their own app state" on public.user_app_state;
create policy "Users manage their own app state"
  on public.user_app_state for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests cannot save app state" on public.user_app_state;
create policy "Guests cannot save app state"
  on public.user_app_state as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

revoke all on public.user_app_state from anon, authenticated;
grant select, insert, update, delete on public.user_app_state to authenticated;
