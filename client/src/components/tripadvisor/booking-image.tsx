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
  placeId?: string; // For storing Google Maps place ID
}

interface BookingImageProps {
  booking: Booking;
  destination: string;
}

export function BookingImage({ booking, destination }: BookingImageProps) {
  // Store the loaded image URL to prevent flickering
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(booking.image || null);
  const [placeId, setPlaceId] = useState<string | null>(booking.placeId || null);
  
  // Step 1: Find the place to get place_id using findplacefromtext
  const { data: placeSearchData, isLoading: placeSearchLoading } = useQuery({
    queryKey: ['/api/maps/places/search', booking.title, destination],
    queryFn: async () => {
      console.log(`Searching for place: ${booking.title} in ${destination}`);
      const query = booking.title + ' in ' + destination;
      const response = await fetch(`/api/maps/places/search?query=${encodeURIComponent(query)}&type=${encodeURIComponent(booking.type)}`);
      if (!response.ok) {
        throw new Error('Failed to search for place');
      }
      return response.json();
    },
    // Don't refetch unnecessarily
    staleTime: 60 * 60 * 1000, // 1 hour
    // Only enable if we don't already have a place ID or image
    enabled: !booking.placeId && !booking.image
  });
  
  // Extract and store place ID when search completes
  useEffect(() => {
    if (placeSearchData && placeSearchData.length > 0 && placeSearchData[0].id) {
      setPlaceId(placeSearchData[0].id);
      
      // If the search result already has an image, use it immediately
      if (placeSearchData[0].image) {
        setCachedImageUrl(placeSearchData[0].image);
      }
    }
  }, [placeSearchData]);
  
  // Step 2: Use the place_id to get detailed place information including photos
  const { data: placeDetailsData, isLoading: placeDetailsLoading } = useQuery({
    queryKey: ['/api/maps/places/details', placeId],
    queryFn: async () => {
      console.log(`Getting place details for ID: ${placeId}`);
      const response = await fetch(`/api/maps/places/${placeId}`);
      if (!response.ok) {
        throw new Error('Failed to get place details');
      }
      return response.json();
    },
    // Don't refetch unnecessarily
    staleTime: 60 * 60 * 1000, // 1 hour
    // Only enable if we have a place ID and don't have an image yet
    enabled: !!placeId && !cachedImageUrl
  });
  
  // Update cached image when place details data is available
  useEffect(() => {
    if (placeDetailsData && placeDetailsData.image) {
      setCachedImageUrl(placeDetailsData.image);
    } else if (placeDetailsData && placeDetailsData.photos && placeDetailsData.photos.length > 0) {
      setCachedImageUrl(placeDetailsData.photos[0].url);
    }
  }, [placeDetailsData]);
  
  // Fallback to traditional API if two-step approach fails
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
    // Only enable if the two-step approach is not working
    enabled: !cachedImageUrl && (!placeId || placeDetailsLoading === false)
  });
  
  // Update cached image from hotel data as last resort
  useEffect(() => {
    if (!cachedImageUrl && googleMapsHotelData && googleMapsHotelData.length > 0 && googleMapsHotelData[0].image) {
      setCachedImageUrl(googleMapsHotelData[0].image);
    } else if (!cachedImageUrl && !placeSearchLoading && !placeDetailsLoading && !googleMapsLoading) {
      // Fallback to Unsplash image if all approaches fail
      const unsplashFallbackUrl = `https://source.unsplash.com/640x480/?${booking.type === 'hotel' ? 'hotel' : 'flight,airport'},${encodeURIComponent(destination)}`;
      setCachedImageUrl(unsplashFallbackUrl);
    }
  }, [booking.image, booking.title, booking.type, googleMapsHotelData, cachedImageUrl, placeSearchLoading, placeDetailsLoading, googleMapsLoading, destination]);
  
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
  if (placeSearchLoading || placeDetailsLoading || googleMapsLoading) {
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