import axios from 'axios';

/**
 * Maps service using RapidAPI Google Maps APIs
 * Provides geocoding, maps, and place data
 */
class MapsService {
  private rapidApiKey: string;
  private geocodingHost = 'google-maps-geocoding.p.rapidapi.com';
  private placesApiHost = 'google-map-places-new-v2.p.rapidapi.com';
  private directionsApiHost = 'route-and-directions.p.rapidapi.com';
  private placesPhotoHost = 'google-map-places-new-v2.p.rapidapi.com';
  
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
        url: 'https://google-map-places-new-v2.p.rapidapi.com/textsearch/json',
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
   * Search for place details including images - using the proper two-step process
   * @param query Search query string (e.g., 'Hotel Manoir Victoria in Quebec')
   * @param type Type of place (hotel, restaurant, attraction)
   * @returns Array of places with details including photos
   */
  async searchPlaces(query: string, type: string = ''): Promise<any> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Cannot search places via Google Maps API.');
      return null;
    }
    
    try {
      console.log(`Searching for place: ${query} (${type})`);
      
      // Step 1: Use textsearch to get place_id - replacing findplacefromtext which doesn't exist
      const findPlaceOptions = {
        method: 'GET',
        url: 'https://google-map-places-new-v2.p.rapidapi.com/textsearch/json',
        params: {
          'query': type ? `${query} ${type}` : query,
          'language': 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.placesApiHost
        }
      };
      
      const findPlaceResponse = await axios.request(findPlaceOptions);
      
      if (findPlaceResponse.data && 
          findPlaceResponse.data.results && 
          findPlaceResponse.data.results.length > 0) {
        
        // We got place_ids, now get details with photos for each place
        const places = [];
        
        for (const candidate of findPlaceResponse.data.results.slice(0, 3)) { // Limit to top 3 matches
          const placeId = candidate.place_id;
          
          if (placeId) {
            // Step 2: Get place details including photos
            const detailsOptions = {
              method: 'GET',
              url: 'https://google-map-places-new-v2.p.rapidapi.com/details/json',
              params: {
                'place_id': placeId,
                'language': 'en',
                'fields': 'name,place_id,formatted_address,geometry,rating,user_ratings_total,types,photos'
              },
              headers: {
                'X-RapidAPI-Key': this.rapidApiKey,
                'X-RapidAPI-Host': this.placesApiHost
              }
            };
            
            try {
              const detailsResponse = await axios.request(detailsOptions);
              
              if (detailsResponse.data && detailsResponse.data.result) {
                const place = detailsResponse.data.result;
                let photoUrl = null;
                let photoReference = null;
                
                // If place has photos, get the first one
                if (place.photos && place.photos.length > 0) {
                  photoReference = place.photos[0].photo_reference;
                  photoUrl = this.getPlacePhotoUrl(photoReference);
                }
                
                places.push({
                  id: place.place_id || `sample-${type}-${Math.floor(Math.random() * 1000)}`,
                  name: place.name,
                  address: place.formatted_address,
                  location: place.geometry?.location,
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  placeTypes: place.types,
                  image: photoUrl || this.getUnsplashFallbackUrl(type, query),
                  photoReference: photoReference
                });
              }
            } catch (detailsError) {
              console.error(`Error getting details for place ID ${placeId}:`, detailsError);
              // Continue with next place
            }
          }
        }
        
        if (places.length > 0) {
          return places;
        }
      }
      
      // If no results or all detail lookups failed, fall back to text search
      const fallbackOptions = {
        method: 'GET',
        url: 'https://google-map-places-new-v2.p.rapidapi.com/textsearch/json',
        params: {
          'query': type ? `${query} ${type}` : query,
          'language': 'en'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.placesApiHost
        }
      };
      
      const fallbackResponse = await axios.request(fallbackOptions);
      
      if (fallbackResponse.data && fallbackResponse.data.results && fallbackResponse.data.results.length > 0) {
        // Process the results to extract image URLs when available
        const results = fallbackResponse.data.results.map((place: any) => {
          let photoUrl = null;
          
          // If place has photos, get the first one
          if (place.photos && place.photos.length > 0) {
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
    if (!photoReference || !this.rapidApiKey) return null;
    
    try {
      // Rather than returning a direct URL, we can create a new middleware endpoint
      // that handles the API key and proxies the request
      return `/api/maps/photo?reference=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
    } catch (error) {
      console.error('Error generating photo URL:', error);
      // Use Unsplash as a fallback
      return `https://source.unsplash.com/640x480/?hotel,destination,travel`;
    }
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
  
  /**
   * Get place details directly by place ID
   * @param placeId Google Maps place ID 
   * @returns Place details including photos
   */
  async getPlaceDetailsById(placeId: string): Promise<any> {
    if (!this.rapidApiKey) {
      console.warn('RAPIDAPI_KEY not set. Cannot get place details.');
      return null;
    }
    
    try {
      const detailsOptions = {
        method: 'GET',
        url: 'https://google-map-places-new-v2.p.rapidapi.com/details/json',
        params: {
          'place_id': placeId,
          'language': 'en',
          'fields': 'name,place_id,formatted_address,geometry,rating,user_ratings_total,types,photos,website,url,price_level,international_phone_number,opening_hours'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.placesApiHost
        }
      };
      
      const detailsResponse = await axios.request(detailsOptions);
      
      if (detailsResponse.data && detailsResponse.data.result) {
        const place = detailsResponse.data.result;
        const photos = [];
        
        // Process all photos if available
        if (place.photos && place.photos.length > 0) {
          for (const photo of place.photos.slice(0, 10)) { // Limit to 10 photos
            const photoUrl = this.getPlacePhotoUrl(photo.photo_reference);
            if (photoUrl) {
              photos.push({
                reference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
                url: photoUrl
              });
            }
          }
        }
        
        return {
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry?.location,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          placeTypes: place.types,
          website: place.website,
          googleMapsUrl: place.url,
          priceLevel: place.price_level,
          phone: place.international_phone_number,
          openingHours: place.opening_hours,
          photos: photos,
          // Add a direct image URL for easy access
          image: photos.length > 0 ? photos[0].url : this.getUnsplashFallbackUrl('hotel', place.name)
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting place details for ID ${placeId}:`, error);
      return null;
    }
  }
}

export const mapsService = new MapsService();