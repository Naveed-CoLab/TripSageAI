import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  type = 'hotels', 
  limit = 6 
}: TripAdvisorImageGalleryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tripadvisor/search', searchQuery, type],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const response = await fetch(`/api/tripadvisor/search?query=${encodeURIComponent(searchQuery)}&type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      return response.json();
    },
    enabled: !!searchQuery,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <AspectRatio ratio={16/9}>
                <Skeleton className="h-full w-full" />
              </AspectRatio>
              <div className="p-4">
                <Skeleton className="h-5 w-4/5 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
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

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 my-4">
        <p>No images found for this location</p>
      </div>
    );
  }

  const imagesToShow = data.slice(0, limit);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {imagesToShow.map((item: TripAdvisorImage) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-0">
            <AspectRatio ratio={16/9}>
              <img 
                src={item.image} 
                alt={item.name}
                className="object-cover h-full w-full"
                loading="lazy"
              />
            </AspectRatio>
            <div className="p-4">
              <h3 className="font-medium text-sm truncate">{item.name}</h3>
              {item.rating && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <span>★ {item.rating}</span>
                  {item.reviewCount && (
                    <span>({item.reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}