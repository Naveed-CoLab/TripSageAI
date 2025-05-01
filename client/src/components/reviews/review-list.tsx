
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { ReviewCard, type ReviewData } from '@/components/ui/review-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BubbleRating } from '@/components/ui/bubble-rating';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  targetType: string;
  targetId: string;
  title?: string;
}

export function ReviewList({ targetType, targetId, title = 'Reviews' }: ReviewListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  
  const { data: reviews, isLoading, error } = useQuery<ReviewData[]>({
    queryKey: ['/api/reviews', targetType, targetId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${targetType}/${targetId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return res.json();
    },
  });
  
  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest(`/api/reviews/${reviewId}/helpful`, 'POST');
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to mark review as helpful',
        variant: 'destructive',
      });
    },
  });
  
  const reportMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest(`/api/reviews/${reviewId}/report`, 'POST');
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to report review',
        variant: 'destructive',
      });
    },
  });
  
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      targetType: string;
      targetId: string;
      title: string;
      content: string;
      rating: number;
    }) => {
      const res = await apiRequest('/api/reviews', 'POST', reviewData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews', targetType, targetId] });
      setIsDialogOpen(false);
      setNewReviewTitle('');
      setNewReviewContent('');
      setNewReviewRating(5);
      toast({
        title: 'Success',
        description: 'Your review has been submitted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmitReview = () => {
    if (!newReviewTitle.trim() || !newReviewContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    
    createReviewMutation.mutate({
      targetType,
      targetId,
      title: newReviewTitle,
      content: newReviewContent,
      rating: newReviewRating,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/4 mb-4" />
            <Skeleton className="h-16 w-full mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/6" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="py-4">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-red-500">Failed to load reviews. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {user && (
          <Button onClick={() => setIsDialogOpen(true)}>Write a Review</Button>
        )}
      </div>
      
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={(id) => helpfulMutation.mutate(id)}
              onReport={(id) => reportMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
          {user && (
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4">
              Write a Review
            </Button>
          )}
          {!user && (
            <p className="text-sm text-gray-400 mt-2">Sign in to write a review</p>
          )}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center gap-4 py-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(parseFloat(e.target.value))}
                  className="w-full"
                />
                <BubbleRating rating={newReviewRating} size="md" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                placeholder="Give your review a title"
                value={newReviewTitle}
                onChange={(e) => setNewReviewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="review-content">Review</Label>
              <Textarea
                id="review-content"
                placeholder="Share your experience"
                rows={4}
                value={newReviewContent}
                onChange={(e) => setNewReviewContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
