import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Hotel } from 'lucide-react';

// Type definition for Booking
interface Booking {
  type: string;
  title: string;
  provider?: string;
  price?: string;
  details?: any;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

interface BookingImageProps {
  booking: Booking;
  destination: string;
}

export function BookingImage({ booking, destination }: BookingImageProps) {
  // Store the loaded image URL to prevent flickering
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(booking.image || null);
  
  // First, check if we have a direct search result
  const { data: hotelSearchData, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/tripadvisor/search', `${booking.title} in ${destination}`, 'hotels'],
    queryFn: async () => {
      console.log(`Searching for hotel: ${booking.title} in ${destination}`);
      const response = await fetch(`/api/tripadvisor/search?query=${encodeURIComponent(`${booking.title} in ${destination}`)}&type=hotels`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel search results');
      }
      return response.json();
    },
    // Don't refetch unnecessarily
    staleTime: 60 * 60 * 1000, // 1 hour
    // Don't run if we already have an image from the booking itself
    enabled: !booking.image
  });
  
  // Second, try to get specific hotel images if we found a hotel ID
  const hotelId = hotelSearchData && hotelSearchData.length > 0 ? hotelSearchData[0].id : null;
  
  const { data: hotelImagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/tripadvisor/hotels/images', hotelId, booking.title, destination],
    queryFn: async () => {
      if (!hotelId) return null;
      
      console.log(`Fetching images for hotel ID: ${hotelId}`);
      const response = await fetch(
        `/api/tripadvisor/hotels/${hotelId}/images?hotelName=${encodeURIComponent(booking.title)}&destination=${encodeURIComponent(destination)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch hotel images');
      }
      return response.json();
    },
    // Only run this query if we have a hotel ID
    enabled: !!hotelId && !booking.image,
  });
  
  // Update cached image when data changes
  useEffect(() => {
    if (booking.image) {
      setCachedImageUrl(booking.image);
    } else if (hotelSearchData && hotelSearchData.length > 0 && hotelSearchData[0].image) {
      setCachedImageUrl(hotelSearchData[0].image);
    } else if (hotelImagesData && hotelImagesData.images && hotelImagesData.images.length > 0) {
      setCachedImageUrl(hotelImagesData.images[0].url);
    }
  }, [booking.image, hotelSearchData, hotelImagesData]);
  
  // If we have a cached image, use it
  if (cachedImageUrl) {
    return (
      <img 
        src={cachedImageUrl}
        alt={booking.title}
        className="w-full h-full object-cover"
        onError={() => setCachedImageUrl(null)} // Clear the cached image if it fails to load
      />
    );
  }
  
  // If loading, show a skeleton
  if (searchLoading || imagesLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <Hotel className="h-12 w-12 text-primary-200" />
      </div>
    );
  }
  
  // Fallback to the hotel icon
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-50 to-primary-100">
      <Hotel className="h-12 w-12 text-primary-300" />
    </div>
  );
}