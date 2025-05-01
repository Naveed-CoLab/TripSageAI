--- Create sample AI trip generation for testing
INSERT INTO ai_trip_generations (
  user_id,
  destination,
  start_date,
  end_date,
  trip_type,
  interests,
  with_pets,
  prompt,
  ai_response,
  generated_trip,
  saved,
  created_at
) VALUES (
  2, -- user ID
  'Tokyo, Japan',
  '2025-06-01',
  '2025-06-07',
  'Solo Trip',
  ARRAY['Food', 'Culture', 'Technology'],
  false,
  'I want to explore Tokyo for a week in June 2025. I love food, culture and technology.',
  'Tokyo is a fascinating destination with incredible food, rich culture, and cutting-edge technology. Here is an itinerary for your trip...',
  '{"days": [{"day": 1, "activities": [{"title": "Visit Tsukiji Outer Market", "description": "Explore the famous food market and try fresh sushi."}, {"title": "Explore Shinjuku", "description": "Visit the bustling district with tall skyscrapers and technology stores."}]}, {"day": 2, "activities": [{"title": "Tokyo National Museum", "description": "Explore Japanese art and cultural artifacts."}, {"title": "Akihabara", "description": "Visit the electronics and anime district."}]}]}',
  false,
  NOW()
);

-- Create sample trip for testing
INSERT INTO my_trips (
  user_id,
  title,
  destination,
  start_date,
  end_date,
  budget,
  preferences,
  status,
  itinerary_data,
  created_at,
  updated_at
) VALUES (
  2,
  'My Tokyo Adventure',
  'Tokyo, Japan',
  '2025-06-01',
  '2025-06-07',
  '2500 USD',
  ARRAY['Food', 'Culture', 'Shopping'],
  'planned',
  '{"days": [{"day": 1, "activities": [{"title": "Visit Senso-ji Temple", "description": "Explore the ancient Buddhist temple in Asakusa."}, {"title": "Shop in Ginza", "description": "Visit the upscale shopping district."}]}, {"day": 2, "activities": [{"title": "Tokyo Disneyland", "description": "Spend the day at the famous theme park."}, {"title": "Dinner in Shibuya", "description": "Try local cuisine in the vibrant district."}]}]}',
  NOW(),
  NOW()
);
