-- Read state per notification in the database (instead of per browser), so
-- the badge and startup pop-ups agree across devices.

alter table public.notifications add column if not exists read_at timestamptz;

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- Recipients may only set read_at on their own notifications.
drop policy if exists "Users can mark their own notifications as read" on public.notifications;
create policy "Users can mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

grant update (read_at) on public.notifications to authenticated;
