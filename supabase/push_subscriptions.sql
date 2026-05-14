-- Push subscriptions table
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);

-- Only the subscription owner can read/delete their own
alter table push_subscriptions enable row level security;

create policy "owner read"   on push_subscriptions for select using (auth.uid() = user_id);
create policy "owner insert" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "owner delete" on push_subscriptions for delete using (auth.uid() = user_id);
-- Service role (Edge Function) can read all subscriptions
create policy "service read" on push_subscriptions for select using (true);
