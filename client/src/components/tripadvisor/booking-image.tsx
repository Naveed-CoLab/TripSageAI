import { useState } from 'react';
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
  const { data, isLoading } = useQuery({
    queryKey: ['/api/tripadvisor/search', `${booking.title} in ${destination}`, 'hotels'],
    queryFn: async () => {
      const response = await fetch(`/api/tripadvisor/search?query=${encodeURIComponent(`${booking.title} in ${destination}`)}&type=hotels`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel images');
      }
      return response.json();
    },
    // Don't refetch unnecessarily
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // First try to use the booking's own image if it exists
  if (booking.image) {
    return (
      <img 
        src={booking.image}
        alt={booking.title}
        className="w-full h-full object-cover"
      />
    );
  }
  
  // If loading, show a skeleton
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <Hotel className="h-12 w-12 text-primary-200" />
      </div>
    );
  }
  
  // If we have results from TripAdvisor, show the first image
  if (data && data.length > 0 && data[0].image) {
    return (
      <img 
        src={data[0].image}
        alt={booking.title}
        className="w-full h-full object-cover"
      />
    );
  }
  
  // Fallback to the hotel icon
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-50 to-primary-100">
      <Hotel className="h-12 w-12 text-primary-300" />
    </div>
  );
}