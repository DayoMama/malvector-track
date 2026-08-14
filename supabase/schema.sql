-- MalVector Track — Database Schema
-- Matches the ERD in System_Design.docx (Section 3)
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ─────────────────────────────────────────────────────────────
-- 1. Districts (reference data)
-- ─────────────────────────────────────────────────────────────
create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null
);

-- ─────────────────────────────────────────────────────────────
-- 2. Profiles (extends Supabase auth.users with role + district)
--    NOTE: the design doc's ERD calls this "users" — it is
--    implemented as "profiles" here, the standard Supabase
--    pattern of a 1:1 table keyed on auth.users(id), since
--    Supabase manages the actual auth.users table itself.
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('officer', 'admin')),
  district_id uuid references districts(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Distribution cycles (FR-2)
-- ─────────────────────────────────────────────────────────────
create table if not exists distribution_cycles (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id),
  intervention_type text not null check (intervention_type in ('ITN', 'IRS')),
  distribution_date date not null,
  quantity integer not null check (quantity > 0),
  households_covered integer not null check (households_covered >= 0),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. Disposal / replacement tracking (FR-3)
--    due_date is computed server-side at insert time — see
--    lib/disposal.js computeDueDate(), TD-2 in Technical Debt Plan
--    (3-year threshold is currently hard-coded for ITNs).
-- ─────────────────────────────────────────────────────────────
create table if not exists disposal_items (
  id uuid primary key default gen_random_uuid(),
  distribution_cycle_id uuid not null references distribution_cycles(id) on delete cascade,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'disposed', 'replaced')),
  action_date date,
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. Insecticide resistance test results (FR-4)
-- ─────────────────────────────────────────────────────────────
create table if not exists resistance_tests (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id),
  vector_species text not null,
  insecticide_class text not null,
  result text not null check (result in ('resistant', 'susceptible', 'possible_resistance')),
  test_date date not null,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes for the dashboard aggregation queries (FR-5)
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_distribution_district on distribution_cycles(district_id);
create index if not exists idx_disposal_due_status on disposal_items(status, due_date);
create index if not exists idx_resistance_district on resistance_tests(district_id);

-- ─────────────────────────────────────────────────────────────
-- Row-Level Security (NFR-2) — enforced at the database layer,
-- not just hidden in the UI. See System_Design.docx Section 2.1.
-- ─────────────────────────────────────────────────────────────
alter table districts enable row level security;
alter table profiles enable row level security;
alter table distribution_cycles enable row level security;
alter table disposal_items enable row level security;
alter table resistance_tests enable row level security;

-- Helper: current user's role and district, read from profiles.
-- (Simple subqueries are used directly in policies below for clarity.)

-- profiles: users can read their own profile; admins can read all
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- districts: any authenticated user can read the district list (needed for dropdowns)
create policy "districts_select_authenticated" on districts
  for select using (auth.role() = 'authenticated');

-- distribution_cycles: officers see/create only rows for their own district; admins see all
create policy "distribution_select" on distribution_cycles
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.district_id = distribution_cycles.district_id)
    )
  );

create policy "distribution_insert" on distribution_cycles
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'officer'
        and p.district_id = distribution_cycles.district_id
        and p.is_active = true
    )
  );

-- disposal_items: scoped via the parent distribution_cycles' district
create policy "disposal_select" on disposal_items
  for select using (
    exists (
      select 1 from distribution_cycles dc
      join profiles p on p.id = auth.uid()
      where dc.id = disposal_items.distribution_cycle_id
        and (p.role = 'admin' or p.district_id = dc.district_id)
    )
  );

create policy "disposal_update" on disposal_items
  for update using (
    exists (
      select 1 from distribution_cycles dc
      join profiles p on p.id = auth.uid()
      where dc.id = disposal_items.distribution_cycle_id
        and p.role = 'officer'
        and p.district_id = dc.district_id
        and p.is_active = true
    )
  );

-- resistance_tests: officers see/create only rows for their own district; admins see all
create policy "resistance_select" on resistance_tests
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.district_id = resistance_tests.district_id)
    )
  );

create policy "resistance_insert" on resistance_tests
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'officer'
        and p.district_id = resistance_tests.district_id
        and p.is_active = true
    )
  );

-- Admin-only override: admins can do everything on the operational tables too.
create policy "distribution_admin_all" on distribution_cycles
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "disposal_admin_all" on disposal_items
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "resistance_admin_all" on resistance_tests
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
