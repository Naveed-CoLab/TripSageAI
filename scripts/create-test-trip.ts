import { pool, query } from "../server/db";

async function createTestTrip() {
  try {
    // Check if we have an admin user
    const userResult = await query("SELECT id FROM users WHERE username = 'admin'");
    
    if (userResult.rows.length === 0) {
      console.error("Admin user not found. Please run the create-admin.ts script first.");
      return;
    }
    
    const userId = userResult.rows[0].id;
    
    // Create a sample trip
    const tripData = {
      user_id: userId,
      title: "Test Trip to Paris",
      destination: "Paris, France",
      start_date: "2025-06-01",
      end_date: "2025-06-07",
      budget: "2000",
      budget_is_estimated: true,
      preferences: ["Food", "Culture", "History"],
      status: "planned",
      itinerary_data: JSON.stringify({
        days: [
          {
            dayNumber: 1,
            title: "Arrival & Eiffel Tower",
            activities: [
              {
                title: "Check-in at Hotel",
                time: "14:00",
                location: "Montmartre",
                type: "accommodation"
              },
              {
                title: "Visit Eiffel Tower",
                time: "17:00",
                location: "Champ de Mars",
                type: "attraction"
              },
              {
                title: "Dinner at Le Jules Verne",
                time: "19:30",
                location: "Eiffel Tower",
                type: "food"
              }
            ]
          },
          {
            dayNumber: 2,
            title: "Museums & Seine",
            activities: [
              {
                title: "Visit Louvre Museum",
                time: "10:00",
                location: "Rue de Rivoli",
                type: "attraction"
              },
              {
                title: "Lunch at Café Marly",
                time: "13:30",
                location: "Louvre",
                type: "food"
              },
              {
                title: "Seine River Cruise",
                time: "16:00",
                location: "Seine River",
                type: "activity"
              }
            ]
          }
        ],
        bookings: [
          {
            type: "hotel",
            title: "Hôtel Particulier Montmartre",
            provider: "Booking.com",
            price: "1200€"
          },
          {
            type: "activity",
            title: "Skip-the-line Eiffel Tower Ticket",
            provider: "GetYourGuide",
            price: "45€"
          },
          {
            type: "activity",
            title: "Seine River Cruise",
            provider: "Bateaux Parisiens",
            price: "35€"
          }
        ]
      })
    };
    
    // Insert trip
    const insertQuery = `
      INSERT INTO my_trips (
        user_id, title, destination, start_date, end_date, 
        budget, budget_is_estimated, preferences, status, itinerary_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING id
    `;
    
    const values = [
      tripData.user_id,
      tripData.title,
      tripData.destination,
      tripData.start_date,
      tripData.end_date,
      tripData.budget,
      tripData.budget_is_estimated,
      tripData.preferences,
      tripData.status,
      tripData.itinerary_data
    ];
    
    const result = await query(insertQuery, values);
    const tripId = result.rows[0].id;
    
    console.log(`Test trip created successfully with ID: ${tripId}`);
    
  } catch (error) {
    console.error("Error creating test trip:", error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

createTestTrip();