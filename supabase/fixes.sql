-- MalVector Track — RLS fixes discovered during live testing.
-- Run this AFTER schema.sql and seed.sql. Required for the app to work.
-- Full root-cause detail for both fixes is in Testing_Report.docx (TR-1, TR-2).

-- ----------------------------------------------------------------------
-- Fix 1 (TR-1): infinite recursion (Postgres error 42P17) in the
-- profiles table's SELECT policy. The original policy checked admin
-- status via a subquery on profiles itself, which re-triggers the same
-- policy recursively. Fixed by moving the admin check into a
-- SECURITY DEFINER function, which evaluates outside of RLS.
-- ----------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to public
using (
  id = auth.uid() or public.is_admin()
);

-- ----------------------------------------------------------------------
-- Fix 2 (TR-2): disposal_items had SELECT, UPDATE, and an admin-only ALL
-- policy, but no INSERT policy for District Officers — so the API's
-- attempt to auto-create a disposal record on each new distribution
-- cycle was silently rejected. This adds that missing INSERT permission,
-- scoped to the officer's own district.
-- ----------------------------------------------------------------------
create policy "disposal_insert"
on public.disposal_items
for insert
to public
with check (
  exists (
    select 1
    from distribution_cycles dc
    where dc.id = disposal_items.distribution_cycle_id
      and dc.district_id = (select district_id from profiles where id = auth.uid())
  )
  or public.is_admin()
);
