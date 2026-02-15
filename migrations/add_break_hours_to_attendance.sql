-- Add break_hours to attendance_records for timesheet (editable by admin per record)
-- This allows per-day customization of break hours when needed

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS break_hours NUMERIC;

COMMENT ON COLUMN attendance_records.break_hours IS 'Break hours for this attendance record (e.g., 1 for 1 hour, 0.5 for 30 minutes). Falls back to work site or category break_hours if null.';
