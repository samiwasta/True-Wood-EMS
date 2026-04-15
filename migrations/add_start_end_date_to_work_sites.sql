-- Project period dates (used by work sites UI and WorkSiteService).
ALTER TABLE work_sites
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

COMMENT ON COLUMN work_sites.start_date IS 'Project start date (optional).';
COMMENT ON COLUMN work_sites.end_date IS 'Project end date (optional).';
