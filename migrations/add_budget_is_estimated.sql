-- Add the budget_is_estimated column to my_trips table
ALTER TABLE my_trips ADD COLUMN IF NOT EXISTS budget_is_estimated BOOLEAN DEFAULT FALSE;