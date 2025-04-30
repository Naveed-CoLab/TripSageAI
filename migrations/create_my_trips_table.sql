-- Create my_trips table to replace trips table
CREATE TABLE IF NOT EXISTS my_trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  budget TEXT,
  preferences TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  itinerary_data JSONB, -- New field to store the entire trip data
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add itinerary_data column to the table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'my_trips' AND column_name = 'itinerary_data'
  ) THEN
    ALTER TABLE my_trips ADD COLUMN itinerary_data JSONB;
  END IF;
END $$;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS my_trips_user_id_idx ON my_trips(user_id);