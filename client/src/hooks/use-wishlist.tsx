import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

export type WishlistItem = {
  id: number;
  userId: number;
  itemType: string;
  itemId: string;
  itemName: string;
  itemImage?: string;
  additionalData?: any;
  createdAt: string;
};

export function useWishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all wishlist items for the user
  const { data: wishlistItems, isLoading, refetch } = useQuery<WishlistItem[]>({
    queryKey: ['/api/wishlist'],
    enabled: !!user,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 15 * 1000, // Poll every 15 seconds for updates
  });

  // Add item to wishlist
  const addToWishlist = useMutation({
    mutationFn: async (item: {
      itemType: string;
      itemId: string;
      itemName: string;
      itemImage?: string;
      additionalData?: any;
    }) => {
      return apiRequest('POST', '/api/wishlist', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Added to wishlist',
        description: 'Item has been added to your wishlist',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add to wishlist. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Remove item from wishlist
  const removeFromWishlist = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Check if an item is in the wishlist
  const isInWishlist = (itemType: string, itemId: string): boolean => {
    if (!wishlistItems) return false;
    return wishlistItems.some(
      (item) => item.itemType === itemType && item.itemId === itemId
    );
  };

  // Get wishlist item ID if it exists
  const getWishlistItemId = (itemType: string, itemId: string): number | null => {
    if (!wishlistItems) return null;
    const item = wishlistItems.find(
      (item) => item.itemType === itemType && item.itemId === itemId
    );
    return item ? item.id : null;
  };

  return {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistItemId,
    refetchWishlist: refetch,
  };
}