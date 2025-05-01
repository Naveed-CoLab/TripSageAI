import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateTripIdea, generateItinerary, chatWithAI } from "./gemini-service";
import { searchFlights, searchAirports, getAirlineInfo } from "./services/amadeus";
import { hotelService } from "./services/hotels";
import { mapsService } from "./services/maps";
import tripAdvisorApi from "./services/tripAdvisorService";
import { pool, query, transaction } from "./db";
import { 
  myTrips, 
  insertTripSchema, 
  insertReviewSchema,
  insertUserSettingsSchema
} from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Crypto helpers for password hashing and comparison
const scryptAsync = promisify(scrypt);

async function scryptHash(password: string, salt: string): Promise<string> {
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return buf.toString("hex");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User profile routes
  app.put("/api/user/profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { firstName, lastName, email } = req.body;
      
      // Create an update object with only the provided fields
      const updateData: Record<string, any> = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      // If email is being changed, check if it's already in use
      if (email !== undefined && email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateData.email = email;
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Password change endpoint
  app.put("/api/user/password", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, req.user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the password
      const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ message: "Password updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userTrips = await storage.getTripsByUserId(req.user.id);
      res.json(userTrips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this trip" });
      }
      
      // Check for itinerary_data field (from SQL query)
      if (trip.itinerary_data) {
        // Parse the itinerary data JSON and add days and bookings properties to trip
        const itineraryData = typeof trip.itinerary_data === 'string' 
          ? JSON.parse(trip.itinerary_data) 
          : trip.itinerary_data;
          
        // Merge itinerary data with trip object 
        const tripWithDetails = {
          ...trip,
          days: itineraryData.days || [],
          bookings: itineraryData.bookings || [],
        };
        
        // Remove the raw itinerary_data field to avoid duplication
        delete tripWithDetails.itinerary_data;
        
        return res.json(tripWithDetails);
      } else if (trip.itineraryData) {
        // Handle case when using Drizzle property naming
        const itineraryData = typeof trip.itineraryData === 'string'
          ? JSON.parse(trip.itineraryData)
          : trip.itineraryData;
          
        // Merge itinerary data with trip object
        const tripWithDetails = {
          ...trip,
          days: itineraryData.days || [],
          bookings: itineraryData.bookings || [],
        };
        
        // Remove the raw itineraryData field to avoid duplication
        delete tripWithDetails.itineraryData;
        
        return res.json(tripWithDetails);
      }
      
      // If no itinerary data, return trip with empty arrays
      res.json({
        ...trip,
        days: [],
        bookings: []
      });
    } catch (error) {
      console.error("Error fetching trip details:", error);
      res.status(500).json({ message: "Failed to fetch trip details" });
    }
  });

  app.post("/api/trips", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const tripData = insertTripSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newTrip = await storage.createTrip(tripData);
      res.status(201).json(newTrip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.put("/api/trips/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const tripId = parseInt(req.params.id);
      const existingTrip = await storage.getTripById(tripId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (existingTrip.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
      
      const tripData = insertTripSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const updatedTrip = await storage.updateTrip(tripId, tripData);
      res.json(updatedTrip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  app.delete("/api/trips/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const tripId = parseInt(req.params.id);
      const existingTrip = await storage.getTripById(tripId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (existingTrip.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this trip" });
      }
      
      await storage.deleteTrip(tripId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Trip days, activities, and bookings routes removed as these tables no longer exist

  // Destinations
  app.get("/api/destinations", async (req: Request, res: Response) => {
    try {
      const destinations = await storage.getAllDestinations();
      res.json(destinations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  app.get("/api/destinations/:id", async (req: Request, res: Response) => {
    try {
      const destinationId = parseInt(req.params.id);
      const destination = await storage.getDestinationById(destinationId);
      
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      
      res.json(destination);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch destination" });
    }
  });
  
  // AI Trip Generation Routes
  app.post("/api/ai-trips", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get userId from req.user instead of session
    const userId = (req.user as any).id;
    
    try {
      const { destination, startDate, endDate, tripType, interests, withPets } = req.body;
      
      if (!destination) {
        return res.status(400).json({ error: 'Destination is required' });
      }
      
      // Build the prompt for Gemini
      const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
      const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
      
      const interestsStr = interests?.length > 0 ? interests.join(', ') : 'general tourism';
      const tripTypeStr = tripType || 'Solo Trip';
      const withPetsStr = withPets ? 'with pets' : 'without pets';
      
      const dateRangeStr = startDateStr && endDateStr 
        ? `from ${startDateStr} to ${endDateStr}` 
        : 'with flexible dates';
      
      const prompt = `
        Create a detailed day-by-day itinerary for a ${tripTypeStr.toLowerCase()} to ${destination} ${dateRangeStr}.
        The traveler is interested in: ${interestsStr}.
        This is a trip ${withPetsStr}.
        
        Format your response as a JSON object with the following structure:
        {
          "days": [
            {
              "dayNumber": 1,
              "title": "Day 1: Arrival & Orientation",
              "activities": [
                {
                  "title": "Activity name",
                  "description": "Brief description",
                  "time": "Approximate time (e.g., '9:00 AM')",
                  "location": "Location name",
                  "type": "Type of activity (e.g., 'sightseeing', 'meal', 'transportation')"
                }
              ]
            }
          ],
          "bookings": [
            {
              "type": "Type of booking (hotel, flight, activity)",
              "title": "Name of the booking",
              "provider": "Service provider name",
              "price": "Estimated price",
              "details": { "Additional details": "as needed" }
            }
          ]
        }
        
        Include approximately 3-5 activities per day.
        For bookings, include at least one accommodation option, transportation options if applicable, and key attractions that require booking.
      `;
      
      // Call Gemini API to generate itinerary
      const generatedTrip = await generateItinerary({
        id: 0,
        userId,
        title: `Trip to ${destination}`,
        destination,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        budget: null,
        preferences: interests || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Store the AI generation data in the database using parameterized query
      const result = await query(
        `INSERT INTO ai_trip_generations 
         (user_id, destination, start_date, end_date, trip_type, interests, with_pets, prompt, ai_response, generated_trip, saved) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING id`,
        [
          userId,
          destination,
          startDateStr ? new Date(startDateStr) : null,
          endDateStr ? new Date(endDateStr) : null,
          tripType,
          interests || [],
          withPets || false,
          prompt,
          JSON.stringify(generatedTrip), // Store the raw AI response
          JSON.stringify(generatedTrip), // Store the parsed trip data
          false
        ]
      );
      
      const generationId = result.rows[0].id;
      
      res.json({
        id: generationId,
        destination,
        startDate: startDateStr,
        endDate: endDateStr,
        tripType,
        interests,
        withPets,
        generatedTrip
      });
      
    } catch (error) {
      console.error('Error generating AI trip:', error);
      res.status(500).json({ error: 'Failed to generate trip. Please try again.' });
    }
  });
  
  // Save AI generated trip
  app.post("/api/ai-trips/:id/save", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get userId from req.user instead of session
    const userId = (req.user as any).id;
    const generationId = parseInt(req.params.id);
    
    try {
      // Get the AI trip generation
      const result = await query(
        'SELECT * FROM ai_trip_generations WHERE id = $1 AND user_id = $2',
        [generationId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'AI trip generation not found' });
      }
      
      const generation = result.rows[0];
      const generatedTrip = generation.generated_trip;
      
      // Begin transaction
      await query('BEGIN');
      
      // Create the trip in my_trips table with data from the AI generation
      const tripResult = await query(
        `INSERT INTO my_trips
         (user_id, title, destination, start_date, end_date, preferences, status, itinerary_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          `Trip to ${generation.destination}`,
          generation.destination,
          generation.start_date,
          generation.end_date,
          generation.interests,
          'planned',
          JSON.stringify(generatedTrip) // Store the full itinerary as JSON
        ]
      );
      
      const tripId = tripResult.rows[0].id;
      
      // Update the AI trip generation to mark it as saved
      await query(
        `UPDATE ai_trip_generations
         SET saved = TRUE, saved_trip_id = $1
         WHERE id = $2`,
        [tripId, generationId]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      res.json({ 
        success: true, 
        tripId,
        message: 'Trip saved successfully'
      });
      
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      
      console.error('Error saving AI trip:', error);
      res.status(500).json({ error: 'Failed to save trip. Please try again.' });
    }
  });
  
  // Get all AI trip generations for current user
  app.get("/api/ai-trips", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get userId from req.user instead of session
    const userId = (req.user as any).id;
    
    try {
      const result = await query(
        `SELECT * FROM ai_trip_generations 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      
      res.json(result.rows);
      
    } catch (error) {
      console.error('Error fetching AI trips:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get single AI trip generation
  app.get("/api/ai-trips/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get userId from req.user instead of session
    const userId = (req.user as any).id;
    const generationId = parseInt(req.params.id);
    
    try {
      const result = await query(
        `SELECT * FROM ai_trip_generations 
         WHERE id = $1 AND user_id = $2`,
        [generationId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'AI trip generation not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      console.error('Error fetching AI trip:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Flight search APIs using Amadeus
  app.get("/api/airports/search", async (req: Request, res: Response) => {
    try {
      const { keyword } = req.query;
      
      if (!keyword || typeof keyword !== 'string' || keyword.length < 2) {
        return res.status(400).json({ message: "Keyword parameter is required and must be at least 2 characters" });
      }
      
      const airports = await searchAirports(keyword);
      res.json(airports);
    } catch (error) {
      console.error("Error searching airports:", error);
      res.status(500).json({ message: "Failed to search airports", error: (error as Error).message });
    }
  });
  
  app.get("/api/airlines/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ message: "Airline code is required" });
      }
      
      const airline = await getAirlineInfo(code);
      res.json(airline);
    } catch (error) {
      console.error("Error getting airline info:", error);
      res.status(500).json({ message: "Failed to get airline information", error: (error as Error).message });
    }
  });
  
  // Get flight search history for the current user
  app.get("/api/flights/history", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view flight search history" });
      }
      
      const userId = req.user!.id;
      const searchHistory = await storage.getFlightSearchesByUserId(userId);
      
      res.json(searchHistory);
    } catch (error) {
      console.error("Error fetching flight search history:", error);
      res.status(500).json({ 
        message: "Failed to fetch flight search history", 
        error: (error as Error).message 
      });
    }
  });
  
  // Save flight search to history (dedicated endpoint)
  app.post("/api/flights/history", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to save flight search history" });
      }
      
      const userId = req.user!.id;
      const { 
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults = 1,
        children,
        infants,
        travelClass,
        tripType = "ONE_WAY",
        maxPrice,
        currencyCode
      } = req.body;
      
      // Validate required parameters
      if (!originLocationCode || !destinationLocationCode || !departureDate) {
        return res.status(400).json({ 
          message: "Missing required parameters", 
          required: ["originLocationCode", "destinationLocationCode", "departureDate"] 
        });
      }
      
      // Create the flight search record
      const flightSearch = await storage.createFlightSearch({
        userId,
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children: children || 0,
        infants: infants || 0,
        travelClass,
        tripType,
        maxPrice,
        currencyCode
      });
      
      res.status(201).json(flightSearch);
    } catch (error) {
      console.error("Error saving flight search:", error);
      res.status(500).json({ 
        message: "Failed to save flight search", 
        error: (error as Error).message 
      });
    }
  });
  
  // Delete a flight search from history
  app.delete("/api/flights/history/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete flight search history" });
      }
      
      const searchId = parseInt(req.params.id);
      await storage.deleteFlightSearch(searchId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting flight search:", error);
      res.status(500).json({ 
        message: "Failed to delete flight search", 
        error: (error as Error).message 
      });
    }
  });
  
  // Wishlist routes
  app.get("/api/wishlist", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your wishlist" });
      }
      
      const userId = req.user!.id;
      const wishlistItems = await storage.getWishlistItemsByUserId(userId);
      
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ 
        message: "Failed to fetch wishlist items", 
        error: (error as Error).message 
      });
    }
  });
  
  app.post("/api/wishlist", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to add items to your wishlist" });
      }
      
      const userId = req.user!.id;
      const { itemType, itemId, itemName, itemImage, additionalData } = req.body;
      
      // Check if this item is already in the user's wishlist
      const existingItem = await storage.getWishlistItemByTypeAndId(userId, itemType, itemId);
      
      if (existingItem) {
        return res.status(200).json(existingItem); // Item already exists, return it
      }
      
      // Create a new wishlist item
      const newItem = await storage.createWishlistItem({
        userId,
        itemType,
        itemId,
        itemName,
        itemImage,
        additionalData
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error adding item to wishlist:", error);
      res.status(500).json({ 
        message: "Failed to add item to wishlist", 
        error: (error as Error).message 
      });
    }
  });
  
  app.delete("/api/wishlist/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to remove items from your wishlist" });
      }
      
      const userId = req.user!.id;
      const itemId = parseInt(req.params.id);
      
      // Get the wishlist item to verify ownership
      const item = await storage.getWishlistItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to delete this wishlist item" });
      }
      
      await storage.deleteWishlistItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      res.status(500).json({ 
        message: "Failed to remove item from wishlist", 
        error: (error as Error).message 
      });
    }
  });

  // Search for flights and save the search to history for logged-in users
  app.post("/api/flights/search", async (req: Request, res: Response) => {
    try {
      const { 
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults = 1,
        children,
        infants,
        travelClass,
        currencyCode,
        maxPrice,
        tripType = "ONE_WAY",
        max = 50
      } = req.body;
      
      // Validate required parameters
      if (!originLocationCode || !destinationLocationCode || !departureDate) {
        return res.status(400).json({ 
          message: "Missing required parameters", 
          required: ["originLocationCode", "destinationLocationCode", "departureDate"] 
        });
      }
      
      // Validate date format (should be YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate) || (returnDate && !dateRegex.test(returnDate))) {
        return res.status(400).json({ 
          message: "Invalid date format. Use YYYY-MM-DD format" 
        });
      }
      
      // Search flights
      const flightOffers = await searchFlights({
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass, 
        currencyCode,
        maxPrice,
        max
      });
      
      // Save search to history if user is logged in 
      // This happens regardless of whether the flight search API call succeeds
      try {
        if (req.isAuthenticated()) {
          const userId = req.user!.id;
          await storage.createFlightSearch({
            userId,
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
            adults,
            children: children || 0,
            infants: infants || 0,
            travelClass,
            tripType,
            maxPrice,
            currencyCode
          });
        }
      } catch (dbError) {
        console.error("Error saving flight search history:", dbError);
        // Continue to return flight results even if saving to history fails
      }
      
      res.json(flightOffers);
    } catch (error) {
      console.error("Error searching flights:", error);
      res.status(500).json({ 
        message: "Failed to search flights", 
        error: (error as Error).message 
      });
    }
  });
  
  // AI trip generation routes
  app.post("/api/ai/trip-idea", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { destination, preferences, duration } = req.body;
      
      if (!destination) {
        return res.status(400).json({ message: "Destination is required" });
      }
      
      const tripIdea = await generateTripIdea(destination, preferences, duration);
      res.json({ tripIdea });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate trip idea" });
    }
  });

  app.post("/api/ai/estimate-budget", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { tripId } = req.body;
      
      if (!tripId) {
        return res.status(400).json({ message: "Trip ID is required" });
      }
      
      // Fetch trip details
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Calculate estimated budget based on destination, duration, and preferences
      const destination = trip.destination;
      const duration = trip.days?.length || 
                      (trip.startDate && trip.endDate ? 
                       Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
                       4);
      
      // Define budget ranges for different expense categories
      const accommodationDaily = destination.toLowerCase().includes('spain') ? 
        { min: 80, max: 150 } : { min: 70, max: 130 };
      
      const foodDaily = { min: 30, max: 60 };
      const transportationDaily = { min: 15, max: 30 };
      const attractionsDaily = { min: 20, max: 40 };
      const miscDaily = { min: 10, max: 20 };
      
      // Calculate total estimated budget
      const minBudget = Math.round(duration * (
        accommodationDaily.min + 
        foodDaily.min + 
        transportationDaily.min + 
        attractionsDaily.min + 
        miscDaily.min
      ));
      
      const maxBudget = Math.round(duration * (
        accommodationDaily.max + 
        foodDaily.max + 
        transportationDaily.max + 
        attractionsDaily.max + 
        miscDaily.max
      ));
      
      // Format the budget as a string
      const estimatedBudget = `$${minBudget} - $${maxBudget}`;
      
      // Update the trip with the estimated budget if not already set
      if (!trip.budget) {
        await storage.updateTrip(tripId, { 
          budget: estimatedBudget,
          budgetIsEstimated: true
        });
      }
      
      res.json({ 
        estimatedBudget,
        breakdown: {
          accommodation: `$${accommodationDaily.min * duration} - $${accommodationDaily.max * duration}`,
          food: `$${foodDaily.min * duration} - $${foodDaily.max * duration}`,
          transportation: `$${transportationDaily.min * duration} - $${transportationDaily.max * duration}`,
          attractions: `$${attractionsDaily.min * duration} - $${attractionsDaily.max * duration}`,
          misc: `$${miscDaily.min * duration} - $${miscDaily.max * duration}`
        }
      });
    } catch (error) {
      console.error("Error estimating trip budget:", error);
      res.status(500).json({ message: "Failed to estimate trip budget" });
    }
  });

  app.post("/api/ai/generate-itinerary", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { tripId } = req.body;
      
      if (!tripId) {
        return res.status(400).json({ message: "Trip ID is required" });
      }
      
      const trip = await storage.getTripById(parseInt(tripId));
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this trip" });
      }
      
      // Generate itinerary - this will now use fallback data if API key is missing
      const itinerary = await generateItinerary(trip);
      
      try {
        // Check if the trip already has days/activities before adding new ones
        const existingDays = await storage.getTripDaysByTripId(trip.id);
        if (existingDays.length > 0) {
          // Delete existing days and their activities before adding new ones
          for (const day of existingDays) {
            const activities = await storage.getActivitiesByTripDayId(day.id);
            for (const activity of activities) {
              await storage.deleteActivity(activity.id);
            }
            await storage.deleteTripDay(day.id);
          }
        }
        
        // Delete existing bookings before adding new ones
        const existingBookings = await storage.getBookingsByTripId(trip.id);
        for (const booking of existingBookings) {
          await storage.deleteBooking(booking.id);
        }
        
        // Process and save the generated itinerary
        for (const day of itinerary.days) {
          const dateString = day.date instanceof Date ? day.date.toISOString() : day.date;
          
          const tripDay = await storage.createTripDay({
            tripId: trip.id,
            dayNumber: day.dayNumber,
            title: day.title,
            date: dateString
          });
          
          for (const activity of day.activities) {
            await storage.createActivity({
              tripDayId: tripDay.id,
              title: activity.title,
              description: activity.description,
              time: activity.time,
              location: activity.location,
              type: activity.type
            });
          }
        }
        
        // Save bookings if any
        if (itinerary.bookings && itinerary.bookings.length > 0) {
          for (const booking of itinerary.bookings) {
            await storage.createBooking({
              tripId: trip.id,
              type: booking.type,
              title: booking.title,
              provider: booking.provider,
              price: booking.price,
              details: booking.details,
              confirmed: false
            });
          }
        }
        
        // Update trip status
        await storage.updateTrip(trip.id, {
          ...trip,
          status: "planned"
        });
        
        // Get updated trip data
        const updatedTrip = await storage.getTripById(trip.id);
        const tripDays = await storage.getTripDaysByTripId(trip.id);
        const bookings = await storage.getBookingsByTripId(trip.id);
        
        // Combine trip days with their activities for the response
        const daysWithActivities = await Promise.all(
          tripDays.map(async (day) => {
            const activities = await storage.getActivitiesByTripDayId(day.id);
            return { ...day, activities };
          })
        );
        
        // Send the complete trip data
        res.json({
          ...updatedTrip,
          days: daysWithActivities,
          bookings
        });
      } catch (dbError) {
        console.error("Error saving itinerary data:", dbError);
        res.status(500).json({ 
          message: "Error occurred while saving itinerary",
          itinerary: itinerary // Return the generated itinerary even if saving failed
        });
      }
    } catch (error) {
      console.error("Error in itinerary generation:", error);
      res.status(500).json({ message: "Failed to generate itinerary" });
    }
  });

  // Review endpoints
  app.get("/api/reviews/:targetType/:targetId", async (req: Request, res: Response) => {
    try {
      const { targetType, targetId } = req.params;
      
      if (!targetType || !targetId) {
        return res.status(400).json({ message: "Target type and ID are required" });
      }
      
      const reviews = await storage.getReviewsByTargetTypeAndId(targetType, targetId);
      
      // For each review, fetch the author's username
      const reviewsWithAuthor = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            authorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Anonymous',
          };
        })
      );
      
      res.json(reviewsWithAuthor);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to post a review" });
      }
      
      const userId = req.user!.id;
      const reviewData = req.body;
      
      const review = await storage.createReview({
        ...reviewData,
        userId,
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  app.put("/api/reviews/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update a review" });
      }
      
      const reviewId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if the review exists and belongs to the user
      const existingReview = await storage.getReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own reviews" });
      }
      
      const updatedReview = await storage.updateReview(reviewId, req.body);
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });
  
  app.delete("/api/reviews/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a review" });
      }
      
      const reviewId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if the review exists and belongs to the user
      const existingReview = await storage.getReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own reviews" });
      }
      
      await storage.deleteReview(reviewId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });
  
  app.post("/api/reviews/:id/helpful", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      
      const review = await storage.markReviewHelpful(reviewId);
      res.json(review);
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      res.status(500).json({ message: "Failed to mark review as helpful" });
    }
  });
  
  app.post("/api/reviews/:id/report", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      
      const review = await storage.reportReview(reviewId);
      res.json(review);
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({ message: "Failed to report review" });
    }
  });

  // Flight bookings
  app.post("/api/flight-bookings", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to book flights" });
      }

      // Print raw request data for debugging
      console.log("Raw booking data received:", JSON.stringify(req.body, null, 2));
      console.log("User authenticated:", req.isAuthenticated(), "User ID:", req.user?.id);
      
      // Create a new booking object with initial status set to pending for admin approval
      const bookingData = {
        userId: req.user!.id,
        flightNumber: req.body.flightNumber,
        airline: req.body.airline,
        departureAirport: req.body.departureAirport,
        departureCode: req.body.departureCode,
        departureTime: req.body.departureTime || new Date().toISOString(),
        arrivalAirport: req.body.arrivalAirport,
        arrivalCode: req.body.arrivalCode,
        arrivalTime: req.body.arrivalTime || new Date().toISOString(),
        tripType: req.body.tripType,
        returnFlightNumber: req.body.returnFlightNumber || null,
        returnAirline: req.body.returnAirline || null,
        returnDepartureTime: req.body.returnDepartureTime || null,
        returnArrivalTime: req.body.returnArrivalTime || null,
        bookingReference: req.body.bookingReference || `FLT-${Date.now()}`,
        price: req.body.price,
        currency: req.body.currency || "USD",
        status: "pending", // Always start with pending status for admin approval
        cabinClass: req.body.cabinClass || "ECONOMY",
        passengerName: req.body.passengerName,
        passengerEmail: req.body.passengerEmail,
        passengerPhone: req.body.passengerPhone,
        flightDetails: req.body.flightDetails || {}
      };
      
      console.log("Processing flight booking with approval flow:", JSON.stringify(bookingData, null, 2));
      
      // Use direct client connection with manual transaction control
      let newBooking;
      const client = await pool.connect();
      
      try {
        // Start transaction
        await client.query('BEGIN');
        
        // Create the flight booking using raw SQL
        const bookingSql = `
          INSERT INTO flight_bookings (
            user_id, flight_number, airline, departure_airport, departure_code, departure_time,
            arrival_airport, arrival_code, arrival_time, trip_type, 
            return_flight_number, return_airline, return_departure_time, return_arrival_time, 
            booking_reference, price, currency, status, cabin_class, 
            passenger_name, passenger_email, passenger_phone, flight_details,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, $16, $17, $18, $19, 
            $20, $21, $22, $23, NOW(), NOW()
          ) RETURNING *`;
          
        const bookingValues = [
          bookingData.userId,
          bookingData.flightNumber,
          bookingData.airline,
          bookingData.departureAirport,
          bookingData.departureCode,
          bookingData.departureTime,
          bookingData.arrivalAirport,
          bookingData.arrivalCode,
          bookingData.arrivalTime,
          bookingData.tripType,
          bookingData.returnFlightNumber,
          bookingData.returnAirline,
          bookingData.returnDepartureTime,
          bookingData.returnArrivalTime,
          bookingData.bookingReference,
          bookingData.price,
          bookingData.currency,
          bookingData.status,
          bookingData.cabinClass,
          bookingData.passengerName,
          bookingData.passengerEmail,
          bookingData.passengerPhone,
          JSON.stringify(bookingData.flightDetails)
        ];
        
        const bookingResult = await client.query(bookingSql, bookingValues);
        newBooking = bookingResult.rows[0];
        
        // Find an admin to use for system logs and notifications
        const adminQuery = `SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
        const adminResult = await client.query(adminQuery);
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : req.user!.id;
        
        // Create booking approval record
        const approvalSql = `
          INSERT INTO booking_approvals (
            booking_type, booking_id, status, admin_notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`;
          
        await client.query(approvalSql, [
          'flight',
          newBooking.id,
          'pending',
          `Flight booking from ${bookingData.departureAirport} to ${bookingData.arrivalAirport} awaiting approval`
        ]);
        
        // Log the new booking in admin logs
        const adminLogSql = `
          INSERT INTO admin_logs (
            admin_id, action, entity_type, entity_id, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`;
          
        await client.query(adminLogSql, [
          adminId,
          'new_booking',
          'flight_booking',
          newBooking.id,
          `New flight booking: ${bookingData.airline} ${bookingData.flightNumber} from ${bookingData.departureAirport} to ${bookingData.arrivalAirport}`
        ]);
        
        // Create notification for the user within the same transaction
        const notificationSql = `
          INSERT INTO notifications (
            user_id, admin_id, title, message, type, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`;
          
        await client.query(notificationSql, [
          bookingData.userId,
          adminId,
          'Flight Booking Under Review',
          `Your booking for ${bookingData.airline} flight ${bookingData.flightNumber} from ${bookingData.departureAirport} to ${bookingData.arrivalAirport} is pending approval. You'll be notified once it's approved.`,
          'info'
        ]);
        
        // Commit transaction
        await client.query('COMMIT');
      } catch (txError) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw txError;
      } finally {
        // Release client back to pool
        client.release();
      }
      
      return res.status(201).json(newBooking);
    } catch (error: any) {
      console.error("Error creating flight booking:", error);
      return res.status(500).json({ message: "Failed to create flight booking", error: error.message });
    }
  });

  app.get("/api/flight-bookings", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view bookings" });
      }

      // Get bookings for the user
      const bookings = await storage.getFlightBookingsByUserId(req.user!.id);
      
      // Map snake_case database fields to camelCase for the frontend
      const mappedBookings = bookings.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        flightNumber: booking.flight_number,
        airline: booking.airline,
        departureAirport: booking.departure_airport,
        departureCode: booking.departure_code,
        departureTime: booking.departure_time,
        arrivalAirport: booking.arrival_airport,
        arrivalCode: booking.arrival_code,
        arrivalTime: booking.arrival_time,
        tripType: booking.trip_type,
        returnFlightNumber: booking.return_flight_number,
        returnAirline: booking.return_airline,
        returnDepartureTime: booking.return_departure_time,
        returnArrivalTime: booking.return_arrival_time,
        bookingReference: booking.booking_reference,
        price: booking.price,
        currency: booking.currency,
        status: booking.status,
        cabinClass: booking.cabin_class,
        passengerName: booking.passenger_name,
        passengerEmail: booking.passenger_email,
        passengerPhone: booking.passenger_phone,
        flightDetails: booking.flight_details,
        createdAt: booking.created_at
      }));
      
      return res.status(200).json(mappedBookings);
    } catch (error) {
      console.error("Error fetching flight bookings:", error);
      return res.status(500).json({ message: "Failed to fetch flight bookings" });
    }
  });

  app.get("/api/flight-bookings/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view bookings" });
      }

      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get the booking
      const booking = await storage.getFlightBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if the booking belongs to the user
      if (booking.user_id !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to view this booking" });
      }
      
      // Map snake_case database fields to camelCase for the frontend
      const mappedBooking = {
        id: booking.id,
        userId: booking.user_id,
        flightNumber: booking.flight_number,
        airline: booking.airline,
        departureAirport: booking.departure_airport,
        departureCode: booking.departure_code,
        departureTime: booking.departure_time,
        arrivalAirport: booking.arrival_airport,
        arrivalCode: booking.arrival_code,
        arrivalTime: booking.arrival_time,
        tripType: booking.trip_type,
        returnFlightNumber: booking.return_flight_number,
        returnAirline: booking.return_airline,
        returnDepartureTime: booking.return_departure_time,
        returnArrivalTime: booking.return_arrival_time,
        bookingReference: booking.booking_reference,
        price: booking.price,
        currency: booking.currency,
        status: booking.status,
        cabinClass: booking.cabin_class,
        passengerName: booking.passenger_name,
        passengerEmail: booking.passenger_email,
        passengerPhone: booking.passenger_phone,
        flightDetails: booking.flight_details,
        createdAt: booking.created_at
      };
      
      return res.status(200).json(mappedBooking);
    } catch (error) {
      console.error("Error fetching flight booking:", error);
      return res.status(500).json({ message: "Failed to fetch flight booking" });
    }
  });

  // Hotel routes
  // Get hotel search history
  app.get("/api/hotels/history", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view hotel search history" });
      }
      
      const userId = req.user!.id;
      const searchHistory = await storage.getHotelSearchesByUserId(userId);
      
      res.json(searchHistory);
    } catch (error) {
      console.error("Error fetching hotel search history:", error);
      res.status(500).json({ 
        message: "Failed to fetch hotel search history", 
        error: (error as Error).message 
      });
    }
  });
  
  // Delete hotel search history item
  app.delete("/api/hotels/history/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete hotel search history" });
      }
      
      const searchId = parseInt(req.params.id);
      
      if (isNaN(searchId)) {
        return res.status(400).json({ message: "Invalid search ID" });
      }
      
      // Delete the search record
      await storage.deleteHotelSearch(searchId);
      
      res.status(200).json({ message: "Hotel search deleted successfully" });
    } catch (error) {
      console.error("Error deleting hotel search:", error);
      res.status(500).json({ 
        message: "Failed to delete hotel search", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/hotels/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { location, checkInDate, checkOutDate, guests, rooms } = req.body;
      
      // Validate required fields
      if (!location || !checkInDate || !checkOutDate) {
        return res.status(400).json({ message: "Location, check-in date, and check-out date are required" });
      }
      
      // Search for hotels
      const hotels = await hotelService.searchHotels(
        req.user!.id,
        location,
        checkInDate,
        checkOutDate,
        guests || 1,
        rooms || 1
      );
      
      return res.status(200).json(hotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      return res.status(500).json({ message: "Failed to search hotels" });
    }
  });

  app.get("/api/hotels/:hotelId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const hotelId = req.params.hotelId;
      const hotel = await hotelService.getHotelDetails(hotelId);
      
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      
      return res.status(200).json(hotel);
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      return res.status(500).json({ message: "Failed to fetch hotel details" });
    }
  });

  app.post("/api/hotel-bookings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const {
        hotelId,
        hotelName,
        hotelImage,
        hotelAddress,
        hotelCity,
        hotelCountry,
        hotelRating,
        roomType,
        checkInDate,
        checkOutDate,
        guests,
        rooms,
        price,
        currency,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests
      } = req.body;
      
      // Validate required fields
      if (!hotelId || !hotelName || !hotelAddress || !hotelCity || !hotelCountry || 
          !roomType || !checkInDate || !checkOutDate || !price || 
          !guestName || !guestEmail) {
        return res.status(400).json({ message: "Missing required booking information" });
      }
      
      // Booking data with pending status for admin approval
      const bookingData = {
        userId: req.user!.id,
        hotelId,
        hotelName,
        hotelImage: hotelImage || null,
        hotelAddress,
        hotelCity,
        hotelCountry,
        hotelRating: hotelRating || 0,
        roomType,
        checkInDate,
        checkOutDate,
        guests: guests || 1,
        rooms: rooms || 1,
        price,
        currency: currency || 'USD',
        status: 'PENDING', // Start with pending status for admin approval
        bookingReference: `HOTEL-${Date.now()}`,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        specialRequests: specialRequests || null
      };
      
      console.log("Processing hotel booking with approval flow:", JSON.stringify(bookingData, null, 2));
      
      // Use raw SQL instead of hotelService.bookHotel to create the booking
      let newBooking;
      
      // Use transaction to ensure both the booking and approval record are created
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insert hotel booking
        const bookingSql = `
          INSERT INTO hotel_bookings (
            user_id, hotel_id, hotel_name, hotel_image, hotel_address, hotel_city, 
            hotel_country, hotel_rating, room_type, check_in_date, check_out_date, 
            guests, rooms, price, currency, status, booking_reference, 
            guest_name, guest_email, guest_phone, special_requests, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
            $18, $19, $20, $21, NOW(), NOW()
          ) RETURNING *`;
          
        const bookingValues = [
          bookingData.userId,
          bookingData.hotelId,
          bookingData.hotelName,
          bookingData.hotelImage,
          bookingData.hotelAddress,
          bookingData.hotelCity,
          bookingData.hotelCountry,
          bookingData.hotelRating,
          bookingData.roomType,
          bookingData.checkInDate,
          bookingData.checkOutDate,
          bookingData.guests,
          bookingData.rooms,
          bookingData.price,
          bookingData.currency,
          bookingData.status,
          bookingData.bookingReference,
          bookingData.guestName,
          bookingData.guestEmail,
          bookingData.guestPhone,
          bookingData.specialRequests
        ];
        
        const bookingResult = await client.query(bookingSql, bookingValues);
        newBooking = bookingResult.rows[0];
        
        // Find an admin to use for system logs and notifications
        const adminQuery = `SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
        const adminResult = await client.query(adminQuery);
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : req.user!.id;
        
        // Create booking approval record
        const approvalSql = `
          INSERT INTO booking_approvals (
            booking_type, booking_id, status, admin_notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`;
          
        await client.query(approvalSql, [
          'hotel',
          newBooking.id,
          'pending',
          `Hotel booking at ${bookingData.hotelName} for ${bookingData.guestName} (${bookingData.checkInDate} to ${bookingData.checkOutDate}) awaiting approval`
        ]);
        
        // Create admin log entry
        const adminLogSql = `
          INSERT INTO admin_logs (
            admin_id, action, entity_type, entity_id, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`;
          
        await client.query(adminLogSql, [
          adminId,
          'new_booking',
          'hotel_booking',
          newBooking.id,
          `New hotel booking: ${bookingData.hotelName} in ${bookingData.hotelCity}, ${bookingData.hotelCountry} for ${bookingData.checkInDate} to ${bookingData.checkOutDate}`
        ]);
        
        // Create notification for the user
        const notificationSql = `
          INSERT INTO notifications (
            user_id, admin_id, title, message, type, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`;
          
        await client.query(notificationSql, [
          bookingData.userId,
          adminId,
          'Hotel Booking Under Review',
          `Your booking at ${bookingData.hotelName} in ${bookingData.hotelCity} for ${bookingData.checkInDate} to ${bookingData.checkOutDate} is under review. You'll be notified once it's approved.`,
          'info'
        ]);
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
      return res.status(201).json(newBooking);
    } catch (error) {
      console.error("Error creating hotel booking:", error);
      return res.status(500).json({ message: "Failed to create hotel booking" });
    }
  });

  app.get("/api/hotel-bookings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const bookings = await hotelService.getUserHotelBookings(req.user!.id);
      console.log('Hotel bookings from database:', JSON.stringify(bookings, null, 2));
      return res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching hotel bookings:", error);
      return res.status(500).json({ message: "Failed to fetch hotel bookings" });
    }
  });

  app.get("/api/hotel-bookings/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await hotelService.getBookingDetails(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if the booking belongs to the user
      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to view this booking" });
      }
      
      return res.status(200).json(booking);
    } catch (error) {
      console.error("Error fetching hotel booking:", error);
      return res.status(500).json({ message: "Failed to fetch hotel booking" });
    }
  });

  // Get combined bookings for a user (both flight and hotel)
  app.get("/api/bookings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Get both flight and hotel bookings with approval status
      const flightBookingsQuery = `
        SELECT fb.*, 
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at
        FROM flight_bookings fb
        LEFT JOIN booking_approvals ba ON ba.booking_id = fb.id AND ba.booking_type = 'flight'
        WHERE fb.user_id = $1
        ORDER BY fb.created_at DESC
      `;
      
      const hotelBookingsQuery = `
        SELECT hb.*, 
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at
        FROM hotel_bookings hb
        LEFT JOIN booking_approvals ba ON ba.booking_id = hb.id AND ba.booking_type = 'hotel'
        WHERE hb.user_id = $1
        ORDER BY hb.created_at DESC
      `;
      
      const flightResult = await query(flightBookingsQuery, [req.user!.id]);
      const hotelResult = await query(hotelBookingsQuery, [req.user!.id]);
      
      // Return both types with type indicators and approval data
      return res.status(200).json({
        flights: flightResult.rows.map(booking => ({ 
          ...booking, 
          bookingType: 'flight',
          approvalStatus: booking.approval_status,
          approvalNotes: booking.approval_notes,
          approvalUpdated: booking.approval_updated_at
        })),
        hotels: hotelResult.rows.map(booking => ({ 
          ...booking, 
          bookingType: 'hotel',
          approvalStatus: booking.approval_status,
          approvalNotes: booking.approval_notes,
          approvalUpdated: booking.approval_updated_at
        }))
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  
  // Notifications endpoints
  
  // Get all notifications for the user
  app.get("/api/notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Enhanced query to include better time sorting and limit if needed
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notificationsQuery = `
        SELECT 
          n.id, 
          n.title, 
          n.message, 
          n.type, 
          n.created_at,
          n.is_read,
          n.link,
          n.user_id,
          n.admin_id,
          a.username as admin_username
        FROM notifications n
        LEFT JOIN users a ON n.admin_id = a.id
        WHERE (n.user_id = $1 OR n.user_id IS NULL)
          AND (n.valid_until IS NULL OR n.valid_until > NOW())
        ORDER BY n.created_at DESC
        LIMIT $2
      `;
      
      const result = await query(notificationsQuery, [req.user!.id, limit]);
      
      // Map the notifications to ensure consistent output format for the frontend
      const notifications = result.rows.map(notification => ({
        ...notification,
        // Ensure we indicate if it's read for the frontend to show the right UI
        is_read: !!notification.is_read,
        // Format the date for consistent display
        created_at: notification.created_at,
        // Don't include read_at as it doesn't exist in the DB schema
      }));
      
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Get unread notification count for the user - used for bell icon
  app.get("/api/notifications/unread-count", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const countQuery = `
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE (user_id = $1 OR user_id IS NULL)
        AND is_read = FALSE
      `;
      
      const result = await query(countQuery, [req.user!.id]);
      
      return res.status(200).json({ count: parseInt(result.rows[0].unread_count) });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      return res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });
  
  // Mark a notification as read
  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const notificationId = parseInt(req.params.id);
      
      // Check if the notification exists and belongs to the user
      const checkQuery = `
        SELECT * FROM notifications
        WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      `;
      
      const checkResult = await query(checkQuery, [notificationId, req.user!.id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Mark as read 
      const updateQuery = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
        RETURNING 
          id, 
          title, 
          message, 
          type, 
          created_at,
          user_id,
          admin_id
      `;
      
      const result = await query(updateQuery, [notificationId]);
      
      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Mark all notifications for a user as read
  app.put("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const updateQuery = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE
        RETURNING id
      `;
      
      const result = await query(updateQuery, [req.user!.id]);
      
      return res.status(200).json({ 
        message: "All notifications marked as read", 
        count: result.rowCount 
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Admin routes
  
  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    
    next();
  };
  
  // Admin User Management
  
  // Get all users
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  
  // Add new user (admin only)
  app.post("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const { username, email, password, role, firstName, lastName } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      
      // Check if user already exists
      const checkUserSql = `SELECT * FROM users WHERE username = $1 OR email = $2`;
      const checkResult = await query(checkUserSql, [username, email]);
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: "Username or email already exists" });
      }
      
      // Hash the password
      const salt = randomBytes(16).toString('hex');
      const hashedPassword = await scryptHash(password, salt);
      const passwordWithSalt = `${hashedPassword}.${salt}`;
      
      // Insert the new user
      const insertUserSql = `
        INSERT INTO users (
          username, email, password, role, first_name, last_name, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, username, email, role, first_name, last_name, is_active, created_at, updated_at
      `;
      
      const userResult = await query(insertUserSql, [
        username,
        email,
        passwordWithSalt, 
        role || 'user',
        firstName || null,
        lastName || null,
        true
      ]);
      
      const newUser = userResult.rows[0];
      
      // Log the admin action
      const adminLogSql = `
        INSERT INTO admin_logs (
          admin_id, action, entity_type, entity_id, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await query(adminLogSql, [
        req.user!.id,
        'create_user',
        'user',
        newUser.id,
        `Admin created new user '${username}' with role '${role || 'user'}'`
      ]);
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  // Update user status (activate/deactivate)
  app.put("/api/admin/users/:userId/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ error: "isActive status is required" });
      }
      
      const updatedUser = await storage.updateUserStatus(userId, isActive);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: isActive ? 'activate_user' : 'deactivate_user',
        entityType: 'user',
        entityId: userId,
        details: `User ${isActive ? 'activated' : 'deactivated'}`
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });
  
  // Delete user
  app.delete("/api/admin/users/:userId", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if trying to delete self
      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Get user info before deletion for logging purposes
      const userQuery = await query('SELECT username FROM users WHERE id = $1', [userId]);
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const username = userQuery.rows[0].username;
      
      await storage.deleteUser(userId);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: 'delete_user',
        entityType: 'user',
        entityId: userId,
        details: `User '${username}' deleted`
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // Admin Booking Management
  
  // Utility function to add missing booking approvals
  const addMissingBookingApprovals = async () => {
    try {
      // Find flight bookings with CONFIRMED status but no approval record
      const flightQuery = `
        SELECT fb.id
        FROM flight_bookings fb
        LEFT JOIN booking_approvals ba ON ba.booking_id = fb.id AND ba.booking_type = 'flight'
        WHERE fb.status = 'CONFIRMED' AND ba.id IS NULL
      `;
      
      const flightResult = await query(flightQuery);
      
      // For each missing approval, create one with approved status
      for (const row of flightResult.rows) {
        console.log(`Adding missing approval for confirmed flight booking ${row.id}`);
        await query(
          `INSERT INTO booking_approvals (booking_type, booking_id, status, admin_notes, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          ['flight', row.id, 'approved', 'Auto-created approval for confirmed booking']
        );
      }
      
      // Find hotel bookings with CONFIRMED status but no approval record
      const hotelQuery = `
        SELECT hb.id
        FROM hotel_bookings hb
        LEFT JOIN booking_approvals ba ON ba.booking_id = hb.id AND ba.booking_type = 'hotel'
        WHERE hb.status = 'CONFIRMED' AND ba.id IS NULL
      `;
      
      const hotelResult = await query(hotelQuery);
      
      // For each missing approval, create one with approved status
      for (const row of hotelResult.rows) {
        console.log(`Adding missing approval for confirmed hotel booking ${row.id}`);
        await query(
          `INSERT INTO booking_approvals (booking_type, booking_id, status, admin_notes, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          ['hotel', row.id, 'approved', 'Auto-created approval for confirmed booking']
        );
      }
      
      return {
        fixedFlightBookings: flightResult.rowCount,
        fixedHotelBookings: hotelResult.rowCount
      };
    } catch (error) {
      console.error('Error fixing booking approvals:', error);
      return { error: (error as Error).message };
    }
  };

  // Get all pending bookings that need approval
  app.get("/api/admin/bookings/pending", isAdmin, async (req: Request, res: Response) => {
    // Fix any missing approvals first
    await addMissingBookingApprovals();
    try {
      // Get pending flight bookings
      const flightBookingsQuery = `
        SELECT fb.*, 
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at,
               u.username as user_username,
               u.email as user_email
        FROM flight_bookings fb
        LEFT JOIN booking_approvals ba ON ba.booking_id = fb.id AND ba.booking_type = 'flight'
        JOIN users u ON fb.user_id = u.id
        WHERE (ba.status = 'pending' OR (ba.status IS NULL AND fb.status NOT IN ('CONFIRMED', 'CANCELLED', 'REJECTED')))
        ORDER BY fb.created_at DESC
      `;
      
      // Get pending hotel bookings
      const hotelBookingsQuery = `
        SELECT hb.*, 
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at,
               u.username as user_username,
               u.email as user_email
        FROM hotel_bookings hb
        LEFT JOIN booking_approvals ba ON ba.booking_id = hb.id AND ba.booking_type = 'hotel'
        JOIN users u ON hb.user_id = u.id
        WHERE (ba.status = 'pending' OR (ba.status IS NULL AND hb.status NOT IN ('CONFIRMED', 'CANCELLED', 'REJECTED')))
        ORDER BY hb.created_at DESC
      `;
      
      const flightResult = await query(flightBookingsQuery);
      const hotelResult = await query(hotelBookingsQuery);
      
      return res.status(200).json({
        flights: flightResult.rows.map(booking => ({ 
          ...booking, 
          bookingType: 'flight',
          approvalStatus: booking.approval_status,
          approvalNotes: booking.approval_notes,
          approvalUpdated: booking.approval_updated_at
        })),
        hotels: hotelResult.rows.map(booking => ({ 
          ...booking, 
          bookingType: 'hotel',
          approvalStatus: booking.approval_status,
          approvalNotes: booking.approval_notes,
          approvalUpdated: booking.approval_updated_at
        }))
      });
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      return res.status(500).json({ error: "Failed to fetch pending bookings" });
    }
  });
  
  // Get booking approvals
  app.get("/api/admin/booking-approvals", isAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const approvals = await storage.getBookingApprovals(status, limit);
      res.json(approvals);
    } catch (error) {
      console.error('Error getting booking approvals:', error);
      res.status(500).json({ error: "Failed to get booking approvals" });
    }
  });
  
  // Approve or reject a booking
  app.put("/api/admin/bookings/:bookingType/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const bookingType = req.params.bookingType; // 'flight' or 'hotel'
      const { status, notes } = req.body;
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      
      if (!['flight', 'hotel'].includes(bookingType)) {
        return res.status(400).json({ error: "Booking type must be 'flight' or 'hotel'" });
      }
      
      // Use a transaction to update booking approval status and send notification
      const client = await pool.connect();
      let userId, bookingDetails;
      
      try {
        await client.query('BEGIN');
        
        // Update booking approval status
        const updateApprovalSql = `
          UPDATE booking_approvals
          SET status = $1, admin_notes = $2, updated_at = NOW()
          WHERE booking_id = $3 AND booking_type = $4
          RETURNING *
        `;
        
        const approvalResult = await client.query(updateApprovalSql, [
          status, 
          notes || `Booking ${status} by admin`, 
          bookingId,
          bookingType
        ]);
        
        if (approvalResult.rows.length === 0) {
          throw new Error(`No booking approval record found for ${bookingType} booking ID ${bookingId}`);
        }
        
        // Update the main booking status
        const tableName = bookingType === 'flight' ? 'flight_bookings' : 'hotel_bookings';
        const updateBookingSql = `
          UPDATE ${tableName}
          SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const newStatus = status === 'approved' ? 'CONFIRMED' : 'REJECTED';
        const bookingResult = await client.query(updateBookingSql, [newStatus, bookingId]);
        
        if (bookingResult.rows.length === 0) {
          throw new Error(`No ${bookingType} booking found with ID ${bookingId}`);
        }
        
        // Get necessary booking details for notification
        bookingDetails = bookingResult.rows[0];
        userId = bookingDetails.user_id;
        
        // Log the admin action
        const adminLogSql = `
          INSERT INTO admin_logs (
            admin_id, action, entity_type, entity_id, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        
        await client.query(adminLogSql, [
          req.user!.id,
          `${status}_booking`,
          `${bookingType}_booking`,
          bookingId,
          `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} booking ${status} with ID ${bookingId}`
        ]);
        
        // Create notification for the user
        const notificationTitle = status === 'approved' 
          ? `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking Confirmed`
          : `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking Rejected`;
          
        let notificationMessage;
        
        if (bookingType === 'flight') {
          notificationMessage = status === 'approved'
            ? `Your flight booking (${bookingDetails.airline} ${bookingDetails.flight_number}) has been confirmed. Safe travels!`
            : `Your flight booking (${bookingDetails.airline} ${bookingDetails.flight_number}) has been rejected. Please contact customer support for more details.`;
        } else {
          notificationMessage = status === 'approved'
            ? `Your hotel booking at ${bookingDetails.hotel_name} for ${bookingDetails.check_in_date} to ${bookingDetails.check_out_date} has been confirmed. Enjoy your stay!`
            : `Your hotel booking at ${bookingDetails.hotel_name} has been rejected. Please contact customer support for more details.`;
        }
        
        // Create a notification with high priority for real-time sound alerts
        const notificationSql = `
          INSERT INTO notifications (
            user_id, admin_id, title, message, type, created_at, is_read
          ) VALUES ($1, $2, $3, $4, $5, NOW(), FALSE)
          RETURNING id
        `;
        
        await client.query(notificationSql, [
          userId,
          req.user!.id,
          notificationTitle,
          notificationMessage,
          status === 'approved' ? 'success' : 'error'
        ]);
        
        await client.query('COMMIT');
        
        return res.status(200).json({ 
          message: `Booking ${status} successfully`, 
          bookingDetails 
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error updating booking status:`, error);
      return res.status(500).json({ error: "Failed to update booking status" });
    }
  });
  
  // Update booking approval status (legacy endpoint)
  app.put("/api/admin/booking-approvals/:approvalId", isAdmin, async (req: Request, res: Response) => {
    try {
      const approvalId = parseInt(req.params.approvalId);
      const { status, adminNotes } = req.body;
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: "Valid status (approved, rejected, pending) is required" });
      }
      
      const updatedApproval = await storage.updateBookingApprovalStatus(
        approvalId, 
        status, 
        req.user!.id, 
        adminNotes
      );
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: `booking_${status}`,
        entityType: 'booking_approval',
        entityId: approvalId,
        details: `${updatedApproval.booking_type} booking #${updatedApproval.booking_id} ${status}`
      });
      
      res.json(updatedApproval);
    } catch (error) {
      console.error('Error updating booking approval:', error);
      res.status(500).json({ error: "Failed to update booking approval" });
    }
  });
  
  // Create booking approval record for a new booking
  app.post("/api/admin/booking-approvals", isAdmin, async (req: Request, res: Response) => {
    try {
      const { bookingType, bookingId, status, adminNotes } = req.body;
      
      if (!bookingType || !bookingId) {
        return res.status(400).json({ error: "Booking type and ID are required" });
      }
      
      const approval = await storage.createBookingApproval({
        bookingType,
        bookingId,
        status: status || 'pending',
        adminId: req.user!.id,
        adminNotes
      });
      
      res.status(201).json(approval);
    } catch (error) {
      console.error('Error creating booking approval:', error);
      res.status(500).json({ error: "Failed to create booking approval" });
    }
  });
  
  // Admin Trip Management
  
  // Get all trips
  app.get("/api/admin/trips", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const trips = await storage.getAllTrips(limit);
      res.json(trips);
    } catch (error) {
      console.error('Error getting all trips:', error);
      res.status(500).json({ error: "Failed to get trips" });
    }
  });
  
  // Delete a trip (admin action)
  app.delete("/api/admin/trips/:tripId", isAdmin, async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ error: "Deletion reason is required" });
      }
      
      await storage.deleteTripByAdmin(tripId, req.user!.id, reason);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });
  
  // Admin Notification Management
  
  // Send a notification to a specific user or broadcast to all users
  app.post("/api/admin/notifications", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, title, message, type, link, validUntil } = req.body;
      
      if (!title || !message || !type) {
        return res.status(400).json({ error: "Title, message, and type are required" });
      }
      
      // Create notification with sound alert capability for real-time notifications
      const createNotificationSql = `
        INSERT INTO notifications (
          user_id, admin_id, title, message, type, link, valid_until, created_at, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), FALSE)
        RETURNING id, title, message, type, created_at, user_id, admin_id
      `;

      const result = await query(createNotificationSql, [
        userId || null, // If null, sends to all users
        req.user!.id,
        title,
        message,
        type,
        link || null,
        validUntil || null
      ]);
      
      const notification = result.rows[0];
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: 'send_notification',
        entityType: 'notification',
        entityId: notification.id,
        details: userId ? `Sent notification to user #${userId}` : 'Broadcast notification to all users'
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  
  // Admin Analytics
  
  // Get top searched destinations
  app.get("/api/admin/analytics/top-destinations", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const SQL = `
        SELECT search_term as destination, COUNT(*) as search_count
        FROM search_analytics
        WHERE search_type IN ('destination', 'hotel')
        GROUP BY search_term
        ORDER BY search_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting top destinations:', error);
      res.status(500).json({ error: "Failed to get top destinations" });
    }
  });
  
  // Get most booked hotels
  app.get("/api/admin/analytics/most-booked-hotels", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const SQL = `
        SELECT hotel_name, COUNT(*) as booking_count, 
               MAX(price) as highest_price, 
               MIN(price) as lowest_price,
               AVG(price) as average_price,
               MAX(created_at) as latest_booking
        FROM hotel_bookings
        GROUP BY hotel_name
        ORDER BY booking_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting most booked hotels:', error);
      res.status(500).json({ error: "Failed to get most booked hotels" });
    }
  });
  
  // Get most booked flights
  app.get("/api/admin/analytics/most-booked-flights", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const SQL = `
        SELECT airline, COUNT(*) as booking_count,
               MAX(price) as highest_price,
               MIN(price) as lowest_price,
               AVG(price) as average_price,
               MAX(created_at) as latest_booking
        FROM flight_bookings
        GROUP BY airline
        ORDER BY booking_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting most booked flights:', error);
      res.status(500).json({ error: "Failed to get most booked flights" });
    }
  });
  
  // Get booking heatmap data
  app.get("/api/admin/analytics/booking-heatmap", isAdmin, async (req: Request, res: Response) => {
    try {
      const SQL = `
        SELECT 
          day_of_week, 
          hour_of_day, 
          COUNT(*) as booking_count
        FROM (
          SELECT 
            EXTRACT(DOW FROM created_at) as day_of_week,
            EXTRACT(HOUR FROM created_at) as hour_of_day
          FROM flight_bookings
          UNION ALL
          SELECT 
            EXTRACT(DOW FROM created_at) as day_of_week,
            EXTRACT(HOUR FROM created_at) as hour_of_day
          FROM hotel_bookings
        ) AS all_bookings
        GROUP BY day_of_week, hour_of_day
        ORDER BY day_of_week, hour_of_day
      `;
      
      const result = await query(SQL);
      
      // Format data for heatmap visualization
      // Create a 7x24 grid (7 days, 24 hours)
      const heatmapData = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          // Find the data point if it exists
          const dataPoint = result.rows.find(
            row => parseInt(row.day_of_week) === day && parseInt(row.hour_of_day) === hour
          );
          
          heatmapData.push({
            day_of_week: day,
            hour_of_day: hour,
            booking_count: dataPoint ? parseInt(dataPoint.booking_count) : 0,
            day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
          });
        }
      }
      
      res.json(heatmapData);
    } catch (error) {
      console.error('Error getting booking heatmap data:', error);
      res.status(500).json({ error: "Failed to get booking heatmap data" });
    }
  });
  
  // Get booking stats by month
  app.get("/api/admin/analytics/booking-trends", isAdmin, async (req: Request, res: Response) => {
    try {
      const SQL = `
        SELECT 
          date_trunc('month', created_at) as month,
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status IN ('CONFIRMED', 'confirmed') THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status IN ('CANCELLED', 'cancelled') THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(CASE WHEN status IN ('PENDING', 'pending') THEN 1 ELSE 0 END) as pending_bookings,
          SUM(price) as total_revenue
        FROM (
          SELECT created_at, status, price FROM flight_bookings
          UNION ALL
          SELECT created_at, status, price FROM hotel_bookings
        ) AS all_bookings
        GROUP BY month
        ORDER BY month
      `;
      
      const result = await query(SQL);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting booking trends:', error);
      res.status(500).json({ error: "Failed to get booking trends" });
    }
  });
  
  // Get user activity stats
  app.get("/api/admin/analytics/user-activity", isAdmin, async (req: Request, res: Response) => {
    try {
      const SQL = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          u.created_at as joined_date,
          COUNT(DISTINCT fb.id) as flight_bookings,
          COUNT(DISTINCT hb.id) as hotel_bookings,
          COUNT(DISTINCT t.id) as trips,
          MAX(GREATEST(COALESCE(fb.created_at, '1970-01-01'), 
                       COALESCE(hb.created_at, '1970-01-01'), 
                       COALESCE(t.created_at, '1970-01-01'))) as last_activity
        FROM users u
        LEFT JOIN flight_bookings fb ON u.id = fb.user_id
        LEFT JOIN hotel_bookings hb ON u.id = hb.user_id
        LEFT JOIN trips t ON u.id = t.user_id
        GROUP BY u.id, u.username, u.email, u.role, u.created_at
        ORDER BY last_activity DESC
      `;
      
      const result = await query(SQL);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting user activity stats:', error);
      res.status(500).json({ error: "Failed to get user activity stats" });
    }
  });
  
  // Get dashboard summary stats
  app.get("/api/admin/analytics/dashboard-summary", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total users and new users today
      const userStatsSQL = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as new_users_today
        FROM users
      `;
      
      // Total bookings and revenue
      const bookingStatsSQL = `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as new_bookings_today,
          SUM(price) as total_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE THEN price ELSE 0 END) as revenue_today
        FROM (
          SELECT created_at, price FROM flight_bookings
          UNION ALL
          SELECT created_at, price FROM hotel_bookings
        ) AS all_bookings
      `;
      
      // Status of approval requests
      const approvalStatsSQL = `
        SELECT 
          COUNT(*) as total_approvals,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_approvals,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_approvals,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_approvals
        FROM booking_approvals
      `;
      
      const userStatsResult = await query(userStatsSQL);
      const bookingStatsResult = await query(bookingStatsSQL);
      const approvalStatsResult = await query(approvalStatsSQL);
      
      res.json({
        users: userStatsResult.rows[0],
        bookings: bookingStatsResult.rows[0],
        approvals: approvalStatsResult.rows[0],
        last_updated: new Date()
      });
    } catch (error) {
      console.error('Error getting dashboard summary stats:', error);
      res.status(500).json({ error: "Failed to get dashboard summary stats" });
    }
  });
  
  // Get AI conversation analytics
  app.get("/api/admin/analytics/ai-conversations", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAiConversationLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error getting AI conversation logs:', error);
      res.status(500).json({ error: "Failed to get AI conversation logs" });
    }
  });
  
  // Get popular AI queries
  app.get("/api/admin/analytics/popular-ai-queries", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const queries = await storage.getPopularAiQueries(limit);
      res.json(queries);
    } catch (error) {
      console.error('Error getting popular AI queries:', error);
      res.status(500).json({ error: "Failed to get popular AI queries" });
    }
  });
  
  // Get flight search analytics
  app.get("/api/admin/analytics/flight-searches", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const SQL = `
        SELECT 
          sa.id, 
          sa.user_id, 
          u.username as user_username, 
          sa.search_type, 
          sa.search_term as query, 
          sa.result_count, 
          sa.created_at
        FROM search_analytics sa
        JOIN users u ON sa.user_id = u.id
        WHERE sa.search_type = 'flight'
        ORDER BY sa.created_at DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting flight search analytics:', error);
      res.status(500).json({ error: "Failed to get flight search analytics" });
    }
  });
  
  // Get hotel search analytics
  app.get("/api/admin/analytics/hotel-searches", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const SQL = `
        SELECT 
          sa.id, 
          sa.user_id, 
          u.username as user_username, 
          sa.search_type, 
          sa.search_term as query, 
          sa.result_count, 
          sa.created_at
        FROM search_analytics sa
        JOIN users u ON sa.user_id = u.id
        WHERE sa.search_type = 'hotel'
        ORDER BY sa.created_at DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting hotel search analytics:', error);
      res.status(500).json({ error: "Failed to get hotel search analytics" });
    }
  });
  
  // Get search analytics overview stats
  app.get("/api/admin/analytics/search-stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total searches by type
      const searchesByTypeSQL = `
        SELECT 
          search_type, 
          COUNT(*) as count
        FROM search_analytics
        GROUP BY search_type
        ORDER BY count DESC
      `;
      
      // Most popular search terms
      const popularTermsSQL = `
        SELECT 
          search_term,
          search_type, 
          COUNT(*) as count
        FROM search_analytics
        GROUP BY search_term, search_type
        ORDER BY count DESC
        LIMIT 10
      `;
      
      // Search volume over time (last 30 days)
      const volumeOverTimeSQL = `
        SELECT 
          DATE(created_at) as date,
          search_type,
          COUNT(*) as count
        FROM search_analytics
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at), search_type
        ORDER BY date
      `;
      
      const [typeResult, termsResult, volumeResult] = await Promise.all([
        query(searchesByTypeSQL),
        query(popularTermsSQL),
        query(volumeOverTimeSQL)
      ]);
      
      res.json({
        byType: typeResult.rows,
        popularTerms: termsResult.rows,
        volumeOverTime: volumeResult.rows
      });
    } catch (error) {
      console.error('Error getting search analytics stats:', error);
      res.status(500).json({ error: "Failed to get search analytics stats" });
    }
  });
  
  // Admin logs endpoints
  
  // Create an admin log entry
  app.post("/api/admin/logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const { action, entityType, entityId, details } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: "Action is required" });
      }
      
      const adminLog = await storage.createAdminLog({
        adminId: req.user!.id,
        action,
        entityType,
        entityId,
        details
      });
      
      res.status(201).json(adminLog);
    } catch (error) {
      console.error('Error creating admin log:', error);
      res.status(500).json({ error: "Failed to create admin log" });
    }
  });
  
  // Get admin logs for the authenticated admin
  app.get("/api/admin/logs/my", isAdmin, async (req: Request, res: Response) => {
    try {
      const adminLogs = await storage.getAdminLogsByAdminId(req.user!.id);
      res.json(adminLogs);
    } catch (error) {
      console.error('Error getting admin logs:', error);
      res.status(500).json({ error: "Failed to get admin logs" });
    }
  });
  
  // Get recent admin logs across all admins
  app.get("/api/admin/logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const type = req.query.type as string | undefined;
      
      // If type is specified, get specific search logs
      if (type) {
        const SQL = `
          SELECT sa.id, sa.user_id, u.username as user_username, 
                 sa.search_type, sa.search_term as query, 
                 sa.result_count, sa.created_at
          FROM search_analytics sa
          JOIN users u ON sa.user_id = u.id
          WHERE sa.search_type = $1
          ORDER BY sa.created_at DESC
          LIMIT $2
        `;
        
        const result = await query(SQL, [type, limit]);
        res.json(result.rows);
        return;
      }
      
      // Otherwise return admin logs using raw SQL
      const adminLogsSQL = `
        SELECT al.*, u.username as admin_username
        FROM admin_logs al
        JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1
      `;
      
      const result = await query(adminLogsSQL, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting logs:', error);
      res.status(500).json({ error: "Failed to get logs" });
    }
  });
  
  // Admin Dashboard Summary Statistics
  app.get("/api/admin/stats/users", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total users count
      const totalUsersQuery = `SELECT COUNT(*) as count FROM users`;
      const totalUsersResult = await query(totalUsersQuery);
      const totalUsers = parseInt(totalUsersResult.rows[0].count);
      
      // New users today
      const newUsersTodayQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= CURRENT_DATE
      `;
      const newUsersTodayResult = await query(newUsersTodayQuery);
      const newUsersToday = parseInt(newUsersTodayResult.rows[0].count);
      
      // New users this month
      const newUsersMonthQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `;
      const newUsersMonthResult = await query(newUsersMonthQuery);
      const newUsersThisMonth = parseInt(newUsersMonthResult.rows[0].count);
      
      // User registration over time (last 7 days)
      const usersTrendQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const usersTrendResult = await query(usersTrendQuery);
      
      // Active vs inactive users
      const userStatusQuery = `
        SELECT 
          is_active,
          COUNT(*) as count
        FROM users
        GROUP BY is_active
      `;
      const userStatusResult = await query(userStatusQuery);
      
      // Role distribution
      const roleDistributionQuery = `
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        GROUP BY role
      `;
      const roleDistributionResult = await query(roleDistributionQuery);
      
      res.json({
        totalUsers,
        newUsersToday,
        newUsersThisMonth,
        usersTrend: usersTrendResult.rows,
        userStatus: userStatusResult.rows,
        roleDistribution: roleDistributionResult.rows
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: "Failed to get user statistics" });
    }
  });
  
  app.get("/api/admin/stats/trips", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total trips count
      const totalTripsQuery = `SELECT COUNT(*) as count FROM trips`;
      const totalTripsResult = await query(totalTripsQuery);
      const totalTrips = parseInt(totalTripsResult.rows[0].count);
      
      // New trips today
      const newTripsTodayQuery = `
        SELECT COUNT(*) as count 
        FROM trips 
        WHERE created_at >= CURRENT_DATE
      `;
      const newTripsTodayResult = await query(newTripsTodayQuery);
      const newTripsToday = parseInt(newTripsTodayResult.rows[0].count);
      
      // Trip creation trend (last 7 days)
      const tripsTrendQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM trips
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const tripsTrendResult = await query(tripsTrendQuery);
      
      // Most popular destinations
      const popularDestinationsQuery = `
        SELECT 
          destination,
          COUNT(*) as trip_count
        FROM trips
        GROUP BY destination
        ORDER BY trip_count DESC
        LIMIT 5
      `;
      const popularDestinationsResult = await query(popularDestinationsQuery);
      
      res.json({
        totalTrips,
        newTripsToday,
        tripsTrend: tripsTrendResult.rows,
        popularDestinations: popularDestinationsResult.rows
      });
    } catch (error) {
      console.error('Error getting trip stats:', error);
      res.status(500).json({ error: "Failed to get trip statistics" });
    }
  });
  
  app.get("/api/admin/stats/bookings", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total bookings count
      const flightBookingsQuery = `SELECT COUNT(*) as count FROM flight_bookings`;
      const flightBookingsResult = await query(flightBookingsQuery);
      const totalFlightBookings = parseInt(flightBookingsResult.rows[0].count);
      
      const hotelBookingsQuery = `SELECT COUNT(*) as count FROM hotel_bookings`;
      const hotelBookingsResult = await query(hotelBookingsQuery);
      const totalHotelBookings = parseInt(hotelBookingsResult.rows[0].count);
      
      // Bookings by status
      const flightStatusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM flight_bookings
        GROUP BY status
      `;
      const flightStatusResult = await query(flightStatusQuery);
      
      const hotelStatusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM hotel_bookings
        GROUP BY status
      `;
      const hotelStatusResult = await query(hotelStatusQuery);
      
      // Recent bookings (last 7 days)
      const recentBookingsQuery = `
        SELECT 
          'flight' as type,
          created_at,
          price,
          status
        FROM flight_bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION ALL
        SELECT 
          'hotel' as type,
          created_at,
          price,
          status
        FROM hotel_bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const recentBookingsResult = await query(recentBookingsQuery);
      
      // Revenue by day (last 7 days)
      const revenueQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(price) as revenue,
          COUNT(*) as booking_count
        FROM (
          SELECT created_at, price FROM flight_bookings
          UNION ALL
          SELECT created_at, price FROM hotel_bookings
        ) as all_bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const revenueResult = await query(revenueQuery);
      
      // Pending approvals count
      const pendingApprovalsQuery = `
        SELECT COUNT(*) as count 
        FROM booking_approvals
        WHERE status = 'pending'
      `;
      const pendingApprovalsResult = await query(pendingApprovalsQuery);
      const pendingApprovals = parseInt(pendingApprovalsResult.rows[0].count);
      
      res.json({
        totalBookings: totalFlightBookings + totalHotelBookings,
        flightBookings: {
          total: totalFlightBookings,
          byStatus: flightStatusResult.rows
        },
        hotelBookings: {
          total: totalHotelBookings,
          byStatus: hotelStatusResult.rows
        },
        recentBookings: recentBookingsResult.rows,
        revenueByDay: revenueResult.rows,
        pendingApprovals
      });
    } catch (error) {
      console.error('Error getting booking stats:', error);
      res.status(500).json({ error: "Failed to get booking statistics" });
    }
  });
  
  app.get("/api/admin/stats/destinations", isAdmin, async (req: Request, res: Response) => {
    try {
      // Total destinations count
      const totalDestinationsQuery = `SELECT COUNT(*) as count FROM destinations`;
      const totalDestinationsResult = await query(totalDestinationsQuery);
      const totalDestinations = parseInt(totalDestinationsResult.rows[0].count);
      
      // Most popular destinations (based on trips)
      const popularDestinationsQuery = `
        SELECT 
          d.name,
          d.country,
          COUNT(t.id) as trip_count
        FROM destinations d
        LEFT JOIN trips t ON d.name = t.destination
        GROUP BY d.id, d.name, d.country
        ORDER BY trip_count DESC
        LIMIT 5
      `;
      const popularDestinationsResult = await query(popularDestinationsQuery);
      
      // Destinations by continent/region
      const destinationsByRegionQuery = `
        SELECT 
          region,
          COUNT(*) as count
        FROM destinations
        GROUP BY region
        ORDER BY count DESC
      `;
      const destinationsByRegionResult = await query(destinationsByRegionQuery);
      
      res.json({
        totalDestinations,
        mostPopular: popularDestinationsResult.rows,
        byRegion: destinationsByRegionResult.rows
      });
    } catch (error) {
      console.error('Error getting destination stats:', error);
      res.status(500).json({ error: "Failed to get destination statistics" });
    }
  });
  
  // Dashboard summary (combined stats)
  app.get("/api/admin/dashboard-summary", isAdmin, async (req: Request, res: Response) => {
    try {
      // Users count
      const usersCountQuery = `SELECT COUNT(*) as count FROM users`;
      const usersResult = await query(usersCountQuery);
      const totalUsers = parseInt(usersResult.rows[0].count);
      
      // Trips count
      const tripsCountQuery = `SELECT COUNT(*) as count FROM trips`;
      const tripsResult = await query(tripsCountQuery);
      const totalTrips = parseInt(tripsResult.rows[0].count);
      
      // Bookings count
      const bookingsCountQuery = `
        SELECT 
          (SELECT COUNT(*) FROM flight_bookings) +
          (SELECT COUNT(*) FROM hotel_bookings) as count
      `;
      const bookingsResult = await query(bookingsCountQuery);
      const totalBookings = parseInt(bookingsResult.rows[0].count);
      
      // Pending approvals
      const pendingApprovalsQuery = `
        SELECT COUNT(*) as count FROM booking_approvals
        WHERE status = 'pending'
      `;
      const pendingResult = await query(pendingApprovalsQuery);
      const pendingApprovals = parseInt(pendingResult.rows[0].count);
      
      // Recent booking activity
      const recentActivityQuery = `
        SELECT 
          'flight' as type,
          fb.id,
          u.username,
          fb.created_at,
          fb.price,
          fb.status,
          ba.status as approval_status
        FROM flight_bookings fb
        JOIN users u ON fb.user_id = u.id
        LEFT JOIN booking_approvals ba ON ba.booking_id = fb.id AND ba.booking_type = 'flight'
        UNION ALL
        SELECT 
          'hotel' as type,
          hb.id,
          u.username,
          hb.created_at,
          hb.price,
          hb.status,
          ba.status as approval_status
        FROM hotel_bookings hb
        JOIN users u ON hb.user_id = u.id
        LEFT JOIN booking_approvals ba ON ba.booking_id = hb.id AND ba.booking_type = 'hotel'
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const recentActivityResult = await query(recentActivityQuery);
      
      // Revenue summary
      const revenueQuery = `
        SELECT 
          SUM(price) as total_revenue,
          AVG(price) as average_price,
          COUNT(*) as transaction_count
        FROM (
          SELECT price FROM flight_bookings
          UNION ALL
          SELECT price FROM hotel_bookings
        ) as all_bookings
      `;
      const revenueResult = await query(revenueQuery);
      
      res.json({
        totalUsers,
        totalTrips,
        totalBookings,
        pendingApprovals,
        recentActivity: recentActivityResult.rows,
        revenue: revenueResult.rows[0]
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({ error: "Failed to get dashboard summary" });
    }
  });
  
  // Get all flight bookings (admin)
  app.get("/api/admin/flight-bookings", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get all flight bookings with user details using raw SQL query
      const flightBookingsQuery = `
        SELECT fb.*, 
               u.username as user_username,
               u.email as user_email,
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at
        FROM flight_bookings fb
        JOIN users u ON fb.user_id = u.id
        LEFT JOIN booking_approvals ba ON ba.booking_id = fb.id AND ba.booking_type = 'flight'
        ORDER BY fb.created_at DESC
      `;
      
      const result = await query(flightBookingsQuery);
      
      return res.status(200).json(result.rows.map(booking => ({
        ...booking,
        bookingType: 'flight'
      })));
    } catch (error) {
      console.error("Error fetching all flight bookings:", error);
      return res.status(500).json({ error: "Failed to fetch flight bookings" });
    }
  });
  
  // Get all hotel bookings (admin)
  app.get("/api/admin/hotel-bookings", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get all hotel bookings with user details using raw SQL query
      const hotelBookingsQuery = `
        SELECT hb.*, 
               u.username as user_username,
               u.email as user_email,
               COALESCE(ba.status, 'pending') as approval_status,
               ba.admin_notes as approval_notes,
               ba.updated_at as approval_updated_at
        FROM hotel_bookings hb
        JOIN users u ON hb.user_id = u.id
        LEFT JOIN booking_approvals ba ON ba.booking_id = hb.id AND ba.booking_type = 'hotel'
        ORDER BY hb.created_at DESC
      `;
      
      const result = await query(hotelBookingsQuery);
      
      return res.status(200).json(result.rows.map(booking => ({
        ...booking,
        bookingType: 'hotel'
      })));
    } catch (error) {
      console.error("Error fetching all hotel bookings:", error);
      return res.status(500).json({ error: "Failed to fetch hotel bookings" });
    }
  });

  // MAP SERVICES ENDPOINTS USING RAPIDAPI
  app.get("/api/maps/geocode", async (req: Request, res: Response) => {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }

    try {
      const coordinates = await mapsService.geocodeLocation(location as string);
      
      if (coordinates) {
        res.json({ 
          coordinates,
          success: true
        });
      } else {
        res.json({
          mapUrl: mapsService.getEmbedMapUrl(location as string),
          embedUrl: mapsService.getEmbedMapUrl(location as string),
          success: false,
          message: "Could not geocode location, falling back to basic map"
        });
      }
    } catch (error) {
      console.error("Error in geocode:", error);
      res.status(500).json({ error: "Failed to geocode location" });
    }
  });
  
  app.get("/api/maps/static", async (req: Request, res: Response) => {
    const { location, zoom, width, height } = req.query;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    
    try {
      const mapUrl = await mapsService.getStaticMapUrl(
        location as string, 
        zoom ? parseInt(zoom as string) : 13,
        width ? parseInt(width as string) : 600,
        height ? parseInt(height as string) : 400
      );
      
      res.json({ mapUrl });
    } catch (error) {
      console.error("Error getting static map:", error);
      res.status(500).json({ error: "Failed to generate static map" });
    }
  });
  
  app.get("/api/maps/directions", async (req: Request, res: Response) => {
    const { origin, destination, mode } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: "Origin and destination are required" });
    }
    
    try {
      const directions = await mapsService.getDirections(
        origin as string,
        destination as string,
        mode as string || 'driving'
      );
      
      res.json({ directions });
    } catch (error) {
      console.error("Error getting directions:", error);
      res.status(500).json({ error: "Failed to get directions" });
    }
  });
  
  app.get("/api/maps/nearby", async (req: Request, res: Response) => {
    const { location, type, radius } = req.query;
    if (!location || !type) {
      return res.status(400).json({ error: "Location and type are required" });
    }
    
    try {
      const places = await mapsService.getNearbyPlaces(
        location as string,
        type as string,
        radius ? parseInt(radius as string) : 5000
      );
      
      res.json({ places });
    } catch (error) {
      console.error("Error getting nearby places:", error);
      res.status(500).json({ error: "Failed to get nearby places" });
    }
  });
  
  app.get("/api/maps/embed", (req: Request, res: Response) => {
    const { location, zoom } = req.query;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    
    const embedUrl = mapsService.getEmbedMapUrl(
      location as string,
      zoom ? parseInt(zoom as string) : 13
    );
    
    res.json({ embedUrl });
  });
  
  // Proxy endpoint for Google Maps photos with proper headers
  app.get("/api/maps/photo", async (req: Request, res: Response) => {
    const reference = req.query.reference as string;
    const maxwidth = parseInt(req.query.maxwidth as string) || 800;
    
    if (!reference) {
      return res.status(400).json({ error: 'Photo reference is required' });
    }
    
    try {
      // Build the Google Maps Place Photo API URL with RapidAPI
      const url = `https://google-map-places-new-v2.p.rapidapi.com/photo`;
      const headers = {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'google-map-places-new-v2.p.rapidapi.com'
      };
      
      // We'll proxy the request and stream it back to preserve image data
      const response = await axios({
        method: 'GET',
        url,
        params: {
          maxwidth: maxwidth.toString(),
          photoreference: reference,
          key: 'rapidapi' // Placeholder for RapidAPI
        },
        headers,
        responseType: 'stream'
      });
      
      // Set headers from the original response
      res.set('Content-Type', response.headers['content-type']);
      
      // Pipe the response directly to our client
      response.data.pipe(res);
    } catch (error) {
      console.error('Error fetching photo:', error);
      // Redirect to a fallback image on error
      res.redirect(`https://source.unsplash.com/640x480/?hotel,destination,travel`);
    }
  });
  
  // Search for places via Google Maps API
  app.get("/api/maps/places/search", async (req: Request, res: Response) => {
    const { query, type } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    try {
      const places = await mapsService.searchPlaces(
        query as string,
        type as string || ''
      );
      
      res.json(places || []);
    } catch (error) {
      console.error("Error searching places:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });
  
  // Get hotel details and images via Google Maps API
  app.get("/api/maps/hotels", async (req: Request, res: Response) => {
    const { name, destination } = req.query;
    if (!name || !destination) {
      return res.status(400).json({ error: "Hotel name and destination are required" });
    }
    
    try {
      const hotelDetails = await mapsService.getHotelDetails(
        name as string,
        destination as string
      );
      
      res.json(hotelDetails || []);
    } catch (error) {
      console.error("Error getting hotel details:", error);
      res.status(500).json({ error: "Failed to get hotel details" });
    }
  });
  
  // Get place details by ID
  app.get("/api/maps/places/:id", async (req: Request, res: Response) => {
    const placeId = req.params.id;
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }
    
    try {
      const placeDetails = await mapsService.getPlaceDetailsById(placeId);
      res.json(placeDetails || { error: "Place not found" });
    } catch (error) {
      console.error("Error getting place details:", error);
      res.status(500).json({ error: "Failed to get place details" });
    }
  });

  // TripAdvisor API routes

  // Search for hotels and places with images
  app.get("/api/tripadvisor/search", async (req: Request, res: Response) => {
    try {
      const { query, type = 'hotels' } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      
      console.log(`Searching TripAdvisor for: ${query} (type: ${type})`);
      
      // Use our new combined search method
      const searchResults = await tripAdvisorApi.searchByQueryAndType(
        query as string, 
        type as string
      );
      
      // If we got results from the API, return them
      if (searchResults && searchResults.length > 0) {
        console.log(`Found ${searchResults.length} results from TripAdvisor`);
        return res.json(searchResults);
      }
      
      console.log('No results from TripAdvisor API, using fallback images');
      
      // If no results or API fails, provide fallback images
      const destination = (query as string).toLowerCase();
      const queryType = (type as string).toLowerCase();
      
      // Generate sample image URLs based on destination and type
      const sampleImages = [];
      const count = queryType === 'hotels' ? 8 : 6;
      
      for (let i = 1; i <= count; i++) {
        let typeName = '';
        
        if (queryType === 'hotels') {
          typeName = 'Hotel';
        } else if (queryType === 'restaurants') {
          typeName = 'Restaurant';
        } else {
          typeName = 'Place';
        }
        
        // Extract hotel name from query if it has format "Hotel Name in Location"
        let name = `${typeName} in ${query}`;
        if (queryType === 'hotels' && String(query).toLowerCase().includes(' in ')) {
          name = String(query).split(' in ')[0].trim();
        }
        
        sampleImages.push({
          id: `sample-${queryType}-${i}`,
          name: name,
          image: `https://source.unsplash.com/640x480/?${destination},${queryType}`,
          type: queryType,
          rating: (3 + Math.random() * 2).toFixed(1),
          reviewCount: `${Math.floor(50 + Math.random() * 950)}`
        });
      }
      
      return res.json(sampleImages);
    } catch (error) {
      console.error('Error in TripAdvisor search API:', error);
      
      // If any error occurs, still provide sample data for a good user experience
      const destination = (req.query.query as string).toLowerCase();
      const queryType = ((req.query.type as string) || 'hotels').toLowerCase();
      
      const sampleImages = [];
      const count = queryType === 'hotels' ? 8 : 6;
      
      for (let i = 1; i <= count; i++) {
        let typeName = queryType === 'hotels' ? 'Hotel' : 
                      queryType === 'restaurants' ? 'Restaurant' : 'Place';
        
        sampleImages.push({
          id: `sample-${queryType}-${i}`,
          name: `${typeName} in ${req.query.query}`,
          image: `https://source.unsplash.com/640x480/?${destination},${queryType}`,
          type: queryType,
          rating: (3 + Math.random() * 2).toFixed(1),
          reviewCount: `${Math.floor(50 + Math.random() * 950)}`
        });
      }
      
      res.json(sampleImages);
    }
  });

  // Get specific hotel images
  app.get("/api/tripadvisor/hotels/:id/images", async (req: Request, res: Response) => {
    try {
      const hotelId = req.params.id;
      console.log(`Fetching images for hotel ID: ${hotelId}`);
      
      // If it's a sample ID, we should generate fallback images
      if (hotelId.startsWith('sample-')) {
        console.log('Using fallback images for sample hotel ID');
        const parts = hotelId.split('-');
        let theme = 'hotel';
        
        if (parts.length >= 2) {
          theme = parts[1]; // Get the theme part (hotels, restaurants, etc.)
        }
        
        // Generate sample images for the hotel
        const sampleImages = [];
        const count = 9;
        
        for (let i = 1; i <= count; i++) {
          sampleImages.push({
            url: `https://source.unsplash.com/640x480/?${theme},interior,${i}`
          });
        }
        
        return res.json({ 
          id: hotelId,
          images: sampleImages
        });
      }
      
      // For real hotel IDs, try to fetch from TripAdvisor
      // Extract hotel name from the query if provided
      const { hotelName, destination } = req.query;
      
      // If we have both hotel name and destination, we can do a search
      if (hotelName && destination) {
        console.log(`Searching for hotel: ${hotelName} in ${destination}`);
        const searchResults = await tripAdvisorApi.searchHotelsByName(
          hotelName as string, 
          destination as string
        );
        
        if (searchResults && searchResults.length > 0) {
          // Return the images from the first matching hotel
          const hotel = searchResults[0];
          
          if (hotel.image) {
            return res.json({
              id: hotelId,
              images: [{ url: hotel.image }]
            });
          }
        }
      }
      
      // If we don't have search params or search failed, try direct photo lookup
      console.log(`Attempting direct photo lookup for hotel ID: ${hotelId}`);
      
      // A simplified version of the response format for easier debugging
      const sampleImages = [];
      const count = 6;
      
      for (let i = 1; i <= count; i++) {
        sampleImages.push({
          url: `https://source.unsplash.com/640x480/?hotel,accommodation,${i}`
        });
      }
      
      return res.json({
        id: hotelId,
        images: sampleImages
      });
    } catch (error) {
      console.error('Error fetching hotel images:', error);
      
      // Provide fallback images on error
      const sampleImages = [];
      const count = 6;
      
      for (let i = 1; i <= count; i++) {
        sampleImages.push({
          url: `https://source.unsplash.com/640x480/?hotel,accommodation,${i}`
        });
      }
      
      res.json({ 
        id: req.params.id,
        images: sampleImages
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
