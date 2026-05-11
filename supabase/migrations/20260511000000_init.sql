-- =========================================================================
-- IBKM Web — Initial schema
-- Roles: admin | parent | child
-- Core: families -> profiles (children linked to a family, parents linked to
-- one or more families through family_members)
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role as enum ('admin', 'parent', 'child');
create type announcement_audience as enum ('all', 'parents', 'children');

-- ---------- Families ----------
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);

-- ---------- Profiles (1-1 with auth.users) ----------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null,
  first_name      text not null,
  last_name       text not null,
  birth_date      date,
  phone           text,
  -- For children: the family they belong to
  family_id       uuid references families(id) on delete set null,
  -- RGPD: consent for photo sharing (managed by parents for their kids)
  photo_consent   boolean not null default false,
  -- Notifications
  email_notifications boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Parent <-> Family link (a parent can be linked to several families/children)
create table family_members (
  family_id  uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  relation   text, -- "Mère", "Père", "Tuteur", etc.
  primary key (family_id, profile_id)
);

create index on profiles (role);
create index on profiles (family_id);
create index on family_members (profile_id);

-- ---------- Announcements (feed) ----------
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    announcement_audience not null default 'all',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references profiles(id) on delete restrict
);

create index on announcements (created_at desc);

-- ---------- Documents (PDF, etc.) ----------
create table documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  storage_path text not null, -- path inside 'documents' bucket
  mime_type    text,
  size_bytes   bigint,
  audience     announcement_audience not null default 'all',
  -- Optional: target a specific family (private doc for one family)
  family_id    uuid references families(id) on delete cascade,
  created_at   timestamptz not null default now(),
  created_by   uuid not null references profiles(id) on delete restrict
);

create index on documents (created_at desc);
create index on documents (family_id);

-- ---------- Photos ----------
create table photos (
  id           uuid primary key default gen_random_uuid(),
  caption      text,
  storage_path text not null, -- path inside 'photos' bucket
  audience     announcement_audience not null default 'all',
  created_at   timestamptz not null default now(),
  created_by   uuid not null references profiles(id) on delete restrict
);

create index on photos (created_at desc);

-- ---------- Messages ----------
-- Direct messages: each thread is between exactly 2 users.
-- For child safety: a child can only message admins (enforced in policy).
create table message_threads (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references profiles(id) on delete cascade,
  user_b      uuid not null references profiles(id) on delete cascade,
  last_msg_at timestamptz not null default now(),
  -- Ensure a single canonical pair (smaller uuid first)
  constraint uniq_pair unique (user_a, user_b),
  constraint ordered_pair check (user_a < user_b)
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references message_threads(id) on delete cascade,
  sender_id   uuid not null references profiles(id) on delete restrict,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index on messages (thread_id, created_at);

-- ---------- Helper functions ----------
create or replace function is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function my_role()
returns user_role language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_family_ids()
returns setof uuid language sql stable as $$
  -- For a child: their own family
  select family_id from profiles
    where id = auth.uid() and family_id is not null
  union
  -- For a parent: every family they are linked to
  select family_id from family_members where profile_id = auth.uid();
$$;

-- Updated_at trigger
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();

-- ---------- Row Level Security ----------
alter table families         enable row level security;
alter table profiles         enable row level security;
alter table family_members   enable row level security;
alter table announcements    enable row level security;
alter table documents        enable row level security;
alter table photos           enable row level security;
alter table message_threads  enable row level security;
alter table messages         enable row level security;

-- profiles: a user can read their own profile + admins can read all.
-- Parents can read profiles of children in their families. Everyone authenticated
-- can read minimal info of admins (to start a thread).
create policy "profiles self read"   on profiles for select using (id = auth.uid());
create policy "profiles admin read"  on profiles for select using (is_admin(auth.uid()));
create policy "profiles family read" on profiles for select using (
  family_id is not null and family_id in (select my_family_ids())
);
create policy "profiles admins discoverable" on profiles for select using (role = 'admin');

create policy "profiles self update"  on profiles for update using (id = auth.uid());
create policy "profiles admin write"  on profiles for all    using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- families: admins full access, parents/children only their families
create policy "families admin all"     on families for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "families members read"  on families for select using (id in (select my_family_ids()));

-- family_members
create policy "fm admin all"   on family_members for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "fm self read"   on family_members for select using (profile_id = auth.uid() or family_id in (select my_family_ids()));

-- announcements: read by audience match; admin write
create policy "ann read" on announcements for select using (
  audience = 'all'
  or (audience = 'parents'  and my_role() in ('parent','admin'))
  or (audience = 'children' and my_role() in ('child','admin'))
);
create policy "ann admin write" on announcements for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- documents: same audience logic + private family docs
create policy "doc read" on documents for select using (
  (family_id is null and (
    audience = 'all'
    or (audience = 'parents'  and my_role() in ('parent','admin'))
    or (audience = 'children' and my_role() in ('child','admin'))
  ))
  or (family_id in (select my_family_ids()))
  or is_admin(auth.uid())
);
create policy "doc admin write" on documents for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- photos: same as announcements
create policy "photos read" on photos for select using (
  audience = 'all'
  or (audience = 'parents'  and my_role() in ('parent','admin'))
  or (audience = 'children' and my_role() in ('child','admin'))
);
create policy "photos admin write" on photos for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- threads: members + admin
create policy "thread members read" on message_threads for select using (
  user_a = auth.uid() or user_b = auth.uid() or is_admin(auth.uid())
);
create policy "thread members insert" on message_threads for insert with check (
  user_a = auth.uid() or user_b = auth.uid() or is_admin(auth.uid())
);

-- messages: members read/write; child-safety: a child can only send to an admin
create policy "msg members read" on messages for select using (
  exists (
    select 1 from message_threads t
    where t.id = messages.thread_id
      and (t.user_a = auth.uid() or t.user_b = auth.uid() or is_admin(auth.uid()))
  )
);
create policy "msg members write" on messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from message_threads t
    join profiles other_p
      on other_p.id = case when t.user_a = auth.uid() then t.user_b else t.user_a end
    where t.id = messages.thread_id
      and (t.user_a = auth.uid() or t.user_b = auth.uid())
      and (
        my_role() <> 'child'         -- adults can DM anyone in their scope
        or other_p.role = 'admin'    -- children can only message admins
      )
  )
);

-- ---------- Storage buckets ----------
-- Create two buckets: documents (private), photos (private). Signed URLs only.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;

-- Storage policies: admins upload/delete; everyone authenticated may read
-- (the application layer enforces audience via signed URLs on the row metadata).
create policy "storage read auth"
  on storage.objects for select
  using (
    bucket_id in ('documents','photos')
    and auth.uid() is not null
  );

create policy "storage admin write"
  on storage.objects for insert
  with check (
    bucket_id in ('documents','photos')
    and is_admin(auth.uid())
  );

create policy "storage admin delete"
  on storage.objects for delete
  using (
    bucket_id in ('documents','photos')
    and is_admin(auth.uid())
  );

-- ---------- View: thread list with counterpart info ----------
create or replace view v_my_threads as
  select
    t.id,
    t.last_msg_at,
    case when t.user_a = auth.uid() then t.user_b else t.user_a end as other_id,
    (select count(*) from messages m
      where m.thread_id = t.id
        and m.read_at is null
        and m.sender_id <> auth.uid()) as unread_count
  from message_threads t
  where t.user_a = auth.uid() or t.user_b = auth.uid();
