-- =========================================================================
-- Family <-> Admin exchange, scoped per child.
--
-- For each child we expose:
--   * a private conversation visible to all admins and all parents linked
--     to that child's family
--   * a list of documents exchanged both ways for that specific child
--
-- Threads are unique per child. A new thread is created on demand by the
-- first parent (or admin) to write a message.
-- =========================================================================

-- ---------- Helper: is the current user a parent of this child? ----------
create or replace function is_parent_of_child(child uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles c
    join family_members fm on fm.family_id = c.family_id
    where c.id = child
      and c.role = 'child'
      and c.family_id is not null
      and fm.profile_id = auth.uid()
  );
$$;
revoke all on function is_parent_of_child(uuid) from public;
grant execute on function is_parent_of_child(uuid) to authenticated;

-- ---------- Threads (one per child) ----------
create table child_threads (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null unique references profiles(id) on delete cascade,
  last_msg_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index on child_threads (last_msg_at desc);

create table child_thread_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references child_threads(id) on delete cascade,
  child_id    uuid not null references profiles(id) on delete cascade,
  sender_id   uuid not null references profiles(id) on delete restrict,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on child_thread_messages (thread_id, created_at);
create index on child_thread_messages (child_id, created_at desc);

-- ---------- Per-child documents (parent <-> admin) ----------
create table child_documents (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  sender_id    uuid not null references profiles(id) on delete restrict,
  created_at   timestamptz not null default now()
);
create index on child_documents (child_id, created_at desc);

-- ---------- RLS ----------
alter table child_threads          enable row level security;
alter table child_thread_messages  enable row level security;
alter table child_documents        enable row level security;

-- child_threads: admin full, parent of the child can read + create
create policy "child_threads admin all" on child_threads
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "child_threads parent read" on child_threads
  for select using (is_parent_of_child(child_id));
create policy "child_threads parent insert" on child_threads
  for insert with check (is_parent_of_child(child_id));
create policy "child_threads parent update last_msg" on child_threads
  for update using (is_parent_of_child(child_id)) with check (is_parent_of_child(child_id));

-- child_thread_messages
create policy "child_msg admin all" on child_thread_messages
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "child_msg parent read" on child_thread_messages
  for select using (is_parent_of_child(child_id));
create policy "child_msg parent write" on child_thread_messages
  for insert with check (
    sender_id = auth.uid()
    and is_parent_of_child(child_id)
  );
create policy "child_msg mark read" on child_thread_messages
  for update using (
    is_parent_of_child(child_id) and sender_id <> auth.uid()
  ) with check (
    is_parent_of_child(child_id) and sender_id <> auth.uid()
  );

-- child_documents
create policy "child_doc admin all" on child_documents
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "child_doc parent read" on child_documents
  for select using (is_parent_of_child(child_id));
create policy "child_doc parent insert" on child_documents
  for insert with check (
    sender_id = auth.uid()
    and is_parent_of_child(child_id)
  );
create policy "child_doc sender delete" on child_documents
  for delete using (sender_id = auth.uid());

-- ---------- Storage bucket for these exchanges ----------
insert into storage.buckets (id, name, public)
  values ('family-exchange', 'family-exchange', false)
  on conflict (id) do nothing;

create policy "family-exchange read auth"
  on storage.objects for select
  using (
    bucket_id = 'family-exchange'
    and auth.uid() is not null
  );

create policy "family-exchange admin or parent write"
  on storage.objects for insert
  with check (
    bucket_id = 'family-exchange'
    and (is_admin(auth.uid()) or my_role() = 'parent')
  );

create policy "family-exchange admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'family-exchange'
    and is_admin(auth.uid())
  );

create policy "family-exchange sender delete"
  on storage.objects for delete
  using (
    bucket_id = 'family-exchange'
    and owner = auth.uid()
  );

-- ---------- Realtime ----------
alter publication supabase_realtime add table child_thread_messages;
alter table child_thread_messages replica identity full;
