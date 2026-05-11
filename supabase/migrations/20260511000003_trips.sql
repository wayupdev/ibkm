-- =========================================================================
-- IBKM Web — Séjours (trips)
-- A "trip" is an admin-created space containing rich info + attached documents.
-- Visibility is restricted to an admin-curated list of profiles via trip_members.
-- =========================================================================

-- ---------- Trips ----------
create table trips (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  location    text,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references profiles(id) on delete restrict
);

create index on trips (start_date desc);

-- ---------- Trip members (who can see a trip) ----------
create table trip_members (
  trip_id    uuid not null references trips(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (trip_id, profile_id)
);

create index on trip_members (profile_id);

-- ---------- Trip documents ----------
-- Files live in the existing 'documents' storage bucket under path: trips/<trip_id>/<uuid>.<ext>
create table trip_documents (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references trips(id) on delete cascade,
  title        text not null,
  description  text,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz not null default now(),
  created_by   uuid not null references profiles(id) on delete restrict
);

create index on trip_documents (trip_id, created_at desc);

-- ---------- Helper ----------
create or replace function can_see_trip(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin(auth.uid())
      or exists (
        select 1 from trip_members
        where trip_id = tid and profile_id = auth.uid()
      );
$$;

revoke all on function can_see_trip(uuid) from public;
grant execute on function can_see_trip(uuid) to authenticated;

-- ---------- Row Level Security ----------
alter table trips          enable row level security;
alter table trip_members   enable row level security;
alter table trip_documents enable row level security;

-- trips: members can read, admin writes
create policy "trips read"        on trips for select using (can_see_trip(id));
create policy "trips admin write" on trips for all    using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- trip_members: admin manages; user can see their own membership rows
create policy "trip_members admin all"  on trip_members for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "trip_members self read"  on trip_members for select using (profile_id = auth.uid());

-- trip_documents: same visibility rule as the parent trip
create policy "trip_docs read"        on trip_documents for select using (can_see_trip(trip_id));
create policy "trip_docs admin write" on trip_documents for all    using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
