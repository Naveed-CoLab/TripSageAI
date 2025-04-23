import { 
  users, 
  trips, 
  tripDays, 
  activities, 
  bookings,
  destinations,
  reviews,
  flightSearches,
  userSettings,
  wishlistItems,
  type User, 
  type InsertUser, 
  type Trip, 
  type InsertTrip,
  type TripDay,
  type InsertTripDay,
  type Activity,
  type InsertActivity,
  type Booking,
  type InsertBooking,
  type Destination,
  type InsertDestination,
  type Review,
  type InsertReview,
  type FlightSearch,
  type InsertFlightSearch,
  type UserSettings,
  type InsertUserSettings,
  type WishlistItem,
  type InsertWishlistItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Get the correct session store type
const PostgresSessionStore = connectPg(session);
type SessionStoreType = ReturnType<typeof PostgresSessionStore>;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  updateUserPassword(id: number, newPassword: string): Promise<User>;
  updateUserEmail(id: number, newEmail: string): Promise<User>;
  updateUserProfileImage(id: number, imageUrl: string): Promise<User>;
  getUserCount(): Promise<number>;
  getNewUserCountToday(): Promise<number>;
  
  // User settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings>;
  
  // Admin methods
  getTripCount(): Promise<number>;
  getNewTripCountToday(): Promise<number>;

  // Trip methods
  getTripsByUserId(userId: number): Promise<Trip[]>;
  getTripById(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: InsertTrip): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Trip day methods
  getTripDaysByTripId(tripId: number): Promise<TripDay[]>;
  getTripDayById(id: number): Promise<TripDay | undefined>;
  createTripDay(tripDay: InsertTripDay): Promise<TripDay>;
  updateTripDay(id: number, tripDay: InsertTripDay): Promise<TripDay>;
  deleteTripDay(id: number): Promise<void>;

  // Activity methods
  getActivitiesByTripDayId(tripDayId: number): Promise<Activity[]>;
  getActivityById(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;

  // Booking methods
  getBookingsByTripId(tripId: number): Promise<Booking[]>;
  getBookingById(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;

  // Flight Booking methods
  getFlightBookingsByUserId(userId: number): Promise<FlightBooking[]>;
  getFlightBookingById(id: number): Promise<FlightBooking | undefined>;
  createFlightBooking(booking: InsertFlightBooking): Promise<FlightBooking>;
  updateFlightBooking(id: number, booking: Partial<FlightBooking>): Promise<FlightBooking>;
  deleteFlightBooking(id: number): Promise<void>;
  getFlightBookingsByStatus(userId: number, status: string): Promise<FlightBooking[]>;

  // Destination methods
  getAllDestinations(): Promise<Destination[]>;
  getDestinationById(id: number): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;

  // Review methods
  getReviewsByTargetTypeAndId(targetType: string, targetId: string): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  getReviewById(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, reviewData: Partial<Review>): Promise<Review>;
  deleteReview(id: number): Promise<void>;
  markReviewHelpful(id: number): Promise<Review>;
  reportReview(id: number): Promise<Review>;
  
  // Flight search methods
  getFlightSearchesByUserId(userId: number): Promise<FlightSearch[]>;
  createFlightSearch(flightSearch: InsertFlightSearch): Promise<FlightSearch>;
  deleteFlightSearch(id: number): Promise<void>;
  
  // Wishlist methods
  getWishlistItemsByUserId(userId: number): Promise<WishlistItem[]>;
  getWishlistItemById(id: number): Promise<WishlistItem | undefined>;
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  deleteWishlistItem(id: number): Promise<void>;
  getWishlistItemByTypeAndId(userId: number, itemType: string, itemId: string): Promise<WishlistItem | undefined>;

  // Session store
  sessionStore: any; // Using any type to bypass the SessionStore type issue
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any type to bypass the SessionStore type issue

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserEmail(id: number, newEmail: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ email: newEmail, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ profileImage: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: number, settingsData: Partial<UserSettings>): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    
    if (!existingSettings) {
      // If settings don't exist yet, create them
      return this.createUserSettings({ userId, ...settingsData } as InsertUserSettings);
    }
    
    // Otherwise update existing settings
    const [updatedSettings] = await db
      .update(userSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updatedSettings;
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }
  
  async getNewUserCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, today));
    
    return result[0].count;
  }
  
  async getTripCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(trips);
    return result[0].count;
  }
  
  async getNewTripCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: count() })
      .from(trips)
      .where(gte(trips.createdAt, today));
    
    return result[0].count;
  }

  // Trip methods
  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: number, trip: InsertTrip): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...trip, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<void> {
    try {
      // Start transaction for atomicity
      await db.transaction(async (tx) => {
        // First, get all trip days to find related activities
        const tripDaysResult = await tx.select().from(tripDays).where(eq(tripDays.tripId, id));
        
        // Delete activities for each trip day
        for (const day of tripDaysResult) {
          await tx.delete(activities).where(eq(activities.tripDayId, day.id));
        }
        
        // Delete bookings that might be related to activities
        await tx.delete(bookings).where(eq(bookings.tripId, id));
        
        // Delete the trip days after activities are removed
        await tx.delete(tripDays).where(eq(tripDays.tripId, id));
        
        // Finally delete the trip itself
        const result = await tx.delete(trips).where(eq(trips.id, id)).returning({ id: trips.id });
        
        if (result.length === 0) {
          throw new Error(`Trip with ID ${id} not found or could not be deleted`);
        }
      });
      
      console.log(`Successfully deleted trip with ID ${id} and all related data`);
    } catch (error) {
      console.error(`Error deleting trip with ID ${id}:`, error);
      throw error;
    }
  }

  // Trip day methods
  async getTripDaysByTripId(tripId: number): Promise<TripDay[]> {
    return db.select().from(tripDays).where(eq(tripDays.tripId, tripId)).orderBy(tripDays.dayNumber);
  }

  async getTripDayById(id: number): Promise<TripDay | undefined> {
    const [day] = await db.select().from(tripDays).where(eq(tripDays.id, id));
    return day;
  }

  async createTripDay(tripDay: InsertTripDay): Promise<TripDay> {
    const [newDay] = await db.insert(tripDays).values(tripDay).returning();
    return newDay;
  }

  async updateTripDay(id: number, tripDay: InsertTripDay): Promise<TripDay> {
    const [updatedDay] = await db
      .update(tripDays)
      .set(tripDay)
      .where(eq(tripDays.id, id))
      .returning();
    return updatedDay;
  }

  async deleteTripDay(id: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Delete associated activities first
        await tx.delete(activities).where(eq(activities.tripDayId, id));
        
        // Then delete the trip day
        const result = await tx.delete(tripDays).where(eq(tripDays.id, id)).returning({ id: tripDays.id });
        
        if (result.length === 0) {
          throw new Error(`Trip day with ID ${id} not found or could not be deleted`);
        }
      });
      
      console.log(`Successfully deleted trip day with ID ${id} and all related activities`);
    } catch (error) {
      console.error(`Error deleting trip day with ID ${id}:`, error);
      throw error;
    }
  }

  // Activity methods
  async getActivitiesByTripDayId(tripDayId: number): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.tripDayId, tripDayId));
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: InsertActivity): Promise<Activity> {
    const [updatedActivity] = await db
      .update(activities)
      .set(activity)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Booking methods
  async getBookingsByTripId(tripId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.tripId, tripId));
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: InsertBooking): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // First, update any activities that reference this booking
        await tx
          .update(activities)
          .set({ bookingId: null })
          .where(eq(activities.bookingId, id));
        
        // Then delete the booking
        const result = await tx.delete(bookings).where(eq(bookings.id, id)).returning({ id: bookings.id });
        
        if (result.length === 0) {
          throw new Error(`Booking with ID ${id} not found or could not be deleted`);
        }
      });
      
      console.log(`Successfully deleted booking with ID ${id}`);
    } catch (error) {
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw error;
    }
  }

  // Destination methods
  async getAllDestinations(): Promise<Destination[]> {
    return db.select().from(destinations);
  }

  async getDestinationById(id: number): Promise<Destination | undefined> {
    const [destination] = await db.select().from(destinations).where(eq(destinations.id, id));
    return destination;
  }

  async createDestination(destination: InsertDestination): Promise<Destination> {
    const [newDestination] = await db.insert(destinations).values(destination).returning();
    return newDestination;
  }

  // Review methods
  async getReviewsByTargetTypeAndId(targetType: string, targetId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(and(
        eq(reviews.targetType, targetType),
        eq(reviews.targetId, targetId)
      ))
      .orderBy(desc(reviews.createdAt));
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({
        ...reviewData,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async markReviewHelpful(id: number): Promise<Review> {
    const review = await this.getReviewById(id);
    if (!review) {
      throw new Error("Review not found");
    }
    
    const [updatedReview] = await db
      .update(reviews)
      .set({
        helpfulCount: (review.helpfulCount || 0) + 1,
      })
      .where(eq(reviews.id, id))
      .returning();
    
    return updatedReview;
  }

  async reportReview(id: number): Promise<Review> {
    const review = await this.getReviewById(id);
    if (!review) {
      throw new Error("Review not found");
    }
    
    const [updatedReview] = await db
      .update(reviews)
      .set({
        reportCount: (review.reportCount || 0) + 1,
      })
      .where(eq(reviews.id, id))
      .returning();
    
    return updatedReview;
  }
  
  // Flight search methods
  async getFlightSearchesByUserId(userId: number): Promise<FlightSearch[]> {
    return db.select()
      .from(flightSearches)
      .where(eq(flightSearches.userId, userId))
      .orderBy(desc(flightSearches.createdAt));
  }
  
  async createFlightSearch(flightSearch: InsertFlightSearch): Promise<FlightSearch> {
    const [newFlightSearch] = await db
      .insert(flightSearches)
      .values(flightSearch)
      .returning();
    return newFlightSearch;
  }
  
  async deleteFlightSearch(id: number): Promise<void> {
    await db.delete(flightSearches).where(eq(flightSearches.id, id));
  }
  
  // Wishlist methods
  async getWishlistItemsByUserId(userId: number): Promise<WishlistItem[]> {
    return db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));
  }
  
  async getWishlistItemById(id: number): Promise<WishlistItem | undefined> {
    const [item] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id));
    return item;
  }
  
  async createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem> {
    const [newItem] = await db.insert(wishlistItems).values(item).returning();
    return newItem;
  }
  
  async deleteWishlistItem(id: number): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }
  
  async getWishlistItemByTypeAndId(userId: number, itemType: string, itemId: string): Promise<WishlistItem | undefined> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.itemType, itemType),
          eq(wishlistItems.itemId, itemId)
        )
      );
    return item;
  }
  
  // Flight booking methods
  async getFlightBookingsByUserId(userId: number): Promise<FlightBooking[]> {
    return db
      .select()
      .from(flightBookings)
      .where(eq(flightBookings.userId, userId))
      .orderBy(desc(flightBookings.createdAt));
  }

  async getFlightBookingById(id: number): Promise<FlightBooking | undefined> {
    const [booking] = await db
      .select()
      .from(flightBookings)
      .where(eq(flightBookings.id, id));
    return booking;
  }

  async createFlightBooking(booking: InsertFlightBooking): Promise<FlightBooking> {
    const [newBooking] = await db
      .insert(flightBookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async updateFlightBooking(id: number, booking: Partial<FlightBooking>): Promise<FlightBooking> {
    const [updatedBooking] = await db
      .update(flightBookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(flightBookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteFlightBooking(id: number): Promise<void> {
    await db
      .delete(flightBookings)
      .where(eq(flightBookings.id, id));
  }

  async getFlightBookingsByStatus(userId: number, status: string): Promise<FlightBooking[]> {
    return db
      .select()
      .from(flightBookings)
      .where(
        and(
          eq(flightBookings.userId, userId),
          eq(flightBookings.status, status)
        )
      )
      .orderBy(desc(flightBookings.createdAt));
  }
}

export const storage = new DatabaseStorage();
