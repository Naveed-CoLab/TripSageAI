import { apiRequest } from '@/lib/queryClient';

// Client-side service for interacting with our Google Maps API
export const MapsService = {
  /**
   * Get geocode information for a location
   * @param location The location string to geocode
   * @returns The geocode result or embedding URL if geocoding fails
   */
  async geocodeLocation(location: string) {
    try {
      const response = await fetch(`/api/maps/geocode?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error geocoding location:', error);
      // Fallback to default embed map
      return {
        success: false,
        embedUrl: this.getEmbedMapUrl(location)
      };
    }
  },

  /**
   * Get a static map URL for a location
   * @param location The location to display on the map
   * @param zoom The zoom level (1-20)
   * @param width The map width in pixels
   * @param height The map height in pixels
   * @returns The static map URL
   */
  async getStaticMapUrl(location: string, zoom = 13, width = 600, height = 400) {
    try {
      const response = await fetch(
        `/api/maps/static?location=${encodeURIComponent(location)}&zoom=${zoom}&width=${width}&height=${height}`
      );
      const data = await response.json();
      return data.mapUrl;
    } catch (error) {
      console.error('Error getting static map:', error);
      // Fallback to a simple embed URL if API fails
      return this.getEmbedMapUrl(location);
    }
  },

  /**
   * Get directions between two locations
   * @param origin The starting location
   * @param destination The ending location
   * @param mode The travel mode (driving, walking, transit, bicycling)
   * @returns Directions data
   */
  async getDirections(origin: string, destination: string, mode = 'driving') {
    try {
      const response = await fetch(
        `/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
          destination
        )}&mode=${mode}`
      );
      const data = await response.json();
      return data.directions;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  },

  /**
   * Get nearby places around a location
   * @param location The center location to search around
   * @param type The type of place to search for (restaurant, hotel, etc.)
   * @param radius The search radius in meters
   * @returns Nearby places data
   */
  async getNearbyPlaces(location: string, type: string, radius = 5000) {
    try {
      const response = await fetch(
        `/api/maps/nearby?location=${encodeURIComponent(location)}&type=${type}&radius=${radius}`
      );
      const data = await response.json();
      return data.places;
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return null;
    }
  },

  /**
   * Get an embed map URL for a location
   * @param location The location to display
   * @param zoom The zoom level (1-20)
   * @returns The embed map URL
   */
  async getEmbedMapUrl(location: string, zoom = 13) {
    try {
      const response = await fetch(`/api/maps/embed?location=${encodeURIComponent(location)}&zoom=${zoom}`);
      const data = await response.json();
      return data.embedUrl;
    } catch (error) {
      console.error('Error getting embed map URL:', error);
      // Generate a basic fallback URL
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }
  },

  /**
   * Synchronous fallback to get a basic embed map URL (for error cases)
   * @param location The location to display
   * @param zoom The zoom level (1-20) 
   * @returns A basic Google Maps embed URL
   */
  getEmbedMapUrl(location: string, zoom = 13) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }
};