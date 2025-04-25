import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  phone: text("phone"),
  googleId: text("google_id").unique(),
  role: text("role").default("user").notNull(), // 'user', 'admin', 'moderator'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImage: true,
  bio: true,
  phone: true,
  googleId: true,
  role: true,
  isActive: true,
});

export const userRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  trips: many(trips),
  reviews: many(reviews),
  flightSearches: many(flightSearches),
}));

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: text("budget"),
  preferences: text("preferences").array(),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const tripRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  days: many(tripDays),
  bookings: many(bookings),
}));

export const tripDays = pgTable("trip_days", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  dayNumber: integer("day_number").notNull(),
  date: date("date"),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripDaySchema = createInsertSchema(tripDays).omit({
  id: true,
  createdAt: true,
});

export const tripDayRelations = relations(tripDays, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripDays.tripId],
    references: [trips.id],
  }),
  activities: many(activities),
}));

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  tripDayId: integer("trip_day_id").notNull().references(() => tripDays.id),
  title: text("title").notNull(),
  description: text("description"),
  time: text("time"),
  location: text("location"),
  type: text("type"),
  bookingId: integer("booking_id").references(() => bookings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const activityRelations = relations(activities, ({ one }) => ({
  tripDay: one(tripDays, {
    fields: [activities.tripDayId],
    references: [tripDays.id],
  }),
  booking: one(bookings, {
    fields: [activities.bookingId],
    references: [bookings.id],
  }),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  type: text("type").notNull(), // "flight", "hotel", "activity"
  title: text("title").notNull(),
  provider: text("provider"),
  price: text("price"),
  details: json("details"),
  confirmed: boolean("confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  trip: one(trips, {
    fields: [bookings.tripId],
    references: [trips.id],
  }),
  activities: many(activities),
}));

export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  rating: text("rating"),
  reviewCount: integer("review_count"),
  priceEstimate: text("price_estimate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
  createdAt: true,
});

// Analytics tables
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // 'login', 'trip_created', 'search', etc.
  userId: integer("user_id").references(() => users.id),
  data: json("data"), // Store event-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

// Admin logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'user_blocked', 'destination_added', etc.
  entityType: text("entity_type"), // 'user', 'trip', 'destination', etc.
  entityId: integer("entity_id"), // ID of the affected entity
  details: text("details"), // Additional information
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

// AI prompts for admins to customize
export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'trip_planning', 'destination_info', etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reviews table for user reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), // 'hotel', 'restaurant', 'attraction', 'trip'
  targetId: text("target_id").notNull(), // Could be an external ID for hotels/restaurants or an internal ID for trips
  title: text("title").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 rating
  images: text("images").array(), // Array of image URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  isApproved: boolean("is_approved").default(true),
  helpfulCount: integer("helpful_count").default(0),
  reportCount: integer("report_count").default(0),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  reportCount: true,
});

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Flight searches table for tracking user flight search history
export const flightSearches = pgTable("flight_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  originLocationCode: text("origin_location_code").notNull(),
  destinationLocationCode: text("destination_location_code").notNull(),
  departureDate: text("departure_date").notNull(), // YYYY-MM-DD
  returnDate: text("return_date"), // YYYY-MM-DD for round trips
  adults: integer("adults").notNull().default(1),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  travelClass: text("travel_class").default("ECONOMY"), // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
  tripType: text("trip_type").default("ONE_WAY"), // ONE_WAY, ROUND_TRIP, MULTI_CITY
  maxPrice: integer("max_price"),
  currencyCode: text("currency_code").default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFlightSearchSchema = createInsertSchema(flightSearches).omit({
  id: true,
  createdAt: true,
});

export const flightSearchRelations = relations(flightSearches, ({ one }) => ({
  user: one(users, {
    fields: [flightSearches.userId],
    references: [users.id],
  }),
}));

// User settings table for storing user preferences
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  theme: text("theme").default("light"),
  language: text("language").default("en"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Wishlist items table
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemType: text("item_type").notNull(), // e.g., "destination", "hotel", "experience", "trip"
  itemId: text("item_id").notNull(), // ID of the saved item
  itemName: text("item_name").notNull(), // Name of the saved item
  itemImage: text("item_image"), // Image URL of the saved item
  additionalData: jsonb("additional_data"), // Any additional data about the item
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true, 
  createdAt: true,
});

