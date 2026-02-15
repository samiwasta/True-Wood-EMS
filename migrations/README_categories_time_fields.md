# Categories Time Fields Migration

This migration adds time-related fields to the `categories` table to support timesheet functionality.

## What This Migration Does

Adds three new columns to the `categories` table:
- `time_in` (TEXT): Standard start time in HH:mm format (e.g., '09:00')
- `time_out` (TEXT): Standard end time in HH:mm format (e.g., '18:00')
- `break_hours` (NUMERIC): Standard break hours as a decimal (e.g., 1 for 1 hour, 0.5 for 30 minutes)

## Why These Fields Are Needed

These fields define the standard working hours for each employee category. They are used to:
1. Auto-populate time_in and time_out when marking attendance
2. Calculate working hours for employees in the category
3. Calculate overtime by comparing actual hours against expected hours
4. Display default times in the timesheet

## How to Apply

Run the migration in your Supabase SQL editor or via CLI:

```bash
psql YOUR_DATABASE_URL < migrations/add_time_fields_to_categories.sql
```

Or in Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `add_time_fields_to_categories.sql`
3. Run the query

## Safe to Re-run

This migration uses `IF NOT EXISTS`, so it's safe to run multiple times.
