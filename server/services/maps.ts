import axios from 'axios';

// Service for Google Maps API via RapidAPI
class MapsService {
  private rapidApiKey: string;
  private baseUrl: string = 'https://google-maps28.p.rapidapi.com';

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    
    if (!this.rapidApiKey) {
      console.warn('WARNING: RAPIDAPI_KEY is not set. Map features will be limited.');
    }
  }

  // Generate a static map URL for a location
  async getStaticMapUrl(location: string, zoom: number = 13, width: number = 600, height: number = 400): Promise<string> {
    if (!this.rapidApiKey) {
      // Fallback to a simple Google Maps embed URL if API key is not available
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }

    try {
      // Get coordinates for the location using geocoding
      const coordinates = await this.geocodeLocation(location);
      if (!coordinates) {
        throw new Error('Could not geocode location');
      }

      // Construct a static map URL using RapidAPI
      return `${this.baseUrl}/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&size=${width}x${height}&key=${this.rapidApiKey}`;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      // Fallback to a simple Google Maps embed URL
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // Geocode a location string to get coordinates
  async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.rapidApiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: location,
          language: 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'google-maps28.p.rapidapi.com'
        }
      });

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  // Get a Google Maps embed URL for a location
  getEmbedMapUrl(location: string, zoom: number = 13): string {
    // This creates a simple embed URL that doesn't require an API key
    return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  // Get directions between two locations
  async getDirections(origin: string, destination: string, mode: string = 'driving'): Promise<any> {
    if (!this.rapidApiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin,
          destination,
          mode,
          language: 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'google-maps28.p.rapidapi.com'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  // Get places near a location
  async getNearbyPlaces(location: string, type: string, radius: number = 5000): Promise<any> {
    if (!this.rapidApiKey) {
      return null;
    }

    try {
      // First geocode the location to get coordinates
      const coordinates = await this.geocodeLocation(location);
      if (!coordinates) {
        throw new Error('Could not geocode location');
      }

      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${coordinates.lat},${coordinates.lng}`,
          radius,
          type,
          language: 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'google-maps28.p.rapidapi.com'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return null;
    }
  }
}

export const mapsService = new MapsService();