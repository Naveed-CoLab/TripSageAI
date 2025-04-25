import axios from 'axios';

// Define interfaces based on Makcorps API response structure
interface CityMappingResponse {
  cityId: string;
  cityCode: string;
  cityName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

interface HotelMappingResponse {
  hotelId: string;
  hotelChain: string;
  hotelName: string;
  hotelAddress: string;
  cityId: string;
  cityName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
}

interface HotelSearchResponse {
  hotelId: string;
  hotelName: string;
  address: string;
  cityName: string;
  countryCode: string;
  starRating: number;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
  availableRooms: {
    roomType: string;
    price: number;
    currency: string;
    boardType: string;
    cancellationPolicy: string;
  }[];
  amenities: string[];
  imageUrl: string;
  description: string;
}

// HotelResult interface to maintain consistency with existing code
interface HotelResult {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  price: number;
  currency: string;
  imageUrl: string;
  roomTypes: string[];
}

interface HotelDetail extends HotelResult {
  description: string;
  amenities: string[];
  offers: any[];
}

/**
 * Makcorps API Service for hotel searches and city mapping
 */
class MakcorpsApiService {
  private apiKey: string;
  private baseUrl: string;
  private unsplashImageCache: Record<string, string> = {};
  
  constructor() {
    this.apiKey = process.env.MAKCORPS_API_KEY || '';
    this.baseUrl = 'https://api.makcorps.com/v1';
    
    if (!this.apiKey) {
      console.warn('MAKCORPS_API_KEY is not set. API calls will fail.');
    }
  }
  
