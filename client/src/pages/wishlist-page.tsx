import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { EmptyState } from "../components/empty-state";
import MainLayout from "@/components/layout/main-layout";
import { BubbleRating } from "@/components/ui/bubble-rating";
type WishlistItem = {
  id: number;
  userId: number;
  itemType: string;
  itemId: string;
  itemName: string;
  itemImage?: string;
  additionalData?: any;
  createdAt: string;
};

export default function WishlistPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [, navigate] = useLocation();

  // Fetch wishlist items
  const { data: wishlistItems, isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  // Delete wishlist item mutation
  const deleteWishlistItem = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/wishlist/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your wishlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter wishlist items based on search query and active tab
  const filteredItems = wishlistItems ? wishlistItems.filter((item: WishlistItem) => {
    const matchesSearch = !searchQuery || 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "destinations" && item.itemType === "destination") ||
      (activeTab === "hotels" && item.itemType === "hotel") ||
      (activeTab === "experiences" && item.itemType === "experience") ||
      (activeTab === "trips" && item.itemType === "trip");
    
    return matchesSearch && matchesTab;
  }) : [];

  // If user is not authenticated, redirect to auth page
  if (!isAuthLoading && !user) {
    return <Redirect to="/auth" />;
  }

  // Handle removing an item from wishlist
  const handleRemoveItem = (id: number) => {
    deleteWishlistItem.mutate(id);
  };

  return (
    <MainLayout>
      <div className="flex justify-center w-full py-10 px-4 sm:px-6">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Saved Items</h1>
            
            <div className="relative w-full md:w-1/3 mt-4 md:mt-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved items..."
                className="pl-9 bg-white rounded-full border-gray-200 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 w-full">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full md:w-auto mb-6 bg-gray-100 p-1 rounded-full">
                <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  All Items
                </TabsTrigger>
                <TabsTrigger value="destinations" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  Destinations
                </TabsTrigger>
                <TabsTrigger value="hotels" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  Restaurants
                </TabsTrigger>
                <TabsTrigger value="experiences" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  Experiences
                </TabsTrigger>
                <TabsTrigger value="trips" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">
                  Trips
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                {renderWishlistItems(filteredItems, isLoading, handleRemoveItem, () => navigate('/'))}
              </TabsContent>
              
              <TabsContent value="destinations" className="mt-0">
                {renderWishlistItems(filteredItems, isLoading, handleRemoveItem, () => navigate('/'))}
              </TabsContent>
              
              <TabsContent value="hotels" className="mt-0">
                {renderWishlistItems(filteredItems, isLoading, handleRemoveItem, () => navigate('/'))}
              </TabsContent>
              
              <TabsContent value="experiences" className="mt-0">
                {renderWishlistItems(filteredItems, isLoading, handleRemoveItem, () => navigate('/'))}
              </TabsContent>
              
              <TabsContent value="trips" className="mt-0">
                {renderWishlistItems(filteredItems, isLoading, handleRemoveItem, () => navigate('/'))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function renderWishlistItems(
  items: WishlistItem[] | undefined, 
  isLoading: boolean, 
  onRemove: (id: number) => void,
  navigateToHome: () => void
) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Your saved items list is empty</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Explore destinations, restaurants, and experiences and save them for your next adventure.
        </p>
        <Button 
          className="rounded-full"
          onClick={navigateToHome}
        >
          Start exploring
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="relative w-full rounded-xl overflow-hidden bg-white shadow-sm transition-transform duration-300 hover:translate-y-[-4px] hover:shadow-md">
          <div className="relative h-44">
            {item.itemImage ? (
              <img
                src={item.itemImage}
                alt={item.itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(item.itemName)}`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
            <button 
              className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-sm transition-colors duration-200 hover:bg-gray-100"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
            {item.itemType && (
              <div className="absolute bottom-2 left-2 bg-[#3264ff] text-white text-xs font-bold rounded px-1.5 py-1">
                TripSage
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center">
              {item.additionalData?.rating && (
                <div className="flex items-center">
                  {/* Custom amber-colored bubble rating */}
                  <div className="flex mr-1.5">
                    {Array(5).fill(0).map((_, index) => {
                      const bubbleValue = index + 1;
                      const roundedRating = Math.round(parseFloat(item.additionalData.rating) * 2) / 2;
                      let fillClass = '';
                      
                      if (bubbleValue <= roundedRating) {
                        // Full bubble
                        fillClass = 'bg-amber-500';
                      } else if (bubbleValue - 0.5 === roundedRating) {
                        // Half bubble
                        fillClass = 'bg-gradient-to-r from-amber-500 to-amber-500 bg-[length:50%_100%] bg-no-repeat';
                      } else {
                        // Empty bubble
                        fillClass = 'bg-gray-200';
                      }
                      
                      return (
                        <div
                          key={`bubble-${index}`}
                          className={`rounded-full ${fillClass} w-3 h-3 mx-0.5`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-medium text-amber-500">
                    {parseFloat(item.additionalData.rating).toFixed(1)}
                  </span>
                  {item.additionalData?.reviewCount && (
                    <span className="ml-1 text-sm text-gray-600">
                      ({item.additionalData.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 mt-1">{item.itemName}</h3>
            {item.additionalData?.priceLevel && (
              <div className="text-gray-500 text-sm">
                {item.additionalData.priceLevel}
                {item.additionalData?.categories && (
                  <> • {item.additionalData.categories}</>
                )}
              </div>
            )}
            {item.additionalData?.location && !item.additionalData?.priceLevel && (
              <div className="text-gray-500 text-sm">
                {item.additionalData.location}
              </div>
            )}
            {item.additionalData?.description && !item.additionalData?.categories && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.additionalData.description}
              </p>
            )}
            {item.additionalData?.price && (
              <div className="text-gray-700 text-sm mt-1">{item.additionalData.price}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}