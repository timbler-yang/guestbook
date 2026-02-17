-- Guestbook table
create table if not exists guestbook (
  id          bigint generated always as identity primary key,
  author_id   uuid not null references auth.users(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 50),
  message     text not null check (char_length(message) between 1 and 500),
  created_at  timestamptz not null default now()
);

-- Index for listing (newest first)
create index idx_guestbook_created_at on guestbook (created_at desc);

-- RLS
alter table guestbook enable row level security;

-- Anyone can read
create policy "guestbook_select"
  on guestbook for select
  to authenticated, anon
  using (true);

-- Authenticated users can insert their own
create policy "guestbook_insert"
  on guestbook for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Authors can update their own
create policy "guestbook_update"
  on guestbook for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Authors can delete their own
create policy "guestbook_delete"
  on guestbook for delete
  to authenticated
  using (auth.uid() = author_id);
