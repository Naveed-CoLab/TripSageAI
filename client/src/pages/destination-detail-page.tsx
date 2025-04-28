import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BubbleRating } from '@/components/ui/bubble-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewList } from '@/components/reviews/review-list';
import { Heart, MapPin, CalendarDays, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

export default function DestinationDetailPage() {
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: destination, isLoading, error } = useQuery({
    queryKey: [`/api/destinations/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/destinations/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch destination details');
      }
      return res.json();
    },
  });

  // Check if destination is in wishlist
  const { data: wishlistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  // Add to wishlist mutation
  const addToWishlist = useMutation({
    mutationFn: async () => {
      const wishlistItem = {
        itemType: "destination",
        itemId: id,
        itemName: destination.name,
        itemImage: destination.imageUrl,
        additionalData: {
          description: destination.description,
          country: destination.country
        }
      };
      
      return apiRequest("/api/wishlist", "POST", wishlistItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "This destination has been added to your wishlist",
      });
      setIsSaved(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to wishlist. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Remove from wishlist mutation
  const removeFromWishlist = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/wishlist/${itemId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from wishlist",
        description: "This destination has been removed from your wishlist",
      });
      setIsSaved(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if destination is in wishlist
  useEffect(() => {
    if (wishlistItems && id) {
      const isInWishlist = wishlistItems.some(
        (item: any) => item.itemType === "destination" && item.itemId === id
      );
      setIsSaved(isInWishlist);
    }
  }, [wishlistItems, id]);
  
  const toggleSave = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save this destination to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (isSaved) {
      // Find the wishlist item ID to remove
      const wishlistItem = wishlistItems?.find(
        (item: any) => item.itemType === "destination" && item.itemId === id
      );
      if (wishlistItem) {
        removeFromWishlist.mutate(wishlistItem.id);
      }
    } else {
      addToWishlist.mutate();
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-[400px] w-full mb-8 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-8" />
        </div>
      </div>
    );
  }
  
  if (error || !destination) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Destination Not Found</h1>
        <p className="text-gray-600 mb-8">We couldn't find the destination you're looking for.</p>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{destination.name}</h1>
            <div className="flex items-center mt-2">
              <MapPin className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-600">{destination.country}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <BubbleRating 
              rating={parseFloat(destination.rating)} 
              reviewCount={destination.reviewCount}
              size="md"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleSave}
              className="h-10 w-10"
            >
              <Heart className={isSaved ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
            </Button>
          </div>
        </div>
        
        <div className="rounded-xl overflow-hidden mb-8">
          <img 
            src={destination.imageUrl} 
            alt={`${destination.name}, ${destination.country}`}
            className="w-full h-[400px] object-cover"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {destination.bestTimeToVisit && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CalendarDays className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Best Time to Visit</h3>
              </div>
              <p className="text-gray-700">{destination.bestTimeToVisit}</p>
            </div>
          )}
          
          {destination.priceEstimate && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Price Range</h3>
              </div>
              <p className="text-gray-700">{destination.priceEstimate}</p>
            </div>
          )}
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Traveler Rating</h3>
            </div>
            <div className="flex items-center">
              <BubbleRating 
                rating={parseFloat(destination.rating)} 
                reviewCount={destination.reviewCount}
                size="sm"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About {destination.name}</h2>
          <div className="prose max-w-none text-gray-700">
            <p>{destination.description}</p>
          </div>
        </div>
        
        <div className="mb-10">
          <Button 
            size="lg" 
            className="mr-4"
            onClick={() => window.location.href = `/trips/create?destination=${encodeURIComponent(destination.name)}`}
          >
            Plan a Trip
          </Button>
          <Button variant="outline" size="lg">
            Find Hotels
          </Button>
        </div>
        
        {/* Reviews section */}
        <ReviewList 
          targetType="destination" 
          targetId={id || ''} 
          title={`Reviews of ${destination.name}`}
        />
      </div>
    </div>
  );
}