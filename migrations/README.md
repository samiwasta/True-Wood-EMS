# Database Migration: Add is_paid and max_days columns to leave_types

## Quick Fix Instructions

To add the `is_paid` and `max_days` columns to your `leave_types` table, run this SQL in your Supabase SQL Editor:

```sql
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
```

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste the SQL above
5. Click **Run** or press `Ctrl/Cmd + Enter`

## What this migration does:

- **max_days**: Adds an INTEGER column to store the maximum number of days allowed for each leave type per year (optional field)
- **is_paid**: Adds a BOOLEAN column to track whether the leave type is paid (true) or unpaid (false), defaults to `true` for existing records

Both columns will be added safely using `IF NOT EXISTS`, so you can run this migration multiple times without errors.

