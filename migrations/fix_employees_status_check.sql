-- Allow all employee statuses used by the app (employees UI + Resigned).
-- Run in Supabase SQL Editor if the constraint fails on "resigned".

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

ALTER TABLE employees ADD CONSTRAINT employees_status_check
  CHECK (
    status IS NULL
    OR status IN (
      'active',
      'inactive',
      'terminated',
      'released',
      'resigned',
      'transferred'
    )
  );
