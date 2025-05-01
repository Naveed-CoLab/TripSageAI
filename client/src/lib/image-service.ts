import { createApi } from 'unsplash-js';

// Initialize Unsplash API client if the access key is available
const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
const unsplash = unsplashAccessKey ? createApi({ accessKey: unsplashAccessKey }) : null;

/**
 * Fetches a destination image in real-time using multiple fallback methods:
 * 1. Unsplash API (if access key is available)
 * 2. Direct Unsplash URL (which doesn't require an API key)
 * 3. A predefined list of popular destinations
 * 4. A default travel image
 */
export async function fetchDestinationImage(destination: string): Promise<string> {
  // If no destination provided, return a default travel image
  if (!destination) {
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';
  }
  
  try {
    // Try using the Unsplash API if available
    if (unsplash) {
      try {
        const result = await unsplash.search.getPhotos({
          query: `travel ${destination} destination landmark`,
          orientation: 'landscape',
          perPage: 1,
        });
        
        const photo = result.response?.results?.[0];
        if (photo?.urls?.regular) {
          return photo.urls.regular;
        }
      } catch (error) {
        console.error("Error fetching from Unsplash API:", error);
      }
    }
    
    // Try using direct Unsplash URL (doesn't require API key)
    const cleanDestination = encodeURIComponent(destination.replace(/[^\w\s]/gi, ''));
    return `https://source.unsplash.com/1200x800/?${cleanDestination},travel,landmark`;
    
  } catch (error) {
    console.error("Error fetching destination image:", error);
    
    // Map of popular destinations as a fallback
    const destinationImages: Record<string, string> = {
      'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
      'barcelona': 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?auto=format&fit=crop&w=1200&q=80',
      'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
      'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
      'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
      'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
      'tokyo': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1200&q=80',
      'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
      'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80',
      'amsterdam': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80'
    };
    
    // Normalize the destination to lowercase for case-insensitive matching
    const normalizedDestination = destination.toLowerCase();
    
    // Check if we have a specific image for this destination
    for (const [key, image] of Object.entries(destinationImages)) {
      if (normalizedDestination.includes(key)) {
        return image;
      }
    }
    
    // Default image for destinations we don't have specific images for
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';
  }
}

/**
 * Get a destination image synchronously (for immediate use)
 * This will return a fallback image while the real image loads asynchronously
 */
export function getDestinationImageSync(destination: string): string {
  // Map of popular destinations
  const destinationImages: Record<string, string> = {
    'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?auto=format&fit=crop&w=1200&q=80',
    'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1200&q=80'
  };
  
  // Normalize the destination to lowercase for case-insensitive matching
  const normalizedDestination = destination.toLowerCase();
  
  // Check if we have a specific image for this destination
  for (const [key, image] of Object.entries(destinationImages)) {
    if (normalizedDestination.includes(key)) {
      return image;
    }
  }
  
  // If no match, use a dynamic Unsplash URL
  const cleanDestination = encodeURIComponent(destination.replace(/[^\w\s]/gi, ''));
  return `https://source.unsplash.com/1200x800/?${cleanDestination},travel,landmark`;
}