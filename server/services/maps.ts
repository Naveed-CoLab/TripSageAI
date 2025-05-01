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
  private placesPhotoHost = 'maps-data-by-google.p.rapidapi.com';
  
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
  
  /**
   * Search for place details including images
   * @param query Search query string (e.g., 'Hotel Manoir Victoria in Quebec')
   * @param type Type of place (hotel, restaurant, attraction)
   * @returns Array of places with details including photo references
   */
  async searchPlaces(query: string, type: string = ''): Promise<any> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Cannot search places via Google Maps API.');
      return null;
    }
    
    try {
      console.log(`Searching for place: ${query} (${type})`);
      
      const options = {
        method: 'GET',
        url: 'https://maps-data-by-google.p.rapidapi.com/places/textsearch',
        params: {
          'query': type ? `${query} ${type}` : query,
          'language': 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.placesApiHost
        }
      };
      
      const response = await axios.request(options);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        // Process the results to extract image URLs when available
        const results = response.data.results.map((place: any) => {
          let photoUrl = null;
          
          // If place has photos, get the first one
          if (place.photos && place.photos.length > 0) {
            // For photos, we need to make an additional API call to get the actual image
            // Here we'll return the photo_reference that can be used to fetch the photo
            photoUrl = this.getPlacePhotoUrl(place.photos[0].photo_reference);
          }
          
          return {
            id: place.place_id || `sample-${type}-${Math.floor(Math.random() * 1000)}`,
            name: place.name,
            address: place.formatted_address,
            location: place.geometry?.location,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            placeTypes: place.types,
            image: photoUrl || this.getUnsplashFallbackUrl(type, query),
            photoReference: place.photos?.[0]?.photo_reference
          };
        });
        
        return results;
      }
      
      // If no results from Google Maps, use fallback
      console.log(`No results from Google Maps API for ${query}, using fallback images`);
      return this.getFallbackPlaces(query, type);
    } catch (error) {
      console.error('Error searching places:', error);
      // On error, return fallback data
      return this.getFallbackPlaces(query, type);
    }
  }
  
  /**
   * Get a photo URL from a Google Maps photo reference
   * @param photoReference The photo reference from Google Maps API
   * @param maxWidth Maximum width of the photo
   * @returns URL to the photo
   */
  getPlacePhotoUrl(photoReference: string, maxWidth: number = 800): string | null {
    if (!photoReference) return null;
    
    // For testing purposes, we'll simulate photo URLs since actual implementation
    // would require Google Maps API key which we're not using here
    // In a real implementation, you would use Google's Place Photos API
    return `https://maps-data-by-google.p.rapidapi.com/places/photo?photo_reference=${photoReference}&maxwidth=${maxWidth}`;
  }
  
  /**
   * Get fallback hotel data when API calls fail
   * @param query The search query
   * @param type Type of place (hotel, restaurant, etc)
   * @returns Fallback place data with Unsplash images
   */
  getFallbackPlaces(query: string, type: string): any[] {
    // Generate a deterministic ID from the query to ensure consistency
    const id = `sample-${type}-${Math.abs(query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100)}`;
    
    return [{
      id: id,
      name: query.split(' in ')[0] || query,
      address: query.split(' in ')[1] || 'Sample address',
      rating: 4.5,
      userRatingsTotal: 150,
      placeTypes: [type],
      image: this.getUnsplashFallbackUrl(type, query),
    }];
  }
  
  /**
   * Get a fallback image URL from Unsplash for a place type
   * @param type Type of place (hotel, restaurant, etc)
   * @param query Search query to use for more specific images
   * @returns Unsplash image URL
   */
  getUnsplashFallbackUrl(type: string, query: string): string {
    // Extract location from query if it exists (e.g., "Hotel in Paris" -> "Paris")
    let location = '';
    if (query.includes(' in ')) {
      location = query.split(' in ')[1].split(' ')[0];
    }
    
    // Create a search term based on the type and location
    let searchTerm = type || 'place';
    if (location) {
      searchTerm += `,${location}`;
    }
    
    // Return a dynamic Unsplash image URL
    return `https://source.unsplash.com/640x480/?${encodeURIComponent(searchTerm)}`;
  }
  
  /**
   * Get hotel details including images
   * @param hotelName Name of the hotel
   * @param destination Location of the hotel
   * @returns Hotel details including images
   */
  async getHotelDetails(hotelName: string, destination: string): Promise<any> {
    const searchQuery = `${hotelName} in ${destination}`;
    return this.searchPlaces(searchQuery, 'hotel');
  }
}

export const mapsService = new MapsService();