# Database Migration: Add Employment History and Exit Date

## Quick Fix Instructions

To add the `exit_date` column to the `employees` table and create the `employment_history` table, run this SQL in your Supabase SQL Editor:

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Paste the SQL from `add_employment_history_and_exit_date.sql`
5. Click **Run** or press `Ctrl/Cmd + Enter`

## What this migration does:

### 1. Adds `exit_date` column to `employees` table
- **exit_date**: Adds a DATE column to store when an employee exited/left the organization
- This field is optional and can be NULL for active employees
- Used for tracking termination, release, or transfer dates

### 2. Creates `employment_history` table
- **Purpose**: Tracks all employment periods for employees, including rejoining scenarios
- **Columns**:
  - `id`: Primary key (UUID)
  - `employee_id`: Foreign key reference to employees table
  - `joining_date`: Date when employee joined for this period
  - `exit_date`: Date when employee exited (NULL if still active)
  - `status`: Status of the employment period (active, terminated, released, transferred)
  - `created_at`: Timestamp when record was created
  - `updated_at`: Timestamp when record was last updated (auto-updated via trigger)

### 3. Creates indexes for performance
- Index on `employee_id` for fast lookups
- Index on `joining_date` for date-based queries
- Index on `status` for status-based filtering

### 4. Auto-update trigger
- Automatically updates `updated_at` timestamp when records are modified

## Features:

- **Safe to run multiple times**: Uses `IF NOT EXISTS` and `IF NOT EXISTS` checks
- **Cascade deletion**: When an employee is deleted, their employment history is automatically deleted
- **Automatic tracking**: The application will automatically create history entries when:
  - An employee is created with a joining date
  - An employee's status changes from active to terminated/released/transferred
  - An employee rejoins (status changes back to active)

## Usage:

After running this migration, the application will:
1. Allow setting exit dates when adding/editing employees
2. Automatically track employment history periods
3. Display employment history via the "View History" button in the employees table
