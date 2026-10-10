-- Härtung aus dem Audit: Fehler-Meldungen drosseln, fehlende FK-Indizes, RLS-Policies mit
-- (select auth.uid()), damit Postgres die Funktion einmal je Abfrage statt je Zeile auswertet.

-- client_errors darf jeder (auch anonym) schreiben – ohne Grenze ließe sich damit der
-- Speicher füllen. Zu viele Meldungen werden still verworfen, der Client merkt nichts.
-- ponytail: globales Limit, je IP/Nutzer drosseln, falls echte Fehler verloren gehen.
create or replace function public._client_errors_throttle()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.client_errors
      where created_at > now() - interval '1 minute') >= 30 then
    return null;
  end if;
  return new;
end;
$$;

revoke execute on function public._client_errors_throttle() from public, anon, authenticated;

drop trigger if exists client_errors_throttle on public.client_errors;
create trigger client_errors_throttle
before insert on public.client_errors
for each row execute function public._client_errors_throttle();

create index if not exists multiplayer_lobbies_host_user_idx
  on public.multiplayer_lobbies (host_user_id);

create index if not exists notifications_sender_idx
  on public.notifications (sender_id);

alter policy "Eigenes Profil darf geändert werden" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "own ranking game - select" on public.ranking_games
  using ((select auth.uid()) = user_id);

alter policy "own ranking game - insert" on public.ranking_games
  with check ((select auth.uid()) = user_id);

alter policy "own ranking game - update" on public.ranking_games
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can read their friendships" on public.friendships
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

alter policy "Users can create friendship requests" on public.friendships
  with check ((select auth.uid()) = requester_id and status = 'pending');

alter policy "Addressee can answer pending requests" on public.friendships
  using ((select auth.uid()) = addressee_id and status = 'pending')
  with check ((select auth.uid()) = addressee_id
              and status in ('accepted', 'declined', 'blocked'));

alter policy "Participants can remove friendships" on public.friendships
  using ((select auth.uid()) = addressee_id
         or ((select auth.uid()) = requester_id and status <> 'blocked'));

alter policy "Users can read their own notifications" on public.notifications
  using ((select auth.uid()) = recipient_id);

alter policy "Users can delete their own notifications" on public.notifications
  using ((select auth.uid()) = recipient_id);

alter policy "Users can mark their own notifications as read" on public.notifications
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

alter policy "Users can read their own F1 strategy overrides" on public.f1_strategy_overrides
  using ((select auth.uid()) = user_id);

alter policy "Users can create their own F1 strategy overrides" on public.f1_strategy_overrides
  with check ((select auth.uid()) = user_id);

alter policy "Users can update their own F1 strategy overrides" on public.f1_strategy_overrides
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can delete their own F1 strategy overrides" on public.f1_strategy_overrides
  using ((select auth.uid()) = user_id);
