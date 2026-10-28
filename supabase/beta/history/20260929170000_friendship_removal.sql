-- Friends can be removed again, and declining a request deletes it so the
-- requester can send a new one later (e.g. after an accidental decline).

-- Addressee: decline a request or remove a friend.
-- Requester: withdraw a request or remove a friend (not when blocked).
drop policy if exists "Participants can remove friendships" on public.friendships;
create policy "Participants can remove friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = addressee_id or (auth.uid() = requester_id and status <> 'blocked'));

-- The open request notification disappears together with the request.
create or replace function public.cleanup_friendship_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.notifications
  where type = 'friend_request' and related_id = old.id::text;
  return null;
end;
$$;

drop trigger if exists friendships_cleanup_notifications on public.friendships;
create trigger friendships_cleanup_notifications
after delete on public.friendships
for each row execute function public.cleanup_friendship_notifications();

revoke execute on function public.cleanup_friendship_notifications() from public, anon, authenticated;

-- Declined rows from the old flow would block a new request between the pair.
delete from public.friendships where status = 'declined';
