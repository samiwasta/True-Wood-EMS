-- Migration: Add is_paid and max_days columns to leave_types table
-- This migration adds the is_paid boolean column and ensures max_days column exists

-- Add max_days column to leave_types table (if it doesn't exist)
ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS max_days INTEGER;

-- Add a comment to the max_days column for documentation
COMMENT ON COLUMN leave_types.max_days IS 'Maximum number of days allowed for this leave type per year';

-- Add is_paid column to leave_types table (if it doesn't exist)
ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;

-- Add a comment to the is_paid column for documentation
COMMENT ON COLUMN leave_types.is_paid IS 'Indicates whether the leave type is paid (true) or unpaid (false)';

-- Optional: Update existing records to have default values
-- Uncomment the lines below if you want to set default values for existing leave types
-- UPDATE leave_types SET is_paid = true WHERE is_paid IS NULL;

