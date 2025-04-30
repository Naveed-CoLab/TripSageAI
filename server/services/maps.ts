import axios from 'axios';

/**
 * Maps service using RapidAPI Google Maps APIs
 * Provides geocoding, maps, and place data
 */
class MapsService {
  private rapidApiKey: string;
  private geocodingHost = 'google-maps-geocoding.p.rapidapi.com';
  private placesApiHost = 'maps-data-by-google.p.rapidapi.com';
  private directionsApiHost = 'route-and-directions.p.rapidapi.com';
  
  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    
    if (!this.rapidApiKey) {
      console.warn('Warning: RAPIDAPI_KEY environment variable is not set. Maps functionality will be limited.');
    }
  }
  
  /**
   * Geocode a location string to coordinates
   * @param location Location string to geocode
   * @returns Location coordinates or null if geocoding fails
   */
  async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Falling back to basic map URL.');
      return null;
    }
    
    try {
      const options = {
        method: 'GET',
        url: 'https://google-maps-geocoding.p.rapidapi.com/geocode/json',
        params: {
          address: location,
          language: 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.geocodingHost
        }
      };

      const response = await axios.request(options);
      
      if (response.data && 
          response.data.results && 
          response.data.results.length > 0 && 
          response.data.results[0].geometry &&
          response.data.results[0].geometry.location) {
        
        return response.data.results[0].geometry.location;
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }
  
  /**
   * Get a static map image URL
   * @param location Location to show on the map
   * @param zoom Zoom level (1-20)
   * @param width Image width in pixels
   * @param height Image height in pixels
   * @returns URL to a static map image or fallback URL
   */
  async getStaticMapUrl(location: string, zoom = 13, width = 600, height = 400): Promise<string> {
    try {
      const coordinates = await this.geocodeLocation(location);
      
      if (coordinates) {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&size=${width}x${height}&key=YOUR_API_KEY`;
      }
      
      // If geocoding fails, return a fallback URL
      return this.getEmbedMapUrl(location);
    } catch (error) {
      console.error('Error getting static map:', error);
      return this.getEmbedMapUrl(location);
    }
  }
  
  /**
   * Get directions between two locations
   * @param origin Starting location
   * @param destination Ending location
   * @param mode Travel mode (driving, walking, bicycling, transit)
   * @returns Directions data or null if request fails
   */
  async getDirections(origin: string, destination: string, mode = 'driving'): Promise<any> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Cannot get directions.');
      return null;
    }
    
    try {
      // First geocode origin and destination
      const originCoords = await this.geocodeLocation(origin);
      const destCoords = await this.geocodeLocation(destination);
      
      if (!originCoords || !destCoords) {
        console.warn('Could not geocode one of the locations');
        return null;
      }
      
      const options = {
        method: 'GET',
        url: 'https://route-and-directions.p.rapidapi.com/v1/routing',
        params: {
          'waypoints': `${originCoords.lat},${originCoords.lng}|${destCoords.lat},${destCoords.lng}`,
          'mode': mode
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.directionsApiHost
        }
      };

      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }
  
  /**
   * Get nearby places around a location
   * @param location Center location
   * @param type Type of place (restaurant, hotel, museum, etc)
   * @param radius Search radius in meters
   * @returns Array of nearby places or null if request fails
   */
  async getNearbyPlaces(location: string, type: string, radius = 5000): Promise<any> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Cannot get nearby places.');
      return null;
    }
    
    try {
      // First geocode the location
      const coordinates = await this.geocodeLocation(location);
      
      if (!coordinates) {
        console.warn('Could not geocode location');
        return null;
      }
      
      const options = {
        method: 'GET',
        url: 'https://maps-data-by-google.p.rapidapi.com/places/textsearch',
        params: {
          'query': type,
          'location': `${coordinates.lat},${coordinates.lng}`,
          'radius': radius.toString(),
          'language': 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.placesApiHost
        }
      };

      const response = await axios.request(options);
      return response.data.results;
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return null;
    }
  }
  
  /**
   * Get an embed map URL for a location
   * This is a synchronous method used as a fallback
   * @param location Location to display
   * @param zoom Zoom level (1-20)
   * @returns Google Maps embed URL
   */
  getEmbedMapUrl(location: string, zoom = 13): string {
    return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }
}

export const mapsService = new MapsService();