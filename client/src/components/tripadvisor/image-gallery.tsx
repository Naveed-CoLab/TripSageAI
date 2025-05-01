import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { HotelImages } from './hotel-images';

interface TripAdvisorImage {
  id: string;
  name: string;
  image: string;
  type: string;
  rating?: string;
  reviewCount?: string;
}

interface TripAdvisorImageGalleryProps {
  searchQuery: string;
  type?: string;
  limit?: number;
}

export function TripAdvisorImageGallery({ 
  searchQuery, 
  type = 'location', 
  limit = 6 
}: TripAdvisorImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<TripAdvisorImage | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tripadvisor/search', searchQuery, type],
    queryFn: async () => {
      if (!searchQuery) return { data: [] };
      
      const response = await fetch(`/api/tripadvisor/search?query=${encodeURIComponent(searchQuery)}&type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TripAdvisor data');
      }
      return response.json();
    },
    enabled: !!searchQuery,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <AspectRatio ratio={4/3}>
                <Skeleton className="h-full w-full" />
              </AspectRatio>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-500 my-4">
        <p>Unable to load images at this time</p>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="text-center text-gray-500 my-4">
        <p>No {type} found for this location</p>
      </div>
    );
  }

  const imagesToShow = data.data.slice(0, limit);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {imagesToShow.map((item: TripAdvisorImage) => (
          <Dialog key={item.id}>
            <DialogTrigger asChild>
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedImage(item)}
              >
                <CardContent className="p-0">
                  <AspectRatio ratio={4/3}>
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="object-cover h-full w-full"
                      loading="lazy"
                    />
                  </AspectRatio>
                  <div className="p-2 bg-white">
                    <h3 className="text-sm font-medium line-clamp-1">{item.name}</h3>
                    {item.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-gray-600 ml-1">{item.rating}</span>
                        </div>
                        {item.reviewCount && (
                          <span className="text-xs text-gray-500">
                            ({item.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0">
              <div className="bg-white p-4">
                <h2 className="text-xl font-bold mb-2">{item.name}</h2>
                {type === 'hotels' && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-4">Hotel Photos</h3>
                    <HotelImages hotelId={item.id} limit={9} />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      
      {data.data.length > limit && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            {data.data.length - limit} more locations available
          </p>
        </div>
      )}
    </>
  );
}