-- Fix infinite recursion in RLS policies on `profiles`.
--
-- The helpers is_admin / my_role / my_family_ids query the `profiles` table.
-- Without SECURITY DEFINER, they run under the caller's RLS, which re-invokes
-- the same policies (which call these helpers again) -> infinite recursion.
-- Postgres aborts the query, so admin listings (e.g. /admin/users) come back
-- empty even though the user is an admin.

create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_family_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from profiles
    where id = auth.uid() and family_id is not null
  union
  select family_id from family_members where profile_id = auth.uid();
$$;

-- These helpers only expose boolean / role / family_id derived from the
-- current user's own identity, so SECURITY DEFINER is safe here.
revoke all on function is_admin(uuid)   from public;
revoke all on function my_role()        from public;
revoke all on function my_family_ids()  from public;
grant execute on function is_admin(uuid)   to authenticated;
grant execute on function my_role()        to authenticated;
grant execute on function my_family_ids()  to authenticated;
