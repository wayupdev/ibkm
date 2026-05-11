-- Allow targeting documents and photos to specific people.
--
-- When at least one recipient is set on a document/photo, that explicit list
-- takes precedence over the `audience` field: only those recipients (and
-- admins) can see the item. When no recipient is set, the existing audience
-- / family logic continues to apply.

create table document_recipients (
  document_id uuid not null references documents(id) on delete cascade,
  profile_id  uuid not null references profiles(id)  on delete cascade,
  primary key (document_id, profile_id)
);
create index on document_recipients (profile_id);

create table photo_recipients (
  photo_id    uuid not null references photos(id)   on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  primary key (photo_id, profile_id)
);
create index on photo_recipients (profile_id);

alter table document_recipients enable row level security;
alter table photo_recipients    enable row level security;

create policy "doc_recipients admin all" on document_recipients
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "doc_recipients self read" on document_recipients
  for select using (profile_id = auth.uid());

create policy "photo_recipients admin all" on photo_recipients
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "photo_recipients self read" on photo_recipients
  for select using (profile_id = auth.uid());

-- Replace the read policies on documents and photos so explicit recipients
-- override the audience-based visibility.
drop policy if exists "doc read" on documents;
create policy "doc read" on documents for select using (
  is_admin(auth.uid())
  or exists (
    select 1 from document_recipients dr
    where dr.document_id = documents.id and dr.profile_id = auth.uid()
  )
  or (
    not exists (select 1 from document_recipients dr where dr.document_id = documents.id)
    and (
      (family_id is null and (
        audience = 'all'
        or (audience = 'parents'  and my_role() in ('parent','admin'))
        or (audience = 'children' and my_role() in ('child','admin'))
      ))
      or family_id in (select my_family_ids())
    )
  )
);

drop policy if exists "photos read" on photos;
create policy "photos read" on photos for select using (
  is_admin(auth.uid())
  or exists (
    select 1 from photo_recipients pr
    where pr.photo_id = photos.id and pr.profile_id = auth.uid()
  )
  or (
    not exists (select 1 from photo_recipients pr where pr.photo_id = photos.id)
    and (
      audience = 'all'
      or (audience = 'parents'  and my_role() in ('parent','admin'))
      or (audience = 'children' and my_role() in ('child','admin'))
    )
  )
);
