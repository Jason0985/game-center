-- ===========================================================================
-- Bauplaner: eigene Baupläne (Blöcke, Ebenen, Bauschritte) pro Konto
-- ===========================================================================
-- plan ist das importierte Bauplan-JSON (Format bauplaner/1, siehe
-- src/app/features/collection/build-planner/build-plan.model.ts). progress merkt sich
-- erledigte Schritte und gesammelte Materialien: {"done": [0, 1], "have": ["Glas"]}.
-- Jeder sieht und ändert nur seine eigenen Pläne. Lässt sich gefahrlos erneut ausführen.

create table if not exists public.build_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint build_plans_plan_size check (octet_length(plan::text) <= 524288),
  constraint build_plans_progress_size check (octet_length(progress::text) <= 16384)
);

create index if not exists build_plans_user_updated_idx
  on public.build_plans (user_id, updated_at desc);

alter table public.build_plans enable row level security;

drop policy if exists "Users can read their own build plans" on public.build_plans;
create policy "Users can read their own build plans"
  on public.build_plans for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own build plans" on public.build_plans;
create policy "Users can create their own build plans"
  on public.build_plans for insert
  to authenticated
  with check ((select auth.uid()) = user_id and not (select public.is_guest()));

drop policy if exists "Users can update their own build plans" on public.build_plans;
create policy "Users can update their own build plans"
  on public.build_plans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own build plans" on public.build_plans;
create policy "Users can delete their own build plans"
  on public.build_plans for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Nur echte Konten, keine anonymen Gäste aus den Lobbys
revoke all on public.build_plans from anon;
grant select, insert, update, delete on public.build_plans to authenticated;
