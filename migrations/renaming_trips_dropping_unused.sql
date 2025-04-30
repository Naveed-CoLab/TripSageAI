-- Rename trips table to my_trips
ALTER TABLE trips RENAME TO my_trips;

-- Drop unused tables
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS trip_days CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS ai_prompts CASCADE;
DROP TABLE IF EXISTS ai_conversation_logs CASCADE;