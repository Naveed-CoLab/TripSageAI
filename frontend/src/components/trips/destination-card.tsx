
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BubbleRating } from "@/components/ui/bubble-rating";

type DestinationCardProps = {
  destination: {
    id: number;
    name: string;
    country: string;
    description: string;
    imageUrl: string;
    rating: string;
    reviewCount?: number;
    priceEstimate?: string;
  };
};

export default function DestinationCard({ destination }: DestinationCardProps) {
  const [, navigate] = useLocation();

  // Convert rating string to number for BubbleRating component
  const getRatingNumber = (rating: string): number => {
    return parseFloat(rating);
  };

  const handleExplore = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/trips/create?destination=${encodeURIComponent(destination.name)}`);
  };
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/destinations/${destination.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-60">
        <img
          src={destination.imageUrl}
          alt={`${destination.name}, ${destination.country}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {destination.name}, {destination.country}
        </h3>
        <div className="flex items-center mt-1">
          <BubbleRating 
            rating={getRatingNumber(destination.rating)} 
            reviewCount={destination.reviewCount}
            size="sm"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {destination.description}
        </p>
        {destination.priceEstimate && (
          <p className="mt-2 text-sm font-medium text-gray-900">
            {destination.priceEstimate}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            onClick={handleViewDetails}
            variant="outline"
          >
            View Details
          </Button>
          <Button
            onClick={handleExplore}
            variant="default"
          >
            Plan Trip
          </Button>
        </div>
      </div>
    </div>
  );
}
