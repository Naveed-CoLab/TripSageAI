import React from 'react';
import { cn } from '@/lib/utils';

type BubbleRatingProps = {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showScore?: boolean;
};

/**
 * BubbleRating component displays a rating as circular bubbles (similar to TripAdvisor)
 */
export function BubbleRating({ 
  rating, 
  reviewCount, 
  size = 'md', 
  className,
  showScore = true
}: BubbleRatingProps) {
  // Round to the nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2;
  
  // Generate 5 bubbles
  const bubbles = Array(5).fill(0).map((_, index) => {
    const bubbleValue = index + 1;
    let fillClass = '';
    
    if (bubbleValue <= roundedRating) {
      // Full bubble
      fillClass = 'bg-[#3264ff]';
    } else if (bubbleValue - 0.5 === roundedRating) {
      // Half bubble
      fillClass = 'bg-gradient-to-r from-[#3264ff] to-[#3264ff] bg-[length:50%_100%] bg-no-repeat';
    } else {
      // Empty bubble
      fillClass = 'bg-gray-200';
    }
    
    return (
      <div
        key={`bubble-${index}`}
        className={cn(
          'rounded-full',
          fillClass,
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4',
          'mx-0.5'
        )}
      />
    );
  });

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex mr-1.5">
        {bubbles}
      </div>
      {(showScore || reviewCount) && (
        <div className="text-gray-700 flex items-center space-x-1">
          {showScore && (
            <span className={cn(
              'font-medium',
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            )}>
              {rating.toFixed(1)}
            </span>
          )}
          {reviewCount !== undefined && (
            <>
              <span className={cn(
                'text-gray-500',
                size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
              )}>
                ({reviewCount.toLocaleString()})
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}