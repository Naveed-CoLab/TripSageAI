import { transaction, query } from '../db';
import { storage } from '../storage';
import { FlightBooking, HotelBooking, InsertFlightBooking, InsertHotelBooking } from '@shared/schema';

/**
 * Service for handling booking operations with transaction support
 */
export const bookingService = {
  /**
   * Create a flight booking with transactional integrity
   * Uses transactions to ensure booking and approval request are created atomically
   */
  async createFlightBooking(bookingData: InsertFlightBooking): Promise<FlightBooking> {
    return transaction(async (client) => {
      // 1. Create the flight booking
      const booking = await storage.createFlightBooking(bookingData);
      
      // 2. Add a booking approval record in the same transaction
      await client.query(
        `INSERT INTO booking_approvals (booking_type, booking_id, status, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ['flight', booking.id, 'pending']
      );
      
      // 3. Record analytics in the same transaction
      await client.query(
        `INSERT INTO analytics (event_type, user_id, data)
         VALUES ($1, $2, $3)`,
        [
          'flight_booking_created', 
          booking.userId,
          JSON.stringify({
            bookingId: booking.id,
            flightNumber: booking.flightNumber,
            airline: booking.airline,
            from: booking.departureAirport,
            to: booking.arrivalAirport,
            price: booking.price
          })
        ]
      );
      
      // 4. Create a notification for the user
      await client.query(
        `INSERT INTO notifications (
           user_id, admin_id, title, message, type, is_read, created_at
         )
         VALUES ($1, 
           (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 
           $2, $3, $4, false, NOW())`,
        [
          booking.userId,
          'Flight Booking Under Review',
          `Your booking for ${booking.airline} flight ${booking.flightNumber} from ${booking.departureAirport} to ${booking.arrivalAirport} is pending approval. You'll be notified once it's approved.`,
          'info'
        ]
      );
      
      return booking;
    }, { name: 'create_flight_booking', isolation: 'SERIALIZABLE' });
  },
  
  /**
   * Create a hotel booking with transactional integrity
   * Uses transactions to ensure booking and approval request are created atomically
   */
  async createHotelBooking(bookingData: InsertHotelBooking): Promise<HotelBooking> {
    return transaction(async (client) => {
      // 1. Create the hotel booking
      const booking = await storage.createHotelBooking(bookingData);
      
      // 2. Add a booking approval record in the same transaction
      await client.query(
        `INSERT INTO booking_approvals (booking_type, booking_id, status, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ['hotel', booking.id, 'pending']
      );
      
      // 3. Record analytics in the same transaction
      await client.query(
        `INSERT INTO analytics (event_type, user_id, data)
         VALUES ($1, $2, $3)`,
        [
          'hotel_booking_created', 
          booking.userId,
          JSON.stringify({
            bookingId: booking.id,
            hotelName: booking.hotelName,
            hotelCity: booking.hotelCity,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            price: booking.price
          })
        ]
      );
      
      // 4. Create a notification for the user
      await client.query(
        `INSERT INTO notifications (
           user_id, admin_id, title, message, type, is_read, created_at
         )
         VALUES ($1, 
           (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 
           $2, $3, $4, false, NOW())`,
        [
          booking.userId,
          'Hotel Booking Under Review',
          `Your booking at ${booking.hotelName} in ${booking.hotelCity} is pending approval. You'll be notified once it's approved.`,
          'info'
        ]
      );
      
      return booking;
    }, { name: 'create_hotel_booking', isolation: 'SERIALIZABLE' });
  },
  
  /**
   * Approve a booking using the stored procedure
   */
  async approveBooking(
    bookingType: 'flight' | 'hotel', 
    bookingId: number, 
    adminId: number, 
    notes?: string
  ): Promise<void> {
    await query(
      `CALL process_booking_approval($1, $2, $3, $4, $5)`,
      [bookingType, bookingId, adminId, 'approved', notes || null]
    );
  },
  
  /**
   * Reject a booking using the stored procedure
   */
  async rejectBooking(
    bookingType: 'flight' | 'hotel', 
    bookingId: number, 
    adminId: number, 
    notes: string
  ): Promise<void> {
    await query(
      `CALL process_booking_approval($1, $2, $3, $4, $5)`,
      [bookingType, bookingId, adminId, 'rejected', notes]
    );
  }
};