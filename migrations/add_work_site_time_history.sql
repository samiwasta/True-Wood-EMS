-- Add time_in and time_out to work_sites (current/default times).
ALTER TABLE work_sites
  ADD COLUMN IF NOT EXISTS time_in TEXT,
  ADD COLUMN IF NOT EXISTS time_out TEXT;

COMMENT ON COLUMN work_sites.time_in IS 'Current start time (HH:mm) for the project.';
COMMENT ON COLUMN work_sites.time_out IS 'Current end time (HH:mm) for the project.';

-- History of project times so overtime can be calculated correctly for past dates.
-- Each row means: from effective_from onward, this project used these times until the next row.
CREATE TABLE IF NOT EXISTS work_site_time_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_site_id UUID NOT NULL REFERENCES work_sites(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  time_in TEXT,
  time_out TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE work_site_time_history IS 'History of work site time_in/time_out. Used for correct overtime calculation on past attendance dates.';
COMMENT ON COLUMN work_site_time_history.effective_from IS 'Date from which these times apply (inclusive).';

CREATE INDEX IF NOT EXISTS idx_work_site_time_history_lookup
  ON work_site_time_history (work_site_id, effective_from DESC);
