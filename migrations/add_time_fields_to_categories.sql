-- Add time_in, time_out, and break_hours to categories table
-- These fields define the standard working hours for employees in each category

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS time_in TEXT,
  ADD COLUMN IF NOT EXISTS time_out TEXT,
  ADD COLUMN IF NOT EXISTS break_hours NUMERIC;

COMMENT ON COLUMN categories.time_in IS 'Standard start time (HH:mm) for this category.';
COMMENT ON COLUMN categories.time_out IS 'Standard end time (HH:mm) for this category.';
COMMENT ON COLUMN categories.break_hours IS 'Standard break hours for this category (e.g., 1 for 1 hour, 0.5 for 30 minutes).';
