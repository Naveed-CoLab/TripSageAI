import { createApi } from 'unsplash-js';
import { storage } from '../storage';
import { HotelBooking, HotelSearch, InsertHotelBooking, InsertHotelSearch } from '@shared/schema';
import { randomBytes } from 'crypto';

// Setup Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

// Sample hotel data (for demonstration purposes)
// In a real application, this would be fetched from a hotel booking API
const sampleHotels = [
  {
    id: 'hotel1',
    name: 'Grand Plaza Hotel',
    address: '123 Main Street',
    city: 'New York',
    country: 'USA',
    rating: 4.7,
    price: 299,
    currency: 'USD',
    roomTypes: ['Standard', 'Deluxe', 'Suite'],
  },
  {
    id: 'hotel2',
    name: 'Oceanview Resort',
    address: '500 Beachfront Drive',
    city: 'Miami',
    country: 'USA',
    rating: 4.8,
    price: 349,
    currency: 'USD',
    roomTypes: ['Standard', 'Ocean View', 'Presidential Suite'],
  },
  {
    id: 'hotel3',
    name: 'Mountain Retreat Lodge',
    address: '789 Alpine Road',
    city: 'Aspen',
    country: 'USA',
    rating: 4.6,
    price: 279,
    currency: 'USD',
    roomTypes: ['Cabin', 'Luxury Cabin', 'Family Suite'],
  },
  {
    id: 'hotel4',
    name: 'City Center Suites',
    address: '1000 Downtown Avenue',
    city: 'Chicago',
    country: 'USA',
    rating: 4.5,
    price: 259,
    currency: 'USD',
    roomTypes: ['Business Suite', 'Executive Suite', 'Penthouse'],
  },
  {
    id: 'hotel5',
    name: 'Historic Grand Hotel',
    address: '300 Heritage Street',
    city: 'Boston',
    country: 'USA',
    rating: 4.6,
    price: 289,
    currency: 'USD',
    roomTypes: ['Classic Room', 'Heritage Suite', 'Presidential'],
  },
];

export class HotelService {
  /**
   * Search for hotels by location
   */
  async searchHotels(userId: number, location: string, checkInDate: string, checkOutDate: string, guests: number, rooms: number) {
    try {
      // Save the hotel search
      const hotelSearch: any = {
        userId,
        location,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        guests,
        rooms,
      };
      
      await storage.createHotelSearch(hotelSearch);
      
      // In a real application, this would call a hotel API
      // For this demo, we'll use our sample hotels and add location-based filtering
      const matchedHotels = sampleHotels.filter(hotel => 
        hotel.city.toLowerCase().includes(location.toLowerCase()) || 
        hotel.country.toLowerCase().includes(location.toLowerCase())
      );
      
      // If no match with the provided location, return all hotels (for demo purposes)
      const hotelsToReturn = matchedHotels.length > 0 ? matchedHotels : sampleHotels;
      
      // Get hotel images from Unsplash
      const hotelsWithImages = await Promise.all(
        hotelsToReturn.map(async (hotel) => {
          try {
            // Search for hotel images based on hotel name and location
            const searchTerm = `${hotel.name} hotel ${hotel.city}`;
            const result = await unsplash.search.getPhotos({
              query: searchTerm,
              page: 1,
              perPage: 1,
            });
            
            const imageUrl = result.response?.results[0]?.urls?.regular || 
                            // Fallback to a more generic hotel search if specific hotel not found
                            (await this.getGenericHotelImage());
            
            return {
              ...hotel,
              imageUrl,
            };
          } catch (error) {
            console.error('Error fetching hotel image:', error);
            // Provide a fallback image
            const fallbackImage = await this.getGenericHotelImage();
            return {
              ...hotel,
              imageUrl: fallbackImage,
            };
          }
        })
      );
      
      return hotelsWithImages;
    } catch (error) {
      console.error('Hotel search error:', error);
      throw error;
    }
  }
  
  /**
   * Get a generic hotel image when specific search fails
   */
  private async getGenericHotelImage(): Promise<string> {
    try {
      const result = await unsplash.search.getPhotos({
        query: 'luxury hotel',
        page: 1,
        perPage: 10,
      });
      
      if (result.response?.results?.length) {
        // Get a random image from the results
        const randomIndex = Math.floor(Math.random() * result.response.results.length);
        return result.response.results[randomIndex].urls.regular;
      } else {
        // Hard-coded fallback if API fails
        return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3';
      }
    } catch (error) {
      console.error('Failed to get generic hotel image:', error);
      return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3';
    }
  }
  
  /**
   * Get details of a specific hotel
   */
  async getHotelDetails(hotelId: string) {
    const hotel = sampleHotels.find(h => h.id === hotelId);
    
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    
    try {
      // Get hotel image from Unsplash
      const searchTerm = `${hotel.name} hotel ${hotel.city}`;
      const result = await unsplash.search.getPhotos({
        query: searchTerm,
        page: 1,
        perPage: 1,
      });
      
      const imageUrl = result.response?.results[0]?.urls?.regular || await this.getGenericHotelImage();
      
      return {
        ...hotel,
        imageUrl,
      };
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      // Return hotel without image if there's an API error
      return {
        ...hotel,
        imageUrl: await this.getGenericHotelImage(),
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