  /**
   * Get city ID from location name
   */
  async getCityMapping(location: string): Promise<CityMappingResponse | null> {
    try {
      console.log(`Getting city mapping for: ${location}`);
      const response = await axios.get(`${this.baseUrl}/mapping/city`, {
        params: {
          query: location,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Found city mapping: ${response.data[0].cityName}`);
        return response.data[0];
      }
      
      console.log(`No city mapping found for ${location}`);
      return null;
    } catch (error) {
      console.error('Error fetching city mapping:', error);
      return null;
    }
  }
  
  /**
   * Get hotel details by hotel ID
   */
  async getHotelMapping(hotelId: string): Promise<HotelMappingResponse | null> {
    try {
      console.log(`Getting hotel mapping for ID: ${hotelId}`);
      const response = await axios.get(`${this.baseUrl}/mapping/hotel/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.data) {
        console.log(`Found hotel mapping: ${response.data.hotelName}`);
        return response.data;
      }
      
      console.log(`No hotel mapping found for ID ${hotelId}`);
      return null;
    } catch (error) {
      console.error('Error fetching hotel mapping:', error);
      return null;
    }
  }
  
  /**
   * Search hotels by city ID
   */
  async searchHotelsByCity(cityId: string, checkIn?: string, checkOut?: string): Promise<HotelSearchResponse[]> {
    try {
      console.log(`Searching hotels for city ID: ${cityId}`);
      
      // Default to dates two days from now for a 2-night stay
      if (!checkIn || !checkOut) {
        const today = new Date();
        const checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() + 2);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + 2);
        
        checkIn = this.formatDate(checkInDate);
        checkOut = this.formatDate(checkOutDate);
      }
      
      const response = await axios.get(`${this.baseUrl}/hotels/search`, {
        params: {
          cityId,
          checkIn,
          checkOut,
          adults: 2,
          rooms: 1,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.data && response.data.length > 0) {
        console.log(`Found ${response.data.length} hotels for city ID ${cityId}`);
        return response.data;
      }
      
      console.log(`No hotels found for city ID ${cityId}`);
      return [];
    } catch (error) {
      console.error('Error searching hotels:', error);
      return [];
    }
  }
  
  /**
   * Get details for a specific hotel
   */
  async getHotelDetails(hotelId: string): Promise<HotelSearchResponse | null> {
    try {
      console.log(`Getting details for hotel ID: ${hotelId}`);
      
      // Default dates for availability
      const today = new Date();
      const checkInDate = new Date(today);
      checkInDate.setDate(today.getDate() + 2);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkInDate.getDate() + 2);
      
      const checkIn = this.formatDate(checkInDate);
      const checkOut = this.formatDate(checkOutDate);
      
      const response = await axios.get(`${this.baseUrl}/hotels/${hotelId}`, {
        params: {
          checkIn,
          checkOut,
          adults: 2,
          rooms: 1,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.data) {
        console.log(`Found hotel details for ${response.data.hotelName}`);
        return response.data;
      }
      
      console.log(`No hotel details found for ID ${hotelId}`);
      return null;
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      return null;
    }
  }
  
  /**
   * Format date to YYYY-MM-DD for API requests
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Map a Makcorps hotel response to our standard hotel result format
   */
  private mapToHotelResult(hotel: HotelSearchResponse): HotelResult {
    const roomTypes = hotel.availableRooms.map(room => room.roomType);
    // Create unique array using filter instead of Set
    const uniqueRoomTypes = roomTypes.filter((value, index, self) => 
      self.indexOf(value) === index
    );
    
    return {
      id: hotel.hotelId,
      name: hotel.hotelName,
      address: hotel.address,
      city: hotel.cityName,
      country: hotel.countryCode,
      rating: hotel.starRating,
      price: hotel.price,
      currency: hotel.currency || 'USD',
      imageUrl: hotel.imageUrl,
      roomTypes: uniqueRoomTypes,
    };
  }
  
  /**
   * Map a Makcorps hotel response to our standard hotel detail format
   */
  private mapToHotelDetail(hotel: HotelSearchResponse): HotelDetail {
    const offers = hotel.availableRooms.map((room, index) => ({
      id: `${hotel.hotelId}_offer_${index}`,
      roomType: room.roomType,
      price: {
        total: room.price,
        currency: room.currency || 'USD',
      },
      boardType: room.boardType || 'Room only',
      cancellationPolicy: room.cancellationPolicy || 'Free cancellation up to 24 hours before check-in',
    }));
    
    // Create unique array of room types using filter instead of Set
    const allRoomTypes = hotel.availableRooms.map(room => room.roomType);
    const uniqueRoomTypes = allRoomTypes.filter((value, index, self) => 
      self.indexOf(value) === index
    );
    
    return {
      id: hotel.hotelId,
      name: hotel.hotelName,
      address: hotel.address,
      city: hotel.cityName,
      country: hotel.countryCode,
      rating: hotel.starRating,
      price: hotel.price,
      currency: hotel.currency || 'USD',
      imageUrl: hotel.imageUrl,
      roomTypes: uniqueRoomTypes,
      description: hotel.description || `Experience comfort and convenience at ${hotel.hotelName}, located in ${hotel.cityName}.`,
      amenities: hotel.amenities || ['Free WiFi', 'Air Conditioning', '24-hour front desk'],
      offers,
    };
  }
  
  /**
   * Search hotels by location
   */
  async searchHotels(location: string): Promise<HotelResult[]> {
    try {
      console.log(`Searching hotels for location: ${location}`);
      
      // Step 1: Get city mapping
      const cityMapping = await this.getCityMapping(location);
      if (!cityMapping) {
        console.log(`No city mapping found for ${location}, using fallback`);
        return this.getFallbackHotels(location);
      }
      
      // Step 2: Search hotels by city ID
      const hotels = await this.searchHotelsByCity(cityMapping.cityId);
      if (hotels.length === 0) {
        console.log(`No hotels found for city ID ${cityMapping.cityId}, using fallback`);
        return this.getFallbackHotels(location);
      }
      
      // Step 3: Map to our standard format
      return hotels.map(hotel => this.mapToHotelResult(hotel));
    } catch (error) {
      console.error('Error in hotel search flow:', error);
      return this.getFallbackHotels(location);
    }
  }
  
  /**
   * Get hotel details by ID
   */
  async getHotelById(hotelId: string): Promise<HotelDetail | null> {
    try {
      console.log(`Getting hotel details for ID: ${hotelId}`);
      
      // Get hotel details
      const hotelDetails = await this.getHotelDetails(hotelId);
      if (!hotelDetails) {
        console.log(`No hotel details found for ID ${hotelId}, using fallback`);
        return this.getFallbackHotelDetail(hotelId);
      }
      
      // Map to our standard format
      return this.mapToHotelDetail(hotelDetails);
    } catch (error) {
      console.error('Error getting hotel details:', error);
      return this.getFallbackHotelDetail(hotelId);
    }
  }
  
  /**
   * Get fallback hotels when API fails
   */
  private getFallbackHotels(location: string): HotelResult[] {
    console.log(`Using fallback hotels for ${location}`);
    return this.generateMockHotels(location, 8);
  }
  
  /**
   * Get fallback hotel detail when API fails
   */
  private getFallbackHotelDetail(hotelId: string): HotelDetail {
    console.log(`Using fallback hotel detail for ID ${hotelId}`);
    return {
      id: hotelId,
      name: "Grand Hotel",
      address: "123 Main Street",
      city: "Unknown City",
      country: "US",
      rating: 4,
      price: 200,
      currency: "USD",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      roomTypes: ["Standard Room", "Deluxe Room", "Suite"],
      description: "A comfortable hotel with modern amenities and excellent service.",
      amenities: ["Free WiFi", "Swimming Pool", "Fitness Center", "Restaurant", "Room Service"],
      offers: [
        {
          id: `${hotelId}_offer_1`,
          roomType: "Standard Room",
          price: {
            total: 200,
            currency: "USD"
          },
          boardType: "Room only",
          cancellationPolicy: "Free cancellation up to 24 hours before check-in"
        },
        {
          id: `${hotelId}_offer_2`,
          roomType: "Deluxe Room",
          price: {
            total: 250,
            currency: "USD"
          },
          boardType: "Breakfast included",
          cancellationPolicy: "Free cancellation up to 24 hours before check-in"
        }
      ]
    };
  }
  
  /**
   * Generate mock hotels with consistent data based on location name
   */
  private generateMockHotels(location: string, count: number): HotelResult[] {
    const hotels: HotelResult[] = [];
    const hotelChains = [
      'Marriott', 'Hilton', 'Hyatt', 'Four Seasons', 'Ritz-Carlton', 
      'Sheraton', 'Holiday Inn', 'Westin', 'Radisson', 'InterContinental'
    ];
    
    const hotelImages = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'
    ];
    
    for (let i = 0; i < count; i++) {
      const hotelChain = hotelChains[i % hotelChains.length];
      const rating = 3 + Math.floor(Math.random() * 2) + (Math.random() > 0.5 ? 0.5 : 0);
      const price = 150 + Math.floor(Math.random() * 15) * 10;
      const hotelId = `hotel_${location.replace(/\s+/g, '_').toLowerCase()}_${i}`;
      
      hotels.push({
        id: hotelId,
        name: `${hotelChain} ${location}`,
        address: `${100 + i} Main Street, ${location}`,
        city: location,
        country: 'US',
        rating: rating,
        price: price,
        currency: 'USD',
        imageUrl: hotelImages[i % hotelImages.length],
        roomTypes: ['Standard Room', 'Deluxe Room', 'Suite'].slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }
    
    return hotels;
  }
}

export const makcorpsApiService = new MakcorpsApiService();