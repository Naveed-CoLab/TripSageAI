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
  location_id: string;
  name: string;
  description: string;
  web_url: string;
  address_obj: {
    street1: string;
    city: string;
    country: string;
    postalcode: string;
  };
  rating: string;
  num_reviews: string;
  photo: {
    images: {
      small: { url: string };
      thumbnail: { url: string };
      original: { url: string };
      large: { url: string };
      medium: { url: string };
    };
  };
  price_level: string;
  price: string;
  hotel_class: string;
}

export interface SearchResponse {
  data: TripAdvisorLocation[];
}

export interface LocationImagesResponse {
  data: TripAdvisorImage[];
}

const tripAdvisorApi = {
  // Search for locations by query (hotels, attractions, restaurants, etc.)
  async searchLocations(query: string, type?: string): Promise<SearchResponse | null> {
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

  // Get images for a specific location
  async getLocationImages(locationId: string): Promise<LocationImagesResponse | null> {
    const options = {
      method: 'GET',
      url: `https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails`,
      params: {
        restaurantsId: locationId,
        currencyCode: 'USD'
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
      console.error('Error getting TripAdvisor location images:', error);
      return null;
    }
  },

  // Search for hotels in a specific location
  async searchHotels(locationId: string): Promise<SearchResponse | null> {
    const options = {
      method: 'GET',
      url: 'https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels',
      params: {
        geoId: locationId,
        checkIn: '2024-06-01',
        checkOut: '2024-06-15',
        pageNumber: '1',
        currencyCode: 'USD'
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
      console.error('Error searching TripAdvisor hotels:', error);
      return null;
    }
  },

  // Get photos for a specific hotel
  async getHotelPhotos(locationId: string): Promise<LocationImagesResponse | null> {
    const options = {
      method: 'GET',
      url: 'https://tripadvisor16.p.rapidapi.com/api/v1/hotels/getHotelDetails',
      params: {
        id: locationId,
        checkIn: '2024-06-01',
        checkOut: '2024-06-15',
        currency: 'USD'
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
      console.error('Error getting TripAdvisor hotel photos:', error);
      return null;
    }
  }
};

export default tripAdvisorApi;