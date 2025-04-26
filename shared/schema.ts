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
export interface Analytics {
  id: number;
  eventType: string; // 'login', 'trip_created', 'search', etc.
  userId?: number;
  data?: any; // Store event-specific data
  createdAt: Date;
}

export const insertAnalyticsSchema = z.object({
  eventType: z.string(),
  userId: z.number().optional(),
  data: z.any().optional(),
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
export interface AiPrompt {
  id: number;
  name: string;
  prompt: string;
  description?: string;
  category: string; // 'trip_planning', 'destination_info', etc.
  isActive: boolean;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const insertAiPromptSchema = z.object({
  name: z.string(),
  prompt: z.string(),
  description: z.string().optional(),
  category: z.string(),
  isActive: z.boolean().default(true),
  createdBy: z.number().optional(),
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
export interface FlightSearch {
  id: number;
  userId: number;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD for round trips
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string; // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
  tripType?: string; // ONE_WAY, ROUND_TRIP, MULTI_CITY
  maxPrice?: number;
  currencyCode?: string;
  createdAt: Date;
}

export const insertFlightSearchSchema = z.object({
  userId: z.number(),
  originLocationCode: z.string(),
  destinationLocationCode: z.string(),
  departureDate: z.string(), // YYYY-MM-DD
  returnDate: z.string().optional(), // YYYY-MM-DD for round trips
  adults: z.number().default(1),
  children: z.number().default(0).optional(),
  infants: z.number().default(0).optional(),
  travelClass: z.string().default("ECONOMY").optional(), // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
  tripType: z.string().default("ONE_WAY").optional(), // ONE_WAY, ROUND_TRIP, MULTI_CITY
  maxPrice: z.number().optional(),
  currencyCode: z.string().default("USD").optional(),
});

// User settings table for storing user preferences
export interface UserSettings {
  id: number;
  userId: number;
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertUserSettingsSchema = z.object({
  userId: z.number(),
  theme: z.string().default("light"),
  language: z.string().default("en"),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  currency: z.string().default("USD"),
});

// Wishlist items table
export interface WishlistItem {
  id: number;
  userId: number;
  itemType: string; // e.g., "destination", "hotel", "experience", "trip"
  itemId: string; // ID of the saved item
  itemName: string; // Name of the saved item
  itemImage?: string; // Image URL of the saved item
  additionalData?: any; // Any additional data about the item
  createdAt: Date;
}

export const insertWishlistItemSchema = z.object({
  userId: z.number(),
  itemType: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  itemImage: z.string().optional(),
  additionalData: z.any().optional(),
});

// Flight bookings table for tracking flight reservations
export interface FlightBooking {
  id: number;
  userId: number;
  
  // Flight details
  flightNumber: string;
  airline: string;
  departureAirport: string;
  departureCode: string;
  departureTime: string; // Store as text and convert when needed
  arrivalAirport: string;
  arrivalCode: string;
  arrivalTime: string; // Store as text and convert when needed
  tripType: string; // ONE_WAY, ROUND_TRIP
  
  // Return flight info (if round trip)
  returnFlightNumber?: string;
  returnAirline?: string;
  returnDepartureTime?: string; // Store as text and convert when needed
  returnArrivalTime?: string; // Store as text and convert when needed
  
  // Booking details
  bookingReference: string;
  price: number;
  currency: string;
  status: string; // confirmed, cancelled, completed
  cabinClass: string;
  
  // Passenger details 
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  
  // Flight details as JSON for additional details
  flightDetails?: any;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export const insertFlightBookingSchema = z.object({
  userId: z.number(),
  
  // Flight details
  flightNumber: z.string(),
  airline: z.string(),
  departureAirport: z.string(),
  departureCode: z.string(),
  departureTime: z.string(),
  arrivalAirport: z.string(),
  arrivalCode: z.string(),
  arrivalTime: z.string(),
  tripType: z.string(),
  
  // Return flight info (if round trip)
  returnFlightNumber: z.string().optional(),
  returnAirline: z.string().optional(),
  returnDepartureTime: z.string().optional(),
  returnArrivalTime: z.string().optional(),
  
  // Booking details
  bookingReference: z.string(),
  price: z.number(),
  currency: z.string().default("USD"),
  status: z.string().default("confirmed"),
  cabinClass: z.string().default("ECONOMY"),
  
  // Passenger details 
  passengerName: z.string().optional(),
  passengerEmail: z.string().optional(),
  passengerPhone: z.string().optional(),
  
  // Flight details as JSON for additional details
  flightDetails: z.any().optional(),
});

// Hotel searches table for tracking user hotel search history
export interface HotelSearch {
  id: number;
  userId: number;
  location: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  rooms: number;
  createdAt: Date;
  updatedAt: Date;
}

export const insertHotelSearchSchema = z.object({
  userId: z.number(),
  location: z.string(),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  guests: z.number().default(1),
  rooms: z.number().default(1),
});

// Hotel bookings table for tracking hotel reservations
export interface HotelBooking {
  id: number;
  userId: number;
  
  // Hotel details
  hotelId: string;
  hotelName: string;
  hotelImage?: string;
  hotelAddress: string;
  hotelCity: string;
  hotelCountry: string;
  hotelRating?: number;
  
  // Booking details
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  rooms: number;
  price: number;
  currency: string;
  status: string; // CONFIRMED, PENDING, CANCELLED
  bookingReference: string;
  
  // Guest details
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export const insertHotelBookingSchema = z.object({
  userId: z.number(),
  
  // Hotel details
  hotelId: z.string(),
  hotelName: z.string(),
  hotelImage: z.string().optional(),
  hotelAddress: z.string(),
  hotelCity: z.string(),
  hotelCountry: z.string(),
  hotelRating: z.number().optional(),
  
  // Booking details
  roomType: z.string(),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  guests: z.number().default(1),
  rooms: z.number().default(1),
  price: z.number(),
  currency: z.string().default("USD"),
  status: z.string().default("CONFIRMED"),
  bookingReference: z.string(),
  
  // Guest details
  guestName: z.string(),
  guestEmail: z.string(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

// AI conversation logs for admin monitoring
export interface AiConversationLog {
  id: number;
  userId?: number;
  userQuery: string;
  aiResponse?: string;
  queryType?: string; // 'trip_planning', 'destination_info', 'general', etc.
  sentimentScore?: number; // Optional sentiment analysis score
  createdAt: Date;
  metadata?: any; // Additional metadata about the conversation
}

export const insertAiConversationLogSchema = z.object({
  userId: z.number().optional(),
  userQuery: z.string(),
  aiResponse: z.string().optional(),
  queryType: z.string().optional(),
  sentimentScore: z.number().optional(),
  metadata: z.any().optional(),
});

// User notifications from admins
export interface Notification {
  id: number;
  userId?: number; // If null, sends to all users
  adminId: number;
  title: string;
  message: string;
  type: string; // 'announcement', 'deal', 'update', 'warning', etc.
  isRead: boolean;
  link?: string; // Optional link to redirect when notification is clicked
  validUntil?: Date; // Optional expiration date
  createdAt: Date;
}

export const insertNotificationSchema = z.object({
  userId: z.number().optional(),
  adminId: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  isRead: z.boolean().default(false),
  link: z.string().optional(),
  validUntil: z.date().optional(),
});

// Booking approval status tracking
export interface BookingApproval {
  id: number;
  bookingType: string; // 'flight', 'hotel'
  bookingId: number;
  status: string; // 'pending', 'approved', 'rejected'
  adminId?: number;
  adminNotes?: string;
  updatedAt: Date;
  createdAt: Date;
}

export const insertBookingApprovalSchema = z.object({
  bookingType: z.string(),
  bookingId: z.number(),
  status: z.string().default("pending"),
  adminId: z.number().optional(),
  adminNotes: z.string().optional(),
});

// Search analytics for tracking popular destinations
export interface SearchAnalytics {
  id: number;
  searchType: string; // 'flight', 'hotel', 'destination'
  searchTerm: string;
  userId?: number;
  resultCount?: number;
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  hourOfDay?: number; // 0-23
  createdAt: Date;
}

export const insertSearchAnalyticsSchema = z.object({
  searchType: z.string(),
  searchTerm: z.string(),
  userId: z.number().optional(),
  resultCount: z.number().optional(),
  dayOfWeek: z.number().optional(),
  hourOfDay: z.number().optional(),
});

// Export insert type declarations for all interfaces
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertTripDay = z.infer<typeof insertTripDaySchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertFlightSearch = z.infer<typeof insertFlightSearchSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type InsertFlightBooking = z.infer<typeof insertFlightBookingSchema>;
export type InsertHotelSearch = z.infer<typeof insertHotelSearchSchema>;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;
export type InsertBookingApproval = z.infer<typeof insertBookingApprovalSchema>;
export type InsertAiConversationLog = z.infer<typeof insertAiConversationLogSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertSearchAnalytics = z.infer<typeof insertSearchAnalyticsSchema>;
