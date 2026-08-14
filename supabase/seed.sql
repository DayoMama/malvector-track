-- MalVector Track — Synthetic Seed Data
-- Sample data only, disclosed per SRS Section 1.2. Not real NMEP records.
-- Run AFTER schema.sql, and AFTER creating at least one admin + one officer
-- user via Supabase Auth (email/password) — then update the profiles insert
-- below with their real auth.users id values.
insert into districts (name, region) values
  ('Ga West', 'Greater Accra'),
  ('Kumasi Metro', 'Ashanti'),
  ('Tamale Metro', 'Northern'),
  ('Cape Coast Metro', 'Central'),
  ('Sunyani Municipal', 'Bono')
on conflict (name) do nothing;

-- Example profile rows — replace the uuids with real auth.users ids
-- created via Supabase Auth (Dashboard > Authentication > Users),
-- then run these inserts.
insert into profiles (id, email, role, district_id, is_active) values
  ('e673249f-c2c9-4d48-968f-8350bdb37d62', 'aodanquah@nmep.gov.gh', 'admin', null, true),
  ('3cec06ae-a64b-4188-8bad-00c913620771', 'obenewaayirenkyi@nmep.gov.gh', 'officer',
    (select id from districts where name = 'Ga West'), true);

-- Sample distribution cycle
insert into distribution_cycles (district_id, intervention_type, distribution_date, quantity, households_covered, created_by)
values (
  (select id from districts where name = 'Ga West'),
  'ITN', '2023-06-01', 5000, 4200,
  '3cec06ae-a64b-4188-8bad-00c913620771'
);