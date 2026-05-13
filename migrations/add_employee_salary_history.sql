CREATE TABLE IF NOT EXISTS employee_salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  salary NUMERIC NOT NULL CHECK (salary >= 0),
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT employee_salary_history_employee_date_unique UNIQUE (employee_id, effective_date)
);

COMMENT ON TABLE employee_salary_history IS 'Tracks salary changes for employees by effective date';
COMMENT ON COLUMN employee_salary_history.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employee_salary_history.salary IS 'Salary amount effective from the effective_date';
COMMENT ON COLUMN employee_salary_history.effective_date IS 'Date from which this salary amount applies';

CREATE INDEX IF NOT EXISTS idx_employee_salary_history_employee_id
  ON employee_salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_history_effective_date
  ON employee_salary_history(effective_date DESC);

CREATE OR REPLACE FUNCTION update_employee_salary_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_employee_salary_history_updated_at ON employee_salary_history;
CREATE TRIGGER trigger_update_employee_salary_history_updated_at
  BEFORE UPDATE ON employee_salary_history
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_salary_history_updated_at();

ALTER TABLE employee_salary_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to employee_salary_history" ON employee_salary_history;
CREATE POLICY "Allow public read access to employee_salary_history"
  ON employee_salary_history
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to employee_salary_history" ON employee_salary_history;
CREATE POLICY "Allow public insert access to employee_salary_history"
  ON employee_salary_history
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to employee_salary_history" ON employee_salary_history;
CREATE POLICY "Allow public update access to employee_salary_history"
  ON employee_salary_history
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

INSERT INTO employee_salary_history (employee_id, salary, effective_date)
SELECT
  id,
  salary,
  COALESCE(joining_date, created_at::date, CURRENT_DATE)
FROM employees
WHERE salary IS NOT NULL
ON CONFLICT (employee_id, effective_date)
DO UPDATE SET
  salary = EXCLUDED.salary,
  updated_at = NOW();
