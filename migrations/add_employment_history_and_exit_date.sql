-- Migration: Add exit_date to employees table and create employment_history table
-- This migration adds exit_date column to employees and creates employment_history table for tracking employment periods

-- Add exit_date column to employees table (if it doesn't exist)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS exit_date DATE;

-- Add a comment to the exit_date column for documentation
COMMENT ON COLUMN employees.exit_date IS 'Date when the employee exited/left the organization (terminated, released, or transferred)';

-- Create employment_history table to track all employment periods
CREATE TABLE IF NOT EXISTS employment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  joining_date DATE NOT NULL,
  exit_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to employment_history table columns
COMMENT ON TABLE employment_history IS 'Tracks employment history periods for employees, including rejoining scenarios';
COMMENT ON COLUMN employment_history.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employment_history.joining_date IS 'Date when the employee joined for this employment period';
COMMENT ON COLUMN employment_history.exit_date IS 'Date when the employee exited for this employment period (NULL if still active)';
COMMENT ON COLUMN employment_history.status IS 'Status of the employment period (active, terminated, released, transferred)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employment_history_employee_id ON employment_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employment_history_joining_date ON employment_history(joining_date);
CREATE INDEX IF NOT EXISTS idx_employment_history_status ON employment_history(status);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on employment_history table
DROP TRIGGER IF EXISTS trigger_update_employment_history_updated_at ON employment_history;
CREATE TRIGGER trigger_update_employment_history_updated_at
  BEFORE UPDATE ON employment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_employment_history_updated_at();
