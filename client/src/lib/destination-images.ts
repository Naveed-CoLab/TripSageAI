import { useState, useEffect } from 'react';
import { fetchDestinationImage, getDestinationImageSync } from './image-service';

// Function to get static destination images, always returns immediately
export const getDestinationImage = (destination: string): string => {
  // Map of destinations to specific Unsplash image URLs
  const destinationImages: Record<string, string> = {
    'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?auto=format&fit=crop&w=1200&q=80',
    'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    'seville': 'https://images.unsplash.com/photo-1559636425-638f8bf8ef2c?auto=format&fit=crop&w=1200&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1200&q=80',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    'quebec': 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?auto=format&fit=crop&w=1200&q=80',
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80'
  };
  
  // Normalize the destination to lowercase for case-insensitive matching
  const normalizedDestination = destination.toLowerCase();
  
  // Check if we have a specific image for this destination
  for (const [key, image] of Object.entries(destinationImages)) {
    if (normalizedDestination.includes(key)) {
      return image;
    }
  }
  
  // Dynamic Unsplash URL as fallback
  return getDestinationImageSync(destination);
};

// React hook to use dynamic image loading with fallback
export const useDestinationImage = (destination: string): string => {
  const [image, setImage] = useState<string>(getDestinationImage(destination));
  
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        // Start with static image
        setImage(getDestinationImage(destination));
        
        // Try to get a real-time image
        const realTimeImage = await fetchDestinationImage(destination);
        if (isMounted) {
          setImage(realTimeImage);
        }
      } catch (error) {
        console.error("Error loading destination image:", error);
        // Keep the fallback image that was already set
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [destination]);
  
  return image;
};