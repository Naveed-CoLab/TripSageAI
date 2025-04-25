import { createApi } from 'unsplash-js';
import { storage } from '../storage';
import { HotelBooking, HotelSearch, InsertHotelBooking, InsertHotelSearch } from '@shared/schema';
import { randomBytes } from 'crypto';
import { searchHotels as searchAmadeusHotels, getHotelDetails as getAmadeusHotelDetails } from './amadeus';

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
      
      // Search hotels using the Amadeus API
      const hotels = await searchAmadeusHotels({
        cityCode: this.getCityCode(location), // Try to convert location to a city code
        checkInDate,
        checkOutDate,
        adults: guests,
        roomQuantity: rooms,
        currency: 'USD', // Default currency
        bestRateOnly: true, // Only get the best rate for each hotel
        view: 'FULL' // Get full hotel details
      });
      
      // Process hotels and add additional images from Unsplash if needed
      const enhancedHotels = await Promise.all(
        hotels.map(async (hotel: any) => {
          // Check if hotel already has media
          if (hotel.media && hotel.media.length > 0) {
            return {
              id: hotel.hotelId,
              name: hotel.name,
              address: hotel.address?.lines?.[0] || '',
              city: hotel.address?.cityName || '',
              country: hotel.address?.countryCode || '',
              rating: parseFloat(hotel.rating || '0'),
              price: parseFloat(hotel.price?.total || '0'),
              currency: hotel.price?.currency || 'USD',
              imageUrl: hotel.media[0].uri,
              roomTypes: []  // We'll get room types from hotel details
            };
          }
          
          // If no image, fetch one from Unsplash
          try {
            const searchTerm = `${hotel.name} hotel ${hotel.address?.cityName || location}`;
            const result = await unsplash.search.getPhotos({
              query: searchTerm,
              page: 1,
              perPage: 1,
            });
            
            const imageUrl = result.response?.results[0]?.urls?.regular || 
                            await this.getGenericHotelImage();
            
            return {
              id: hotel.hotelId,
              name: hotel.name,
              address: hotel.address?.lines?.[0] || '',
              city: hotel.address?.cityName || '',
              country: hotel.address?.countryCode || '',
              rating: parseFloat(hotel.rating || '0'),
              price: parseFloat(hotel.price?.total || '0'),
              currency: hotel.price?.currency || 'USD',
              imageUrl,
              roomTypes: []  // We'll get room types from hotel details
            };
          } catch (error) {
            console.error('Error fetching hotel image:', error);
            // Provide a fallback image
            const fallbackImage = await this.getGenericHotelImage();
            
            return {
              id: hotel.hotelId,
              name: hotel.name,
              address: hotel.address?.lines?.[0] || '',
              city: hotel.address?.cityName || '',
              country: hotel.address?.countryCode || '',
              rating: parseFloat(hotel.rating || '0'),
              price: parseFloat(hotel.price?.total || '0'),
              currency: hotel.price?.currency || 'USD',
              imageUrl: fallbackImage,
              roomTypes: []  // We'll get room types from hotel details
            };
          }
        })
      );
      
      return enhancedHotels;
    } catch (error) {
      console.error('Hotel search error:', error);
      throw error;
    }
  }
  
  /**
   * Get city code from location name using the Amadeus Location Search API first
   * Falls back to a simplified mapping if the API fails
   */
  private async getCityCode(location: string): Promise<string> {
    try {
      // Try to find the location code using Amadeus Location Search API
      const locationResults = await searchLocations(location);
      
      // If we found a matching location with an IATA code, use it
      if (locationResults && locationResults.length > 0) {
        const cityLocation = locationResults.find(loc => 
          (loc.subType === 'CITY' || loc.subType === 'CITY_AIRPORT') && loc.iataCode
        );
        
        if (cityLocation && cityLocation.iataCode) {
          console.log(`Found city code ${cityLocation.iataCode} for location ${location}`);
          return cityLocation.iataCode;
        }
      }
      
      // Fallback to our mapping if API doesn't return a suitable result
      const cityMapping: Record<string, string> = {
        'new york': 'NYC',
        'miami': 'MIA',
        'aspen': 'ASE',
        'chicago': 'CHI',
        'boston': 'BOS',
        'los angeles': 'LAX',
        'san francisco': 'SFO',
        'london': 'LON',
        'paris': 'PAR',
        'tokyo': 'TYO',
        'madrid': 'MAD',
        'barcelona': 'BCN',
        'berlin': 'BER',
        'rome': 'ROM',
        'sydney': 'SYD',
        'singapore': 'SIN',
        'dubai': 'DXB',
        'hong kong': 'HKG',
        'bangkok': 'BKK',
        'toronto': 'YTO',
        'munich': 'MUC',
        'amsterdam': 'AMS',
        'zurich': 'ZRH',
        'vienna': 'VIE',
        'prague': 'PRG',
        'seoul': 'SEL',
        'shanghai': 'SHA',
        'beijing': 'BJS',
        'delhi': 'DEL',
        'mumbai': 'BOM',
        'lisbon': 'LIS',
        'athens': 'ATH',
        'istanbul': 'IST',
        'venice': 'VCE',
        'florence': 'FLR',
        'milan': 'MIL',
        'naples': 'NAP',
        'dublin': 'DUB',
        'budapest': 'BUD',
        'mexico city': 'MEX',
        'rio de janeiro': 'RIO',
        'sao paulo': 'SAO',
        'buenos aires': 'BUE',
        'johannesburg': 'JNB',
        'cape town': 'CPT',
        'cairo': 'CAI',
        'marrakech': 'RAK',
        'hawaii': 'HNL',
        'honolulu': 'HNL',
        'bali': 'DPS',
        'phuket': 'HKT',
        'kuala lumpur': 'KUL',
        'manila': 'MNL',
        'washington': 'WAS',
        'washington dc': 'WAS',
        'san diego': 'SAN',
        'seattle': 'SEA',
        'dallas': 'DFW',
        'atlanta': 'ATL',
        'houston': 'HOU',
        'phoenix': 'PHX',
        'las vegas': 'LAS',
        'orlando': 'MCO',
        'spain': 'MAD',
        'france': 'PAR',
        'italy': 'ROM',
        'germany': 'BER',
        'uk': 'LON',
        'england': 'LON',
        'usa': 'NYC',
        'australia': 'SYD',
        'japan': 'TYO',
        'china': 'BJS',
        'canada': 'YTO',
      };
      
      const normalized = location.toLowerCase();
      
      for (const [city, code] of Object.entries(cityMapping)) {
        if (normalized.includes(city)) {
          console.log(`Using mapped city code ${code} for location ${location}`);
          return code;
        }
      }
      
      // If no match found, just use first 3 letters capitalized
      const defaultCode = location.substring(0, 3).toUpperCase();
      console.log(`No city code found for ${location}, using default: ${defaultCode}`);
      return defaultCode;
    } catch (error) {
      console.error(`Error getting city code for ${location}:`, error);
      // Fallback to first 3 letters if everything fails
      return location.substring(0, 3).toUpperCase();
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
    try {
      // Get current dates for availability search (two days from now, for 2 nights)
      const today = new Date();
      const checkInDate = new Date(today);
      checkInDate.setDate(today.getDate() + 2);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + 2);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };
      
      // Get hotel details from Amadeus API
      const hotelDetail = await getAmadeusHotelDetails(hotelId, {
        checkInDate: formatDate(checkInDate),
        checkOutDate: formatDate(checkOutDate),
        adults: 2,
        roomQuantity: 1,
        currency: 'USD'
      });
      
      // Extract room types from available offers
      const roomTypes = hotelDetail.offers?.map(offer => offer.room.type) || [];
      
      // Format the response
      return {
        id: hotelDetail.hotelId,
        name: hotelDetail.name,
        address: hotelDetail.address?.lines?.join(', ') || '',
        city: hotelDetail.address?.cityName || '',
        country: hotelDetail.address?.countryCode || '',
        rating: parseFloat(hotelDetail.rating || '0'),
        price: hotelDetail.offers && hotelDetail.offers.length > 0 
          ? parseFloat(hotelDetail.offers[0].price.total) 
          : 0,
        currency: hotelDetail.offers && hotelDetail.offers.length > 0 
          ? hotelDetail.offers[0].price.currency 
          : 'USD',
        roomTypes: Array.from(new Set(roomTypes)), // Remove duplicates
        imageUrl: hotelDetail.media && hotelDetail.media.length > 0 
          ? hotelDetail.media[0].uri 
          : await this.getGenericHotelImage(),
        description: hotelDetail.description?.text || '',
        amenities: hotelDetail.amenities || [],
        offers: hotelDetail.offers || [],
      };
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      throw error;
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