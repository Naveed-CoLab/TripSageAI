import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define destination data type
type Destination = {
  name: string;
  code: string;
  image: string;
  price: number;
  continent?: string;
  country?: string;
};

// Popular flight destinations data
const popularDestinations: Destination[] = [
  { name: "New York", code: "JFK", image: "https://images.unsplash.com/photo-1534430480872-3b397132e8ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 299, continent: "North America", country: "USA" },
  { name: "London", code: "LHR", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 499, continent: "Europe", country: "UK" },
  { name: "Tokyo", code: "HND", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 899, continent: "Asia", country: "Japan" },
  { name: "Paris", code: "CDG", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 449, continent: "Europe", country: "France" },
  { name: "Dubai", code: "DXB", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 649, continent: "Asia", country: "UAE" },
  { name: "Sydney", code: "SYD", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 999, continent: "Oceania", country: "Australia" },
  { name: "Singapore", code: "SIN", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 749, continent: "Asia", country: "Singapore" },
  { name: "Rome", code: "FCO", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", price: 399, continent: "Europe", country: "Italy" },
];

interface PopularFlightDestinationsProps {
  onDestinationSelect?: (destination: string) => void;
}

export default function PopularFlightDestinations({ onDestinationSelect }: PopularFlightDestinationsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position for scroll buttons visibility
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    setTimeout(checkScrollPosition, 300);
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    setTimeout(checkScrollPosition, 300);
  };

  // Handle destination selection
  const handleDestinationClick = (destinationName: string) => {
    if (onDestinationSelect) {
      onDestinationSelect(destinationName);
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Popular Flight Destinations</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`rounded-full ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`rounded-full ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable destinations grid */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto pb-6 -mx-2 px-2 gap-6 hide-scrollbar snap-x snap-mandatory"
          onScroll={checkScrollPosition}
        >
          {popularDestinations.map((destination) => (
            <div
              key={destination.code}
              className="min-w-[280px] flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 snap-start"
              onClick={() => handleDestinationClick(destination.name)}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={destination.image}
                  alt={`${destination.name} cityscape`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(destination.name + ' city')}`;
                  }}
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{destination.name}</h3>
                    <p className="text-gray-500 text-sm">{destination.code}</p>
                  </div>
                  <div className="text-blue-600 font-bold">
                    from ${destination.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Add some global styles to index.css for hiding the scrollbar but allowing scrolling
const hideScrollbarStyles = `
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
`;