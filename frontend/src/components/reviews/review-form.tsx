import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BubbleRating } from '@/components/ui/bubble-rating';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  targetType: string;
  targetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ targetType, targetId, onSuccess, onCancel }: ReviewFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  
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
      setTitle('');
      setContent('');
      setRating(5);
      toast({
        title: 'Success',
        description: 'Your review has been submitted',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
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
      title,
      content,
      rating,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="rating">Rating</Label>
        <div className="flex items-center gap-4 py-2">
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            className="w-full"
          />
          <BubbleRating rating={rating} size="md" />
        </div>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="review-title">Title</Label>
        <Input
          id="review-title"
          placeholder="Give your review a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="review-content">Review</Label>
        <Textarea
          id="review-content"
          placeholder="Share your experience"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createReviewMutation.isPending}>
          {createReviewMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </form>
  );
}