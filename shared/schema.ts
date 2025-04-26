import { z } from "zod";

// Define TypeScript interfaces instead of Drizzle schema
export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  googleId?: string;
  role: string; // 'user', 'admin', 'moderator'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define validation schemas with Zod
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  googleId: z.string().optional(),
  role: z.string().default("user"),
  isActive: z.boolean().default(true),
});

export interface Trip {
  id: number;
  userId: number;
  title: string;
  destination: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  preferences?: string[];
  status: string; // 'draft', 'planned', 'ongoing', 'completed'
  createdAt: Date;
  updatedAt: Date;
}

export const insertTripSchema = z.object({
  userId: z.number(),
  title: z.string(),
  destination: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  status: z.string().default("draft"),
});

export interface TripDay {
  id: number;
  tripId: number;
  dayNumber: number;
  date?: Date;
  title: string;
  createdAt: Date;
}

export const insertTripDaySchema = z.object({
  tripId: z.number(),
  dayNumber: z.number(),
  date: z.date().optional(),
  title: z.string(),
});

export interface Activity {
  id: number;
  tripDayId: number;
  title: string;
  description?: string;
  time?: string;
  location?: string;
  type?: string;
  bookingId?: number;
  createdAt: Date;
}

export const insertActivitySchema = z.object({
  tripDayId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  bookingId: z.number().optional(),
});

export interface Booking {
  id: number;
  tripId: number;
  type: string; // "flight", "hotel", "activity"
  title: string;
  provider?: string;
  price?: string;
  details?: any; // JSON data
  confirmed: boolean;
  createdAt: Date;
}

export const insertBookingSchema = z.object({
  tripId: z.number(),
  type: z.string(),
  title: z.string(),
  provider: z.string().optional(),
  price: z.string().optional(),
  details: z.any().optional(),
  confirmed: z.boolean().default(false)
});

export interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  imageUrl?: string;
  rating?: string;
  reviewCount?: number;
  priceEstimate?: string;
  createdAt: Date;
}

export const insertDestinationSchema = z.object({
  name: z.string(),
  country: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  rating: z.string().optional(),
  reviewCount: z.number().optional(),
  priceEstimate: z.string().optional(),
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
export interface AdminLog {
  id: number;
  adminId: number;
  action: string; // 'user_blocked', 'destination_added', etc.
  entityType?: string; // 'user', 'trip', 'destination', etc.
  entityId?: number; // ID of the affected entity
  details?: string; // Additional information
  createdAt: Date;
}

export const insertAdminLogSchema = z.object({
  adminId: z.number(),
  action: z.string(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
  details: z.string().optional(),
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
export interface Review {
  id: number;
  userId: number;
  targetType: string; // 'hotel', 'restaurant', 'attraction', 'trip'
  targetId: string; // Could be an external ID for hotels/restaurants or an internal ID for trips
  title: string;
  content: string;
  rating: number; // 1-5 rating
  images?: string[]; // Array of image URLs
  createdAt: Date;
  updatedAt?: Date;
  isApproved: boolean;
  helpfulCount: number;
  reportCount: number;
}

export const insertReviewSchema = z.object({
  userId: z.number(),
  targetType: z.string(),
  targetId: z.string(),
  title: z.string(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  images: z.array(z.string()).optional(),
  isApproved: z.boolean().default(true),
});

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

// AI conversation logs for admin monitoring
export const aiConversationLogs = pgTable("ai_conversation_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userQuery: text("user_query").notNull(),
  aiResponse: text("ai_response"),
  queryType: text("query_type"), // 'trip_planning', 'destination_info', 'general', etc.
  sentimentScore: numeric("sentiment_score"), // Optional sentiment analysis score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Additional metadata about the conversation
});

export const insertAiConversationLogSchema = createInsertSchema(aiConversationLogs).omit({
  id: true,
  createdAt: true,
});

export const aiConversationLogRelations = relations(aiConversationLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiConversationLogs.userId],
    references: [users.id],
  }),
}));

// User notifications from admins
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // If null, sends to all users
  adminId: integer("admin_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'announcement', 'deal', 'update', 'warning', etc.
  isRead: boolean("is_read").default(false),
  link: text("link"), // Optional link to redirect when notification is clicked
  validUntil: timestamp("valid_until"), // Optional expiration date
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [notifications.adminId],
    references: [users.id],
  }),
}));

// Booking approval status tracking
export const bookingApprovals = pgTable("booking_approvals", {
  id: serial("id").primaryKey(),
  bookingType: text("booking_type").notNull(), // 'flight', 'hotel'
  bookingId: integer("booking_id").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  adminId: integer("admin_id").references(() => users.id),
  adminNotes: text("admin_notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingApprovalSchema = createInsertSchema(bookingApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const bookingApprovalRelations = relations(bookingApprovals, ({ one }) => ({
  admin: one(users, {
    fields: [bookingApprovals.adminId],
    references: [users.id],
  }),
}));

// Search analytics for tracking popular destinations
export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  searchType: text("search_type").notNull(), // 'flight', 'hotel', 'destination'
  searchTerm: text("search_term").notNull(),
  userId: integer("user_id").references(() => users.id),
  resultCount: integer("result_count"),
  dayOfWeek: integer("day_of_week"), // 0-6 for Sunday-Saturday
  hourOfDay: integer("hour_of_day"), // 0-23
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSearchAnalyticsSchema = createInsertSchema(searchAnalytics).omit({
  id: true,
  createdAt: true,
});

export const searchAnalyticsRelations = relations(searchAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [searchAnalytics.userId],
    references: [users.id],
  }),
}));

// Update user relations to include all user-related entities
export const userWishlistRelation = relations(users, ({ many }) => ({
  wishlistItems: many(wishlistItems),
  flightBookings: many(flightBookings),
  hotelBookings: many(hotelBookings),
  notifications: many(notifications),
  aiConversationLogs: many(aiConversationLogs),
  searchAnalytics: many(searchAnalytics),
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
export type AiConversationLog = typeof aiConversationLogs.$inferSelect;
export type InsertAiConversationLog = z.infer<typeof insertAiConversationLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type BookingApproval = typeof bookingApprovals.$inferSelect;
export type InsertBookingApproval = z.infer<typeof insertBookingApprovalSchema>;
export type SearchAnalytic = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalytic = z.infer<typeof insertSearchAnalyticsSchema>;
