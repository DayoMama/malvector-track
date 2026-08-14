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
--
-- insert into profiles (id, email, role, district_id, is_active) values
--   ('<admin-auth-uid>', 'admin@nmep.example', 'admin', null, true),
--   ('<officer-auth-uid>', 'officer.gawest@nmep.example', 'officer',
--     (select id from districts where name = 'Ga West'), true);

-- Sample distribution cycles (uncomment and adjust created_by after profiles exist)
--
-- insert into distribution_cycles (district_id, intervention_type, distribution_date, quantity, households_covered, created_by)
-- values (
--   (select id from districts where name = 'Ga West'),
--   'ITN', '2023-06-01', 5000, 4200,
--   '<officer-auth-uid>'
-- );
