import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface HotelImage {
  url: string;
}

interface HotelImagesProps {
  hotelId: string;
  limit?: number;
}

export function HotelImages({ hotelId, limit = 6 }: HotelImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tripadvisor/hotels/images', hotelId],
    queryFn: async () => {
      if (!hotelId) return { images: [] };
      
      const response = await fetch(`/api/tripadvisor/hotels/${hotelId}/images`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel images');
      }
      return response.json();
    },
    enabled: !!hotelId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <AspectRatio ratio={1}>
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
        <p>Unable to load hotel images at this time</p>
      </div>
    );
  }

  if (!data || !data.images || data.images.length === 0) {
    return (
      <div className="text-center text-gray-500 my-4">
        <p>No images available for this hotel</p>
      </div>
    );
  }

  const imagesToShow = data.images.slice(0, limit);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {imagesToShow.map((image: HotelImage, index: number) => (
          <Dialog key={index}>
            <DialogTrigger asChild>
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedImage(image.url)}
              >
                <CardContent className="p-0">
                  <AspectRatio ratio={1}>
                    <img 
                      src={image.url} 
                      alt={`Hotel image ${index + 1}`}
                      className="object-cover h-full w-full"
                      loading="lazy"
                    />
                  </AspectRatio>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <div className="p-2">
                <img 
                  src={image.url} 
                  alt={`Hotel image ${index + 1}`}
                  className="max-h-[80vh] w-auto mx-auto object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      
      {data.images.length > limit && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            {data.images.length - limit} more photos available
          </p>
        </div>
      )}
    </>
  );
}