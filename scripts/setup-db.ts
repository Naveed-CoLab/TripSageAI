import { pool, query } from "../server/db";
// No need to import schema models since we're using raw SQL

async function main() {
  try {
    console.log("Starting database setup...");
    
    // Create all tables defined in the schema
    console.log("Creating database tables...");
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image TEXT,
        bio TEXT,
        phone TEXT,
        google_id TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created users table");
    
    // Create user_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'en',
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        currency TEXT DEFAULT 'USD',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created user_settings table");
    
    // Create my_trips table
    await query(`
      CREATE TABLE IF NOT EXISTS my_trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        budget TEXT,
        budget_is_estimated BOOLEAN DEFAULT false,
        preferences TEXT[],
        status TEXT NOT NULL DEFAULT 'draft',
        itinerary_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created my_trips table");
    
    // Create destinations table
    await query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        rating TEXT,
        review_count INTEGER,
        price_estimate TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created destinations table");
    
    // Create analytics table
    await query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        data JSON,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created analytics table");
    
    // Create admin_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created admin_logs table");
    
    // Create ai_trip_generations table
    await query(`
      CREATE TABLE IF NOT EXISTS ai_trip_generations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        destination TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        trip_type TEXT,
        interests TEXT[],
        with_pets BOOLEAN DEFAULT false,
        prompt TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        generated_trip JSONB,
        saved BOOLEAN DEFAULT false,
        saved_trip_id INTEGER REFERENCES my_trips(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created ai_trip_generations table");
    
    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER NOT NULL,
        images TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        is_approved BOOLEAN DEFAULT true,
        helpful_count INTEGER DEFAULT 0,
        report_count INTEGER DEFAULT 0
      )
    `);
    console.log("✓ Created reviews table");
    
    // Create flight_searches table
    await query(`
      CREATE TABLE IF NOT EXISTS flight_searches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        origin_location_code TEXT NOT NULL,
        destination_location_code TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        return_date TEXT,
        adults INTEGER NOT NULL DEFAULT 1,
        children INTEGER DEFAULT 0,
        infants INTEGER DEFAULT 0,
        travel_class TEXT DEFAULT 'ECONOMY',
        trip_type TEXT DEFAULT 'ONE_WAY',
        max_price INTEGER,
        currency_code TEXT DEFAULT 'USD',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created flight_searches table");
    
    // Create wishlist_items table
    await query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_image TEXT,
        additional_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created wishlist_items table");
    
    // Create flight_bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS flight_bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        flight_number TEXT NOT NULL,
        airline TEXT NOT NULL,
        departure_airport TEXT NOT NULL,
        departure_code TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_airport TEXT NOT NULL,
        arrival_code TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        trip_type TEXT NOT NULL,
        return_flight_number TEXT,
        return_airline TEXT,
        return_departure_time TEXT,
        return_arrival_time TEXT,
        booking_reference TEXT NOT NULL,
        price NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'confirmed',
        cabin_class TEXT NOT NULL DEFAULT 'ECONOMY',
        passenger_name TEXT,
        passenger_email TEXT,
        passenger_phone TEXT,
        flight_details JSON,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created flight_bookings table");
    
    // Create hotel_searches table
    await query(`
      CREATE TABLE IF NOT EXISTS hotel_searches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        location TEXT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER NOT NULL DEFAULT 1,
        rooms INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created hotel_searches table");
    
    // Create hotel_bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS hotel_bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        hotel_id TEXT NOT NULL,
        hotel_name TEXT NOT NULL,
        hotel_image TEXT,
        hotel_address TEXT NOT NULL,
        hotel_city TEXT NOT NULL,
        hotel_country TEXT NOT NULL,
        hotel_rating NUMERIC(3,1),
        room_type TEXT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER NOT NULL DEFAULT 1,
        rooms INTEGER NOT NULL DEFAULT 1,
        price NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        booking_reference TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT,
        special_requests TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created hotel_bookings table");
    
    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        admin_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        link TEXT,
        valid_until TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created notifications table");
    
    // Create booking_approvals table
    await query(`
      CREATE TABLE IF NOT EXISTS booking_approvals (
        id SERIAL PRIMARY KEY,
        booking_type TEXT NOT NULL,
        booking_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_id INTEGER REFERENCES users(id),
        admin_notes TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created booking_approvals table");
    
    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup
main();