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
  
  // Use Google Maps API to get hotel images
  const { data: googleMapsHotelData, isLoading: googleMapsLoading } = useQuery({
    queryKey: ['/api/maps/hotels', booking.title, destination],
    queryFn: async () => {
      console.log(`Searching for hotel via Google Maps: ${booking.title} in ${destination}`);
      const response = await fetch(`/api/maps/hotels?name=${encodeURIComponent(booking.title)}&destination=${encodeURIComponent(destination)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel details from Google Maps');
      }
      return response.json();
    },
    // Don't refetch unnecessarily
    staleTime: 60 * 60 * 1000, // 1 hour
    // Always run the query regardless of whether booking.image exists
    enabled: true
  });
  
  // Update cached image when data changes
  useEffect(() => {
    if (booking.image) {
      setCachedImageUrl(booking.image);
    } else if (googleMapsHotelData && googleMapsHotelData.length > 0 && googleMapsHotelData[0].image) {
      setCachedImageUrl(googleMapsHotelData[0].image);
    } else {
      // Fallback to Unsplash image if neither booking image nor Google Maps data is available
      const unsplashFallbackUrl = `https://source.unsplash.com/640x480/?${booking.type === 'hotel' ? 'hotel' : 'flight,airport'},${encodeURIComponent(booking.title)}`;
      setCachedImageUrl(unsplashFallbackUrl);
    }
  }, [booking.image, booking.title, booking.type, googleMapsHotelData]);
  
  // If we have a cached image, use it
  if (cachedImageUrl) {
    return (
      <img 
        src={cachedImageUrl}
        alt={booking.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          // If the image fails to load, try an Unsplash fallback
          const target = e.target as HTMLImageElement;
          target.src = `https://source.unsplash.com/640x480/?${booking.type === 'hotel' ? 'hotel' : 'flight,airport'},${encodeURIComponent(destination)}`;
        }}
      />
    );
  }
  
  // If loading, show a skeleton
  if (googleMapsLoading) {
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