-- =========================================================================
-- IBKM Web — Messages d'un séjour
-- Admins post messages visible to all trip members. Members read only.
-- Visibility follows the trip itself (can_see_trip).
-- =========================================================================

create table trip_messages (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references profiles(id) on delete restrict
);

create index on trip_messages (trip_id, created_at desc);

alter table trip_messages enable row level security;

create policy "trip_messages read"        on trip_messages for select using (can_see_trip(trip_id));
create policy "trip_messages admin write" on trip_messages for all    using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Realtime broadcasting so members see admin posts without reload.
alter publication supabase_realtime add table trip_messages;
alter table trip_messages replica identity full;
