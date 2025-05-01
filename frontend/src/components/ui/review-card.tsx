import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, Flag } from 'lucide-react';
import { useState } from 'react';
import { BubbleRating } from './bubble-rating';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type ReviewData = {
  id: number;
  userId: number;
  authorName: string;
  targetType: string;
  targetId: string;
  title: string;
  content: string;
  rating: number;
  images?: string[];
  createdAt: string;
  helpfulCount: number;
  reportCount: number;
};

interface ReviewCardProps {
  review: ReviewData;
  onHelpful?: (id: number) => void;
  onReport?: (id: number) => void;
  className?: string;
}

export function ReviewCard({ 
  review, 
  onHelpful, 
  onReport,
  className
}: ReviewCardProps) {
  const [isHelpfulClicked, setIsHelpfulClicked] = useState(false);
  const [isReportClicked, setIsReportClicked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  
  const handleHelpfulClick = () => {
    if (!isHelpfulClicked && onHelpful) {
      setIsHelpfulClicked(true);
      setHelpfulCount(prev => prev + 1);
      onHelpful(review.id);
    }
  };
  
  const handleReportClick = () => {
    if (!isReportClicked && onReport) {
      setIsReportClicked(true);
      onReport(review.id);
    }
  };
  
  // Format the date to "X time ago" (e.g., "2 days ago")
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
  
  return (
    <div className={cn("border border-gray-200 rounded-lg p-4", className)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-900">{review.title}</h3>
          <div className="mt-1 flex items-center">
            <BubbleRating rating={review.rating} size="sm" showScore={false} />
            <span className="text-sm text-gray-500 ml-2">{formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-gray-700">
        <p className="text-sm">{review.content}</p>
      </div>
      
      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review image ${index + 1}`}
              className="h-20 w-20 object-cover rounded-md flex-shrink-0"
            />
          ))}
        </div>
      )}
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600">
          <span className="font-medium">By {review.authorName}</span>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-1 text-xs py-1",
              isHelpfulClicked ? "text-green-600" : "text-gray-600"
            )}
            onClick={handleHelpfulClick}
            disabled={isHelpfulClicked}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Helpful {helpfulCount > 0 ? `(${helpfulCount})` : ''}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-1 text-xs py-1",
              isReportClicked ? "text-red-600" : "text-gray-600"
            )}
            onClick={handleReportClick}
            disabled={isReportClicked}
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Report</span>
          </Button>
        </div>
      </div>
    </div>
  );
}