export const wishlistItemRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
}));

// Flight bookings table for tracking flight reservations
export const flightBookings = pgTable("flight_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Flight details
  flightNumber: text("flight_number").notNull(),
  airline: text("airline").notNull(),
  departureAirport: text("departure_airport").notNull(),
  departureCode: text("departure_code").notNull(),
  departureTime: text("departure_time").notNull(), // Store as text and convert when needed
  arrivalAirport: text("arrival_airport").notNull(),
  arrivalCode: text("arrival_code").notNull(),
  arrivalTime: text("arrival_time").notNull(), // Store as text and convert when needed
  tripType: text("trip_type").notNull(), // ONE_WAY, ROUND_TRIP
  
  // Return flight info (if round trip)
  returnFlightNumber: text("return_flight_number"),
  returnAirline: text("return_airline"),
  returnDepartureTime: text("return_departure_time"), // Store as text and convert when needed
  returnArrivalTime: text("return_arrival_time"), // Store as text and convert when needed
  
  // Booking details
  bookingReference: text("booking_reference").notNull(),
  price: numeric("price").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("confirmed").notNull(), // confirmed, cancelled, completed
  cabinClass: text("cabin_class").default("ECONOMY").notNull(),
  
  // Passenger details 
  passengerName: text("passenger_name"),
  passengerEmail: text("passenger_email"),
  passengerPhone: text("passenger_phone"),
  
  // Flight details as JSON for additional details
  flightDetails: json("flight_details"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFlightBookingSchema = createInsertSchema(flightBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const flightBookingRelations = relations(flightBookings, ({ one }) => ({
  user: one(users, {
    fields: [flightBookings.userId],
    references: [users.id],
  }),
}));

// Hotel searches table for tracking user hotel search history
export const hotelSearches = pgTable("hotel_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  guests: integer("guests").default(1).notNull(),
  rooms: integer("rooms").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHotelSearchSchema = createInsertSchema(hotelSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const hotelSearchRelations = relations(hotelSearches, ({ one }) => ({
  user: one(users, {
    fields: [hotelSearches.userId],
    references: [users.id],
  }),
}));

// Hotel bookings table for tracking hotel reservations
export const hotelBookings = pgTable("hotel_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Hotel details
  hotelId: text("hotel_id").notNull(),
  hotelName: text("hotel_name").notNull(),
  hotelImage: text("hotel_image"),
  hotelAddress: text("hotel_address").notNull(),
  hotelCity: text("hotel_city").notNull(),
  hotelCountry: text("hotel_country").notNull(),
  hotelRating: numeric("hotel_rating", { precision: 3, scale: 1 }),
  
  // Booking details
  roomType: text("room_type").notNull(),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  guests: integer("guests").default(1).notNull(),
  rooms: integer("rooms").default(1).notNull(),
  price: numeric("price").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("CONFIRMED").notNull(), // CONFIRMED, PENDING, CANCELLED
  bookingReference: text("booking_reference").notNull(),
  
  // Guest details
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone"),
  specialRequests: text("special_requests"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHotelBookingSchema = createInsertSchema(hotelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const hotelBookingRelations = relations(hotelBookings, ({ one }) => ({
  user: one(users, {
    fields: [hotelBookings.userId],
    references: [users.id],
  }),
}));

// Update user relations to include all user-related entities
export const userWishlistRelation = relations(users, ({ many }) => ({
  wishlistItems: many(wishlistItems),
  flightBookings: many(flightBookings),
  hotelBookings: many(hotelBookings),
  hotelSearches: many(hotelSearches),
}));

// Export type declarations for all tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type TripDay = typeof tripDays.$inferSelect;
export type InsertTripDay = z.infer<typeof insertTripDaySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type FlightSearch = typeof flightSearches.$inferSelect;
export type InsertFlightSearch = z.infer<typeof insertFlightSearchSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type FlightBooking = typeof flightBookings.$inferSelect;
export type InsertFlightBooking = z.infer<typeof insertFlightBookingSchema>;
export type HotelSearch = typeof hotelSearches.$inferSelect;
export type InsertHotelSearch = z.infer<typeof insertHotelSearchSchema>;
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;
