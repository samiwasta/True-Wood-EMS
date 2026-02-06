-- Add time_in and time_out to attendance_records for timesheet (editable by admin).
-- Values are stored as time strings (e.g. '09:00', '17:30').
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS time_in TEXT,
  ADD COLUMN IF NOT EXISTS time_out TEXT;

COMMENT ON COLUMN attendance_records.time_in IS 'Clock-in time (HH:mm). Default from category or project.';
COMMENT ON COLUMN attendance_records.time_out IS 'Clock-out time (HH:mm). Default from category or project.';
