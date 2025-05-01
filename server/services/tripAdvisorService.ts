import axios from 'axios';

// TripAdvisor API via RapidAPI

// Types for the TripAdvisor API responses
interface TripAdvisorImage {
  images: {
    original: {
      url: string;
    };
    large: {
      url: string;
    };
    medium: {
      url: string;
    };
    small: {
      url: string;
    };
  };
}

interface TripAdvisorLocation {
  locationId?: string;
  location_id?: string;
  geoId?: string;
  name: string;
  description?: string;
  web_url?: string;
  address_obj?: {
    street1: string;
    city: string;
    country: string;
    postalcode: string;
  };
  rating?: string;
  num_reviews?: string;
  photo?: {
    images: {
      small: { url: string };
      thumbnail: { url: string };
      original: { url: string };
      large: { url: string };
      medium: { url: string };
    };
  };
  price_level?: string;
  price?: string;
  hotel_class?: string;
}

export interface SearchResponse {
  data: TripAdvisorLocation[];
}

export interface LocationImagesResponse {
  data: TripAdvisorImage[];
}

const tripAdvisorApi = {
  // First step: Search for a location by name to get the locationId
  async searchLocationsByQuery(query: string): Promise<any | null> {
    const options = {
      method: 'GET',
      url: 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation',
      params: {
        query: query
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error('Error searching TripAdvisor locations:', error);
      return null;
    }
  },

  // Directly search for hotels by name - better for our use case with bookings
  async searchHotelsByName(hotelName: string, location: string): Promise<any | null> {
    try {
      // Step 1: First search for the location to get the location ID
      const locationSearch = await this.searchLocationsByQuery(location);
      
      if (!locationSearch || !locationSearch.data || locationSearch.data.length === 0) {
        console.error('Location not found:', location);
        return null;
      }
      
      // Get the first location result
      const locationData = locationSearch.data[0];
      const locationId = locationData.locationId || locationData.geoId || locationData.location_id;
      
      if (!locationId) {
        console.error('No location ID found for:', location);
        return null;
      }
      
      // Step 2: Search for hotels in this location
      const hotelOptions = {
        method: 'GET',
        url: 'https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels',
        params: {
          locationId: locationId,
          checkIn: '2025-05-01',
          checkOut: '2025-05-10',
          pageNumber: '1',
          pageSize: '10',
          // Add the hotel name as a filter if provided
          ...(hotelName && { q: hotelName })
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
        }
      };
      
      const hotelsResponse = await axios.request(hotelOptions);
      
      // Process the results to simplify access
      if (hotelsResponse.data && hotelsResponse.data.data && 
          hotelsResponse.data.data.data && hotelsResponse.data.data.data.length > 0) {
          
        // Extract and format the hotel results
        const hotels = hotelsResponse.data.data.data.map((hotel: any) => ({
          id: hotel.id || hotel.locationId,
          name: hotel.title,
          image: hotel.primaryPhoto?.urlTemplate.replace('{width}', '720') || null,
          rating: hotel.bubbleRating?.rating || null,
          reviewCount: hotel.bubbleRating?.count || null,
          price: hotel.priceForDisplay || null,
        }));
        
        return hotels;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching hotels by name:', error);
      return null;
    }
  },

  // Combined search method that handles different types
  async searchByQueryAndType(query: string, type: string = 'hotels'): Promise<any | null> {
    try {
      // For hotels, use our two-step process
      if (type === 'hotels') {
        // Split query to separate hotel name and location
        // Assuming format like "Hilton Hotel in Paris" or just "Paris" for all hotels
        let hotelName = '';
        let location = query;
        
        if (query.toLowerCase().includes(' in ')) {
          const parts = query.split(' in ');
          hotelName = parts[0].trim();
          location = parts[1].trim();
        }
        
        return await this.searchHotelsByName(hotelName, location);
      } 
      
      // For other types, just do a direct location search for now
      const results = await this.searchLocationsByQuery(query);
      
      if (results && results.data && results.data.length > 0) {
        return results.data.map((item: any) => ({
          id: item.locationId || item.location_id,
          name: item.name || item.title,
          image: item.photo?.images?.original?.url || 
                 item.photo?.images?.large?.url,
          rating: item.rating,
          reviewCount: item.num_reviews,
          type: type,
        }));
      }
      
      return null;
    } catch (error) {
      console.error(`Error in searchByQueryAndType (${type}):`, error);
      return null;
    }
  }
};

export default tripAdvisorApi;