-- MalVector Track — one-time backfill.
-- Run this ONCE, AFTER fixes.sql, if you have distribution_cycles rows
-- that were created before Fix 2 in fixes.sql. It creates the
-- disposal_items row that should have been created automatically at the
-- time, for every distribution_cycle that's currently missing one.
-- Safe to run more than once — only inserts rows that don't already exist.

insert into disposal_items (distribution_cycle_id, due_date, status)
select
  dc.id,
  (dc.distribution_date + (case when dc.intervention_type = 'ITN' then interval '3 years' else interval '1 year' end))::date,
  'pending'
from distribution_cycles dc
left join disposal_items di on di.distribution_cycle_id = dc.id
where di.id is null;
