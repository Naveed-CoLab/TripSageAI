
import { 
  // The tables are no longer needed with raw SQL, keep only the types
  type User, 
  type InsertUser, 
  type Trip,  // Still using Trip type for backward compatibility
  type InsertTrip,
  type Destination,
  type InsertDestination,
  type Review,
  type InsertReview,
  type FlightSearch,
  type InsertFlightSearch,
  type UserSettings,
  type InsertUserSettings,
  type WishlistItem,
  type InsertWishlistItem,
  type FlightBooking,
  type InsertFlightBooking,
  type HotelSearch,
  type InsertHotelSearch,
  type HotelBooking,
  type InsertHotelBooking,
  type AdminLog,
  type InsertAdminLog
} from "@shared/schema";
import { pool, query, transaction } from "./db";
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
  
  // AI Trip Generation methods
  getAllAiTrips(): Promise<any[]>;
  getAiTripById(id: number): Promise<any | undefined>;
  
  // Admin logs methods
  createAdminLog(adminLog: InsertAdminLog): Promise<AdminLog>;
  getAdminLogsByAdminId(adminId: number): Promise<AdminLog[]>;
  getRecentAdminLogs(limit?: number): Promise<AdminLog[]>;

  // Trip methods
  getTripsByUserId(userId: number): Promise<Trip[]>;
  getTripById(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: InsertTrip): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Trip day, activity, and booking methods removed as these tables no longer exist

  // Flight Booking methods
  getFlightBookingsByUserId(userId: number): Promise<FlightBooking[]>;
  getFlightBookingById(id: number): Promise<FlightBooking | undefined>;
  createFlightBooking(booking: InsertFlightBooking): Promise<FlightBooking>;
  updateFlightBooking(id: number, booking: Partial<FlightBooking>): Promise<FlightBooking>;
  deleteFlightBooking(id: number): Promise<void>;
  getFlightBookingsByStatus(userId: number, status: string): Promise<FlightBooking[]>;

  // Hotel Search methods
  getHotelSearchesByUserId(userId: number): Promise<HotelSearch[]>;
  createHotelSearch(hotelSearch: any): Promise<HotelSearch>;
  deleteHotelSearch(id: number): Promise<void>;

  // Hotel Booking methods
  getHotelBookingsByUserId(userId: number): Promise<HotelBooking[]>;
  getHotelBookingById(id: number): Promise<HotelBooking | undefined>;
  createHotelBooking(booking: any): Promise<HotelBooking>;
  updateHotelBooking(id: number, booking: Partial<HotelBooking>): Promise<HotelBooking>;
  deleteHotelBooking(id: number): Promise<void>;
  getHotelBookingsByStatus(userId: number, status: string): Promise<HotelBooking[]>;

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
    // Fix session store configuration with the pool from db.ts
    // The pool is already imported at the top of the file
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'session',  // Specify the session table name
      createTableIfMissing: true,
      pruneSessionInterval: 60, // 1 minute (default is 15 minutes)
      ttl: 86400 // 1 day in seconds (default is 1 day)
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const SQL = `
      SELECT * FROM users WHERE id = $1
    `;
    const result = await query(SQL, [id]);
    return result.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const SQL = `
      SELECT * FROM users WHERE username = $1
    `;
    const result = await query(SQL, [username]);
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const SQL = `
      SELECT * FROM users WHERE email = $1
    `;
    const result = await query(SQL, [email]);
    return result.rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Convert camelCase keys to snake_case for PostgreSQL column names
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(insertUser)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    console.log("Creating user:", insertUser.username);
    console.log("Column names:", columnNames);
    
    const SQL = `
      INSERT INTO users (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(userData)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    // Add updated_at field
    processedData.updated_at = new Date();
    
    // Build SET clause
    const setClause = Object.keys(processedData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(processedData)];
    
    const SQL = `
      UPDATE users
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User> {
    const SQL = `
      UPDATE users
      SET password = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, [id, newPassword]);
    return result.rows[0];
  }

  async updateUserEmail(id: number, newEmail: string): Promise<User> {
    const SQL = `
      UPDATE users
      SET email = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, [id, newEmail]);
    return result.rows[0];
  }

  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    const SQL = `
      UPDATE users
      SET profile_image = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, [id, imageUrl]);
    return result.rows[0];
  }
  
  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const SQL = `
      SELECT * FROM user_settings
      WHERE user_id = $1
    `;
    
    const result = await query(SQL, [userId]);
    return result.rows[0];
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(settings)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO user_settings (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }

  async updateUserSettings(userId: number, settingsData: Partial<UserSettings>): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    
    if (!existingSettings) {
      // If settings don't exist yet, create them
      return this.createUserSettings({ userId, ...settingsData } as InsertUserSettings);
    }
    
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(settingsData)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    // Add updated_at field
    processedData.updated_at = new Date();
    
    // Build SET clause
    const setClause = Object.keys(processedData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [userId, ...Object.values(processedData)];
    
    const SQL = `
      UPDATE user_settings
      SET ${setClause}
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }
  
  async getUserCount(): Promise<number> {
    const SQL = `
      SELECT COUNT(*) as count FROM users
    `;
    
    const result = await query(SQL);
    return parseInt(result.rows[0].count);
  }
  
  async getNewUserCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const SQL = `
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= $1
    `;
    
    const result = await query(SQL, [today]);
    return parseInt(result.rows[0].count);
  }
  
  async getTripCount(): Promise<number> {
    const SQL = `
      SELECT COUNT(*) as count FROM my_trips
    `;
    
    const result = await query(SQL);
    return parseInt(result.rows[0].count);
  }
  
  async getNewTripCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const SQL = `
      SELECT COUNT(*) as count FROM my_trips
      WHERE created_at >= $1
    `;
    
    const result = await query(SQL, [today]);
    return parseInt(result.rows[0].count);
  }
  
  // AI Trip Generation methods
  async getAllAiTrips(): Promise<any[]> {
    try {
      const sql = `
        SELECT 
          aig.*, 
          u.username as user_username,
          u.email as user_email,
          t.title as saved_trip_title,
          t.status as saved_trip_status
        FROM ai_trip_generations aig
        LEFT JOIN users u ON aig.user_id = u.id
        LEFT JOIN my_trips t ON aig.saved_trip_id = t.id
        ORDER BY aig.created_at DESC
      `;

      const result = await query(sql);
      
      // Process the result for better format
      return result.rows.map(trip => ({
        id: trip.id,
        userId: trip.user_id,
        username: trip.user_username,
        userEmail: trip.user_email,
        destination: trip.destination,
        dateRange: `${trip.start_date} to ${trip.end_date}`,
        tripType: trip.trip_type || 'Not specified',
        interests: trip.interests || [],
        withPets: trip.with_pets,
        prompt: trip.prompt,
        saved: trip.saved,
        savedTripId: trip.saved_trip_id,
        savedTripTitle: trip.saved_trip_title,
        savedTripStatus: trip.saved_trip_status,
        createdAt: trip.created_at
      }));
    } catch (error) {
      console.error('Error getting AI trips:', error);
      throw error;
    }
  }
  
  async getAiTripById(id: number): Promise<any | undefined> {
    try {
      const sql = `
        SELECT 
          aig.*, 
          u.username as user_username,
          u.email as user_email,
          t.title as saved_trip_title,
          t.status as saved_trip_status
        FROM ai_trip_generations aig
        LEFT JOIN users u ON aig.user_id = u.id
        LEFT JOIN my_trips t ON aig.saved_trip_id = t.id
        WHERE aig.id = $1
      `;

      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Get the full details
      const trip = result.rows[0];
      
      // Format the response
      return {
        id: trip.id,
        userId: trip.user_id,
        username: trip.user_username,
        userEmail: trip.user_email,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        tripType: trip.trip_type || 'Not specified',
        interests: trip.interests || [],
        withPets: trip.with_pets,
        prompt: trip.prompt,
        aiResponse: trip.ai_response,
        generatedTrip: trip.generated_trip,
        saved: trip.saved,
        savedTripId: trip.saved_trip_id,
        savedTripTitle: trip.saved_trip_title,
        savedTripStatus: trip.saved_trip_status,
        createdAt: trip.created_at
      };
    } catch (error) {
      console.error('Error getting AI trip details:', error);
      throw error;
    }
  }
  
  // Admin logs methods
  async createAdminLog(adminLog: InsertAdminLog): Promise<AdminLog> {
    try {
      const SQL = `
        INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        adminLog.adminId,
        adminLog.action,
        adminLog.entityType || null,
        adminLog.entityId || null,
        adminLog.details || null
      ];
      
      const result = await query(SQL, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating admin log:', error);
      throw error;
    }
  }
  
  async getAdminLogsByAdminId(adminId: number): Promise<AdminLog[]> {
    try {
      const SQL = `
        SELECT * FROM admin_logs
        WHERE admin_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await query(SQL, [adminId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting admin logs by admin ID:', error);
      throw error;
    }
  }
  
  async getRecentAdminLogs(limit: number = 50): Promise<AdminLog[]> {
    try {
      const SQL = `
        SELECT al.*, u.username as admin_username
        FROM admin_logs al
        JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent admin logs:', error);
      throw error;
    }
  }
  
  // Admin User Management Methods
  async getAllUsers(): Promise<User[]> {
    try {
      const SQL = `
        SELECT * FROM users
        ORDER BY id ASC
      `;
      
      const result = await query(SQL);
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  async updateUserStatus(userId: number, isActive: boolean): Promise<User> {
    try {
      const SQL = `
        UPDATE users 
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await query(SQL, [isActive, userId]);
      
      if (result.rows.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
  
  async deleteUser(userId: number): Promise<void> {
    try {
      // Using transaction to ensure data consistency
      await transaction(async (client) => {
        // Delete user-related data first (respecting foreign key constraints)
        await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM search_analytics WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM wishlist_items WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM flight_searches WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM flight_bookings WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM hotel_searches WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM hotel_bookings WHERE user_id = $1', [userId]);
        
        // Delete trips (now my_trips)
        await client.query('DELETE FROM my_trips WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
        
        // Finally delete the user
        const deleteResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        
        if (deleteResult.rowCount === 0) {
          throw new Error(`User with ID ${userId} not found or could not be deleted`);
        }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  // AI Conversation Log Methods removed
  
  // Notification Methods
  async createNotification(notification: any): Promise<any> {
    try {
      const SQL = `
        INSERT INTO notifications 
        (user_id, admin_id, title, message, type, link, valid_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        notification.userId || null, // If null, it's a broadcast to all users
        notification.adminId,
        notification.title,
        notification.message,
        notification.type,
        notification.link || null,
        notification.validUntil || null
      ];
      
      const result = await query(SQL, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  async getUserNotifications(userId: number): Promise<any[]> {
    try {
      const SQL = `
        SELECT n.*, a.username as admin_username
        FROM notifications n
        JOIN users a ON n.admin_id = a.id
        WHERE n.user_id = $1 OR n.user_id IS NULL
        ORDER BY n.created_at DESC
      `;
      
      const result = await query(SQL, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
  
  async markNotificationAsRead(notificationId: number, userId: number): Promise<any> {
    try {
      const SQL = `
        UPDATE notifications 
        SET is_read = TRUE
        WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
        RETURNING *
      `;
      
      const result = await query(SQL, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Notification with ID ${notificationId} not found or not accessible by user ${userId}`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  // Booking Approval Methods
  async createBookingApproval(approval: any): Promise<any> {
    try {
      const SQL = `
        INSERT INTO booking_approvals 
        (booking_type, booking_id, status, admin_id, admin_notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        approval.bookingType,
        approval.bookingId,
        approval.status || 'pending',
        approval.adminId || null,
        approval.adminNotes || null
      ];
      
      const result = await query(SQL, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating booking approval:', error);
      throw error;
    }
  }
  
  async updateBookingApprovalStatus(id: number, status: string, adminId: number, adminNotes?: string): Promise<any> {
    try {
      const SQL = `
        UPDATE booking_approvals 
        SET status = $1, admin_id = $2, admin_notes = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await query(SQL, [status, adminId, adminNotes || null, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Booking approval with ID ${id} not found`);
      }
      
      // Update the corresponding booking status based on approval
      const approval = result.rows[0];
      
      // Handle different booking types
      if (approval.booking_type === 'flight') {
        // Update flight booking status
        await query(
          `UPDATE flight_bookings SET status = $1 WHERE id = $2`,
          [status === 'approved' ? 'confirmed' : (status === 'rejected' ? 'cancelled' : 'pending'), approval.booking_id]
        );
      } else if (approval.booking_type === 'hotel') {
        // Update hotel booking status
        await query(
          `UPDATE hotel_bookings SET status = $1 WHERE id = $2`,
          [status === 'approved' ? 'CONFIRMED' : (status === 'rejected' ? 'CANCELLED' : 'PENDING'), approval.booking_id]
        );
      }
      
      return approval;
    } catch (error) {
      console.error('Error updating booking approval status:', error);
      throw error;
    }
  }
  
  async getBookingApprovals(status?: string, limit: number = 100): Promise<any[]> {
    try {
      let SQL = `
        SELECT ba.*, 
               u.username as admin_username,
               CASE 
                 WHEN ba.booking_type = 'flight' THEN 
                   (SELECT json_build_object(
                     'id', fb.id,
                     'userId', fb.user_id,
                     'flightNumber', fb.flight_number,
                     'airline', fb.airline,
                     'departureAirport', fb.departure_airport,
                     'departureCode', fb.departure_code,
                     'arrivalAirport', fb.arrival_airport,
                     'arrivalCode', fb.arrival_code,
                     'price', fb.price,
                     'status', fb.status,
                     'passengerName', fb.passenger_name,
                     'createdAt', fb.created_at
                   )
                   FROM flight_bookings fb 
                   WHERE fb.id = ba.booking_id)
                 WHEN ba.booking_type = 'hotel' THEN 
                   (SELECT json_build_object(
                     'id', hb.id,
                     'userId', hb.user_id,
                     'hotelName', hb.hotel_name,
                     'checkInDate', hb.check_in_date,
                     'checkOutDate', hb.check_out_date,
                     'price', hb.price,
                     'status', hb.status,
                     'guestName', hb.guest_name,
                     'createdAt', hb.created_at
                   )
                   FROM hotel_bookings hb 
                   WHERE hb.id = ba.booking_id)
               END as booking_details,
               (SELECT username FROM users WHERE id = 
                 CASE 
                   WHEN ba.booking_type = 'flight' THEN (SELECT user_id FROM flight_bookings WHERE id = ba.booking_id)
                   WHEN ba.booking_type = 'hotel' THEN (SELECT user_id FROM hotel_bookings WHERE id = ba.booking_id)
                 END
               ) as user_username
        FROM booking_approvals ba
        LEFT JOIN users u ON ba.admin_id = u.id
      `;
      
      const params = [];
      
      if (status) {
        SQL += ` WHERE ba.status = $1`;
        params.push(status);
      }
      
      SQL += ` ORDER BY ba.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await query(SQL, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting booking approvals:', error);
      throw error;
    }
  }
  
  // Analytics Methods
  async recordSearchAnalytics(searchData: any): Promise<any> {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
      const hourOfDay = now.getHours(); // 0-23
      
      const SQL = `
        INSERT INTO search_analytics 
        (search_type, search_term, user_id, result_count, day_of_week, hour_of_day)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        searchData.searchType,
        searchData.searchTerm,
        searchData.userId || null,
        searchData.resultCount || 0,
        dayOfWeek,
        hourOfDay
      ];
      
      const result = await query(SQL, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error recording search analytics:', error);
      throw error;
    }
  }
  
  async getTopSearchedDestinations(limit: number = 10): Promise<any[]> {
    try {
      const SQL = `
        SELECT search_term as destination, COUNT(*) as search_count
        FROM search_analytics
        WHERE search_type IN ('destination', 'hotel')
        GROUP BY search_term
        ORDER BY search_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting top searched destinations:', error);
      throw error;
    }
  }
  
  async getMostBookedHotels(limit: number = 10): Promise<any[]> {
    try {
      const SQL = `
        SELECT hotel_name, COUNT(*) as booking_count
        FROM hotel_bookings
        GROUP BY hotel_name
        ORDER BY booking_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting most booked hotels:', error);
      throw error;
    }
  }
  
  async getMostBookedFlights(limit: number = 10): Promise<any[]> {
    try {
      const SQL = `
        SELECT airline, COUNT(*) as booking_count
        FROM flight_bookings
        GROUP BY airline
        ORDER BY booking_count DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting most booked flights:', error);
      throw error;
    }
  }
  
  async getBookingHeatmap(): Promise<any[]> {
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
      return result.rows;
    } catch (error) {
      console.error('Error getting booking heatmap data:', error);
      throw error;
    }
  }
  
  // Trip Management Methods for Admins
  async getAllTrips(limit: number = 100): Promise<Trip[]> {
    try {
      const SQL = `
        SELECT t.*, u.username as user_username
        FROM trips t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT $1
      `;
      
      const result = await query(SQL, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting all trips:', error);
      throw error;
    }
  }
  
  async deleteTripByAdmin(tripId: number, adminId: number, reason: string): Promise<void> {
    try {
      // First check if trip exists
      const tripCheck = await query('SELECT id, user_id FROM trips WHERE id = $1', [tripId]);
      
      if (tripCheck.rows.length === 0) {
        throw new Error(`Trip with ID ${tripId} not found`);
      }
      
      const tripUserId = tripCheck.rows[0].user_id;
      
      // Using transaction to ensure data consistency and log the admin action
      await transaction(async (client) => {
        // Get all trip days to find related activities
        const tripDaysQuery = 'SELECT id FROM trip_days WHERE trip_id = $1';
        const tripDaysResult = await client.query(tripDaysQuery, [tripId]);
        
        // Delete activities for each trip day
        for (const day of tripDaysResult.rows) {
          await client.query('DELETE FROM activities WHERE trip_day_id = $1', [day.id]);
        }
        
        // Delete bookings that might be related to this trip
        await client.query('DELETE FROM bookings WHERE trip_id = $1', [tripId]);
        
        // Delete the trip days after activities are removed
        await client.query('DELETE FROM trip_days WHERE trip_id = $1', [tripId]);
        
        // Finally delete the trip itself
        const deleteTripQuery = 'DELETE FROM trips WHERE id = $1 RETURNING id';
        const result = await client.query(deleteTripQuery, [tripId]);
        
        if (result.rowCount === 0) {
          throw new Error(`Trip with ID ${tripId} could not be deleted`);
        }
        
        // Log the admin action
        await client.query(
          `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) 
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'delete_trip', 'trip', tripId, `Trip deleted. Reason: ${reason}`]
        );
        
        // Create a notification for the user
        await client.query(
          `INSERT INTO notifications (user_id, admin_id, title, message, type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            tripUserId, 
            adminId, 
            'Trip Removed',
            `Your trip has been removed by an administrator. Reason: ${reason}`,
            'warning'
          ]
        );
      });
      
      console.log(`Successfully deleted trip with ID ${tripId} by admin ${adminId}`);
    } catch (error) {
      console.error(`Error deleting trip with ID ${tripId} by admin:`, error);
      throw error;
    }
  }

  // Trip methods
  async getTripsByUserId(userId: number): Promise<Trip[]> {
    const SQL = `
      SELECT 
        id, 
        user_id, 
        title, 
        destination,
        start_date::text,  -- Force conversion to text to prevent empty objects
        end_date::text,    -- Force conversion to text to prevent empty objects 
        budget, 
        budget_is_estimated, 
        preferences, 
        status, 
        itinerary_data, 
        created_at::text,  -- Force conversion to text to prevent timestamp issues
        updated_at::text   -- Force conversion to text to prevent timestamp issues
      FROM my_trips
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(SQL, [userId]);
    return this.toCamelCase(result.rows);
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const SQL = `
      SELECT 
        id, 
        user_id, 
        title, 
        destination,
        start_date::text,  -- Force conversion to text to prevent empty objects
        end_date::text,    -- Force conversion to text to prevent empty objects 
        budget, 
        budget_is_estimated, 
        preferences, 
        status, 
        itinerary_data, 
        created_at::text,  -- Force conversion to text to prevent timestamp issues
        updated_at::text   -- Force conversion to text to prevent timestamp issues
      FROM my_trips
      WHERE id = $1
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : undefined;
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const SQL = `
      SELECT 
        id, 
        user_id, 
        title, 
        destination,
        start_date::text,  -- Force conversion to text to prevent empty objects
        end_date::text,    -- Force conversion to text to prevent empty objects 
        budget, 
        budget_is_estimated, 
        preferences, 
        status, 
        itinerary_data, 
        created_at::text,  -- Force conversion to text to prevent timestamp issues
        updated_at::text   -- Force conversion to text to prevent timestamp issues
      FROM my_trips
      WHERE id = $1
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : undefined;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(trip)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO my_trips (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return this.toCamelCase(result.rows[0]);
  }

  async updateTrip(id: number, trip: Partial<Trip>): Promise<Trip> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(trip)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    // Add updated_at field
    processedData.updated_at = new Date();
    
    // Build SET clause
    const setClause = Object.keys(processedData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(processedData)];
    
    const SQL = `
      UPDATE my_trips
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return this.toCamelCase(result.rows[0]);
  }

  async deleteTrip(id: number): Promise<void> {
    try {
      await transaction(async (client) => {
        // First, delete any associated AI trip generation records
        const deleteAiTripsQuery = 'DELETE FROM ai_trip_generations WHERE saved_trip_id = $1';
        await client.query(deleteAiTripsQuery, [id]);
        
        // Then delete the trip from my_trips table
        const deleteTripQuery = 'DELETE FROM my_trips WHERE id = $1 RETURNING id';
        const result = await client.query(deleteTripQuery, [id]);
        
        if (result.rowCount === 0) {
          throw new Error(`Trip with ID ${id} not found or could not be deleted`);
        }
      });
      
      console.log(`Successfully deleted trip with ID ${id}`);
    } catch (error) {
      console.error(`Error deleting trip with ID ${id}:`, error);
      throw error;
    }
  }

  // Trip day, Activity, and Booking methods were removed as these tables no longer exist

  // Destination methods
  async getAllDestinations(): Promise<Destination[]> {
    const SQL = `
      SELECT * FROM destinations
      ORDER BY name ASC
    `;
    
    const result = await query(SQL);
    return this.toCamelCase(result.rows);
  }

  async getDestinationById(id: number): Promise<Destination | undefined> {
    const SQL = `
      SELECT * FROM destinations
      WHERE id = $1
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : undefined;
  }

  async createDestination(destination: InsertDestination): Promise<Destination> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(destination)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO destinations (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return this.toCamelCase(result.rows[0]);
  }

  // Review methods
  async getReviewsByTargetTypeAndId(targetType: string, targetId: string): Promise<Review[]> {
    const SQL = `
      SELECT * FROM reviews
      WHERE target_type = $1 AND target_id = $2
      ORDER BY created_at DESC
    `;
    
    const result = await query(SQL, [targetType, targetId]);
    return result.rows;
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    const SQL = `
      SELECT * FROM reviews
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(SQL, [userId]);
    return result.rows;
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const SQL = `
      SELECT * FROM reviews
      WHERE id = $1
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0];
  }

  async createReview(review: InsertReview): Promise<Review> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(review)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO reviews (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(reviewData)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    // Add updated_at field
    processedData.updated_at = new Date();
    
    // Build SET clause
    const setClause = Object.keys(processedData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(processedData)];
    
    const SQL = `
      UPDATE reviews
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }

  async deleteReview(id: number): Promise<void> {
    const SQL = `
      DELETE FROM reviews
      WHERE id = $1
    `;
    
    await query(SQL, [id]);
  }

  async markReviewHelpful(id: number): Promise<Review> {
    const review = await this.getReviewById(id);
    if (!review) {
      throw new Error("Review not found");
    }
    
    const SQL = `
      UPDATE reviews
      SET helpful_count = COALESCE(helpful_count, 0) + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0];
  }

  async reportReview(id: number): Promise<Review> {
    const review = await this.getReviewById(id);
    if (!review) {
      throw new Error("Review not found");
    }
    
    const SQL = `
      UPDATE reviews
      SET report_count = COALESCE(report_count, 0) + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0];
  }
  
  // Flight search methods
  async getFlightSearchesByUserId(userId: number): Promise<FlightSearch[]> {
    const SQL = `
      SELECT * FROM flight_searches
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(SQL, [userId]);
    return result.rows;
  }
  
  async createFlightSearch(flightSearch: InsertFlightSearch): Promise<FlightSearch> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(flightSearch)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO flight_searches (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return result.rows[0];
  }
  
  async deleteFlightSearch(id: number): Promise<void> {
    const SQL = `
      DELETE FROM flight_searches
      WHERE id = $1
    `;
    
    await query(SQL, [id]);
  }
  
  // Utility function to convert snake_case to camelCase for field names
  private toCamelCase(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.toCamelCase(item));
    }
    
    if (data === null || data === undefined) {
      return data;
    }
    
    // Check if this is a PostgreSQL date/timestamp object
    if (typeof data === 'object') {
      // Special handling for PostgreSQL date type, which may be an empty object or a date object
      if (Object.keys(data).length === 0) {
        // Empty object dates, return null instead of empty objects
        return null;
      }
      
      // Handle date objects from PostgreSQL that have year/month/day properties
      if (data.hasOwnProperty('year') && data.hasOwnProperty('month') && data.hasOwnProperty('day')) {
        // For date columns (like start_date, end_date)
        const year = data.year;
        const month = String(data.month).padStart(2, '0');
        const day = String(data.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } 
      
      // Handle timestamp objects from PostgreSQL
      if (data.hasOwnProperty('hours')) {
        const year = data.year;
        const month = String(data.month).padStart(2, '0');
        const day = String(data.day).padStart(2, '0');
        const hours = String(data.hours).padStart(2, '0');
        const minutes = String(data.minutes).padStart(2, '0');
        const seconds = String(data.seconds).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
    }
    
    if (typeof data !== 'object') {
      return data;
    }
    
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Recursively convert nested objects
      result[camelKey] = this.toCamelCase(value);
    }
    
    return result;
  }

  // Wishlist methods
  async getWishlistItemsByUserId(userId: number): Promise<WishlistItem[]> {
    const SQL = `
      SELECT * FROM wishlist_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(SQL, [userId]);
    return this.toCamelCase(result.rows);
  }
  
  async getWishlistItemById(id: number): Promise<WishlistItem | undefined> {
    const SQL = `
      SELECT * FROM wishlist_items
      WHERE id = $1
    `;
    
    const result = await query(SQL, [id]);
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : undefined;
  }
  
  async createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem> {
    // Convert camelCase keys to snake_case for PostgreSQL
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(item)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      processedData[snakeCaseKey] = value;
    }
    
    const keys = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = keys.join(', ');
    
    const SQL = `
      INSERT INTO wishlist_items (${columnNames})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(SQL, values);
    return this.toCamelCase(result.rows[0]);
  }
  
  async deleteWishlistItem(id: number): Promise<void> {
    const SQL = `
      DELETE FROM wishlist_items
      WHERE id = $1
    `;
    
    await query(SQL, [id]);
  }
  
  async getWishlistItemByTypeAndId(userId: number, itemType: string, itemId: string): Promise<WishlistItem | undefined> {
    const SQL = `
      SELECT * FROM wishlist_items
      WHERE user_id = $1 AND item_type = $2 AND item_id = $3
    `;
    
    const result = await query(SQL, [userId, itemType, itemId]);
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : undefined;
  }
  
  // Flight booking methods
  async getFlightBookingsByUserId(userId: number): Promise<FlightBooking[]> {
    try {
      // Use direct SQL to bypass ORM
      const query = `
        SELECT * FROM flight_bookings
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows as FlightBooking[];
    } catch (error) {
      console.error("Error in getFlightBookingsByUserId:", error);
      throw error;
    }
  }

  async getFlightBookingById(id: number): Promise<FlightBooking | undefined> {
    try {
      // Use direct SQL to bypass ORM
      const query = `
        SELECT * FROM flight_bookings
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] as FlightBooking || undefined;
    } catch (error) {
      console.error("Error in getFlightBookingById:", error);
      throw error;
    }
  }

  async createFlightBooking(booking: any): Promise<FlightBooking> {
    try {
      // Use direct SQL query to bypass Drizzle ORM
      const query = `
        INSERT INTO flight_bookings (
          user_id, flight_number, airline, departure_airport, departure_code, departure_time,
          arrival_airport, arrival_code, arrival_time, trip_type, 
          return_flight_number, return_airline, return_departure_time, return_arrival_time, booking_reference, 
          price, currency, status, cabin_class, passenger_name, 
          passenger_email, passenger_phone, flight_details,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, 
          $16, $17, $18, $19, $20, 
          $21, $22, $23,
          NOW(), NOW()
        ) RETURNING *`;
        
      const values = [
        booking.userId,
        booking.flightNumber,
        booking.airline,
        booking.departureAirport,
        booking.departureCode,
        booking.departureTime,
        booking.arrivalAirport,
        booking.arrivalCode,
        booking.arrivalTime,
        booking.tripType,
        booking.returnFlightNumber || null,
        booking.returnAirline || null,
        booking.returnDepartureTime || null,
        booking.returnArrivalTime || null,
        booking.bookingReference,
        booking.price,
        booking.currency || "USD",
        booking.status || "CONFIRMED",
        booking.cabinClass || "ECONOMY",
        booking.passengerName,
        booking.passengerEmail,
        booking.passengerPhone,
        JSON.stringify(booking.flightDetails || {})
      ];
      
      console.log("Executing SQL with values:", values);
      
      // Execute the query using the pool directly
      const result = await pool.query(query, values);
      return result.rows[0] as FlightBooking;
    } catch (error) {
      console.error("Database error in createFlightBooking:", error);
      throw error;
    }
  }

  async updateFlightBooking(id: number, booking: Partial<FlightBooking>): Promise<FlightBooking> {
    try {
      // Build the SET part of the query dynamically from the booking object
      const setValues: string[] = [];
      const queryValues: any[] = [];
      let paramIndex = 1;
      
      Object.entries(booking).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          // Convert camelCase to snake_case for column names
          const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          setValues.push(`${columnName} = $${paramIndex++}`);
          queryValues.push(value);
        }
      });
      
      // Add updated_at
      setValues.push(`updated_at = NOW()`);
      
      // Add the ID as the last parameter
      queryValues.push(id);
      
      const query = `
        UPDATE flight_bookings
        SET ${setValues.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, queryValues);
      return result.rows[0] as FlightBooking;
    } catch (error) {
      console.error("Error in updateFlightBooking:", error);
      throw error;
    }
  }

  async deleteFlightBooking(id: number): Promise<void> {
    try {
      const query = `
        DELETE FROM flight_bookings
        WHERE id = $1
      `;
      await pool.query(query, [id]);
    } catch (error) {
      console.error("Error in deleteFlightBooking:", error);
      throw error;
    }
  }

  async getFlightBookingsByStatus(userId: number, status: string): Promise<FlightBooking[]> {
    try {
      // Use direct SQL to bypass ORM
      const query = `
        SELECT * FROM flight_bookings
        WHERE user_id = $1 AND status = $2
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId, status]);
      return result.rows as FlightBooking[];
    } catch (error) {
      console.error("Error in getFlightBookingsByStatus:", error);
      throw error;
    }
  }

  // Hotel Search methods
  async getHotelSearchesByUserId(userId: number): Promise<HotelSearch[]> {
    try {
      const query = `
        SELECT * FROM hotel_searches
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows as HotelSearch[];
    } catch (error) {
      console.error("Error in getHotelSearchesByUserId:", error);
      throw error;
    }
  }

  async createHotelSearch(hotelSearch: any): Promise<HotelSearch> {
    try {
      // Convert camelCase keys to snake_case for PostgreSQL
      const processedData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(hotelSearch)) {
        // Convert camelCase to snake_case
        const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        processedData[snakeCaseKey] = value;
      }
      
      const keys = Object.keys(processedData);
      const values = Object.values(processedData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = keys.join(', ');
      
      const query = `
        INSERT INTO hotel_searches (${columnNames})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0] as HotelSearch;
    } catch (error) {
      console.error("Error in createHotelSearch:", error);
      throw error;
    }
  }

  async deleteHotelSearch(id: number): Promise<void> {
    try {
      const query = `
        DELETE FROM hotel_searches
        WHERE id = $1
      `;
      await pool.query(query, [id]);
    } catch (error) {
      console.error("Error in deleteHotelSearch:", error);
      throw error;
    }
  }

  // Hotel Booking methods
  async getHotelBookingsByUserId(userId: number): Promise<HotelBooking[]> {
    try {
      const query = `
        SELECT * FROM hotel_bookings
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows as HotelBooking[];
    } catch (error) {
      console.error("Error in getHotelBookingsByUserId:", error);
      throw error;
    }
  }

  async getHotelBookingById(id: number): Promise<HotelBooking | undefined> {
    try {
      const query = `
        SELECT * FROM hotel_bookings
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] as HotelBooking || undefined;
    } catch (error) {
      console.error("Error in getHotelBookingById:", error);
      throw error;
    }
  }

  async createHotelBooking(booking: any): Promise<HotelBooking> {
    try {
      // Convert camelCase keys to snake_case for PostgreSQL
      const processedData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(booking)) {
        // Convert camelCase to snake_case
        const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        processedData[snakeCaseKey] = value;
      }
      
      const keys = Object.keys(processedData);
      const values = Object.values(processedData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = keys.join(', ');
      
      console.log("Executing SQL with values:", values);
      
      const query = `
        INSERT INTO hotel_bookings (${columnNames})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0] as HotelBooking;
    } catch (error) {
      console.error("Database error in createHotelBooking:", error);
      throw error;
    }
  }

  async updateHotelBooking(id: number, booking: Partial<HotelBooking>): Promise<HotelBooking> {
    try {
      // Build the SET part of the query dynamically from the booking object
      const setValues: string[] = [];
      const queryValues: any[] = [];
      let paramIndex = 1;
      
      Object.entries(booking).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          // Convert camelCase to snake_case for column names
          const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          setValues.push(`${columnName} = $${paramIndex++}`);
          queryValues.push(value);
        }
      });
      
      // Add updated_at
      setValues.push(`updated_at = NOW()`);
      
      // Add the ID as the last parameter
      queryValues.push(id);
      
      const query = `
        UPDATE hotel_bookings
        SET ${setValues.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, queryValues);
      return result.rows[0] as HotelBooking;
    } catch (error) {
      console.error("Error in updateHotelBooking:", error);
      throw error;
    }
  }

  async deleteHotelBooking(id: number): Promise<void> {
    try {
      const query = `
        DELETE FROM hotel_bookings
        WHERE id = $1
      `;
      await pool.query(query, [id]);
    } catch (error) {
      console.error("Error in deleteHotelBooking:", error);
      throw error;
    }
  }

  async getHotelBookingsByStatus(userId: number, status: string): Promise<HotelBooking[]> {
    try {
      const query = `
        SELECT * FROM hotel_bookings
        WHERE user_id = $1 AND status = $2
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId, status]);
      return result.rows as HotelBooking[];
    } catch (error) {
      console.error("Error in getHotelBookingsByStatus:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
