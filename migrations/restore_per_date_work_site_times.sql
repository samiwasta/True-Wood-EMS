-- Restore per-date project times after global work_sites overwrite bug.
-- Run once in Supabase SQL editor.

-- 1. Clear global work_sites times (they must not drive past/future date lookups).
UPDATE work_sites
SET time_in = NULL, time_out = NULL, break_hours = NULL;

-- 2. Restore attendance_records from per-date history (exact date match from Save Attendance dialog).
UPDATE attendance_records ar
SET
  time_in = h.time_in,
  time_out = h.time_out,
  break_hours = h.break_hours
FROM work_site_time_history h
WHERE ar.work_site_id = h.work_site_id
  AND ar.date = h.effective_from::date
  AND ar.status = 'present'
  AND ar.work_site_id IS NOT NULL;

-- 3. Backfill attendance records that still have no times using the correct history row for that date.
UPDATE attendance_records ar
SET
  time_in = sub.time_in,
  time_out = sub.time_out,
  break_hours = sub.break_hours
FROM (
  SELECT DISTINCT ON (ar2.id)
    ar2.id AS attendance_id,
    h.time_in,
    h.time_out,
    h.break_hours
  FROM attendance_records ar2
  JOIN work_site_time_history h
    ON h.work_site_id = ar2.work_site_id
   AND h.effective_from <= ar2.date
  WHERE ar2.status = 'present'
    AND ar2.work_site_id IS NOT NULL
    AND (ar2.time_in IS NULL OR ar2.time_out IS NULL)
  ORDER BY ar2.id, h.effective_from DESC
) sub
WHERE ar.id = sub.attendance_id;
