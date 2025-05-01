import { createApi } from 'unsplash-js';
import { storage } from '../storage';
import { HotelBooking, HotelSearch, InsertHotelBooking, InsertHotelSearch } from '@shared/schema';
import { randomBytes } from 'crypto';
import { makcorpsApiService } from './makcorps-api';

// Setup Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export class HotelService {
  /**
   * Search for hotels by location
   */
  async searchHotels(userId: number, location: string, checkInDate: string, checkOutDate: string, guests: number, rooms: number) {
    try {
      // Save the hotel search to track user history
      const hotelSearch: any = {
        userId,
        location,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        guests,
        rooms,
      };
      
      await storage.createHotelSearch(hotelSearch);
      
      console.log(`Searching for hotels in location: ${location} using Makcorps API`);
      
      // Use the Makcorps API service for hotel search
      const hotels = await makcorpsApiService.searchHotels(location);
      
      console.log(`Found ${hotels.length} hotels for location ${location}`);
      
      return hotels;
    } catch (error) {
      console.error('Hotel search error:', error);
      return []; // Return empty array instead of throwing error for better UX
    }
  }
  

  
  /**
   * Get details of a specific hotel
   */
  async getHotelDetails(hotelId: string) {
    try {
      console.log(`Getting details for hotel ID: ${hotelId} using Makcorps API`);
      
      // Use the Makcorps API service
      const hotelDetail = await makcorpsApiService.getHotelById(hotelId);
      
      if (!hotelDetail) {
        throw new Error(`Hotel with ID ${hotelId} not found`);
      }
      
      console.log(`Found hotel details for ${hotelDetail.name}`);
      
      return hotelDetail;
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      
      // Return a default hotel if there's an error
      return {
        id: hotelId,
        name: "Hotel Information Unavailable",
        address: "Address information unavailable",
        city: "Unknown City",
        country: "Unknown Country",
        rating: 4.0,
        price: 150,
        currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3",
        roomTypes: ["Standard Room"],
        description: "Detailed information for this hotel is currently unavailable. Please try again later.",
        amenities: ["WiFi", "Air Conditioning"],
        offers: [{
          id: `offer_${hotelId}_1`,
          roomType: "Standard Room",
          price: {
            total: 150,
            currency: "USD"
          },
          cancellationPolicy: "Free cancellation until 24 hours before check-in",
          boardType: "Room only"
        }]
      };
    }
  }
  
  /**
   * Book a hotel
   */
  async bookHotel(bookingData: any): Promise<HotelBooking> {
    try {
      // Generate a unique booking reference
      const bookingReference = `HB${randomBytes(4).toString('hex').toUpperCase()}`;
      
      const hotelBookingData: any = {
        ...bookingData,
        bookingReference,
        status: 'CONFIRMED',
      };
      
      // Save the booking to the database
      const booking = await storage.createHotelBooking(hotelBookingData);
      return booking;
    } catch (error) {
      console.error('Hotel booking error:', error);
      throw error;
    }
  }
  
  /**
   * Get hotel bookings for a user
   */
  async getUserHotelBookings(userId: number): Promise<HotelBooking[]> {
    try {
      return await storage.getHotelBookingsByUserId(userId);
    } catch (error) {
      console.error('Error fetching user hotel bookings:', error);
      throw error;
    }
  }
  
  /**
   * Get details of a specific booking
   */
  async getBookingDetails(bookingId: number): Promise<HotelBooking | undefined> {
    try {
      return await storage.getHotelBookingById(bookingId);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  }
}

export const hotelService = new HotelService();