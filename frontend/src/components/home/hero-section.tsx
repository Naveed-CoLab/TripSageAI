import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Hotel, Utensils, Plane, Car, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Types for search results
type SearchResult = {
  name: string;
  description?: string;
  location?: string;
  rating?: number;
  price?: string;
  image?: string;
  type: string;
};

export default function HeroSection() {
  const [destination, setDestination] = useState("");
  const [, navigate] = useLocation();
  const [searchCategory, setSearchCategory] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Reset search results when changing category
  useEffect(() => {
    setSearchResults([]);
    setShowResults(false);
  }, [searchCategory]);

  // Search function that mimics API call - now focusing only on hotels, things to do, and restaurants
  const performSearch = async (query: string, category: string) => {
    setIsSearching(true);
    
    try {
      // In a real app, this would be an API call to a search service
      // For now, we'll simulate a response with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let mockResults: SearchResult[] = [];
      
      // Generate different mock results based on category - only include hotels, things to do, and restaurants
      if (category === "all" || category === "hotels") {
        mockResults = mockResults.concat([
          {
            name: `${query} Grand Hotel`,
            description: "Luxury accommodations with stunning views",
            location: query,
            rating: 4.7,
            price: "$$$",
            image: `https://source.unsplash.com/featured/?hotel,${query}`,
            type: "hotel"
          },
          {
            name: `${query} Boutique Resort`,
            description: "Charming and intimate lodging experience",
            location: query,
            rating: 4.5,
            price: "$$",
            image: `https://source.unsplash.com/featured/?resort,${query}`,
            type: "hotel"
          }
        ]);
      }
      
      if (category === "all" || category === "things") {
        mockResults = mockResults.concat([
          {
            name: `${query} City Tour`,
            description: "Explore the best sights with local guides",
            location: query,
            rating: 4.8,
            price: "$$",
            image: `https://source.unsplash.com/featured/?tourism,${query}`,
            type: "activity"
          },
          {
            name: `${query} Museum`,
            description: "Cultural artifacts and local history",
            location: query,
            rating: 4.3,
            price: "$",
            image: `https://source.unsplash.com/featured/?museum,${query}`,
            type: "activity"
          }
        ]);
      }
      
      if (category === "all" || category === "restaurants") {
        mockResults = mockResults.concat([
          {
            name: `${query} Fine Dining`,
            description: "Exquisite cuisine with local specialties",
            location: query,
            rating: 4.6,
            price: "$$$",
            image: `https://source.unsplash.com/featured/?restaurant,${query}`,
            type: "restaurant"
          },
          {
            name: `${query} Café`,
            description: "Casual dining with great coffee",
            location: query,
            rating: 4.2,
            price: "$",
            image: `https://source.unsplash.com/featured/?cafe,${query}`,
            type: "restaurant"
          }
        ]);
      }
      
      setSearchResults(mockResults);
      setShowResults(true);
      
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to complete your search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission - now focused on website content only
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      // Always perform search within the website
      performSearch(destination, searchCategory);
    }
  };

  // Close search results
  const handleCloseResults = () => {
    setShowResults(false);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Handle different result types differently
    switch (result.type) {
      case "hotel":
        toast({
          title: "Hotel Selected",
          description: `You selected ${result.name}. Redirecting to booking page...`
        });
        setTimeout(() => navigate(`/trips/create?destination=${encodeURIComponent(destination)}`), 1500);
        break;
      case "flight":
        navigate(`/flights?destination=${encodeURIComponent(destination)}`);
        break;
      case "activity":
        toast({
          title: "Activity Selected",
          description: `You selected ${result.name}. Adding to your itinerary...`
        });
        setTimeout(() => navigate(`/trips/create?destination=${encodeURIComponent(destination)}`), 1500);
        break;
      case "restaurant":
        toast({
          title: "Restaurant Selected",
          description: `You selected ${result.name}. View details and reviews.`
        });
        break;
      case "rental":
        toast({
          title: "Rental Selected",
          description: `You selected ${result.name}. View availability and details.`
        });
        break;
      default:
        navigate(`/trips/create?destination=${encodeURIComponent(destination)}`);
    }
  };

  // Render star rating
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        <span className="text-amber-500">{rating.toFixed(1)}</span>
        <div className="flex ml-1">
          {[...Array(5)].map((_, i) => (
            <svg 
              key={i} 
              className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-500 fill-current' : 'text-gray-300'}`} 
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center px-4 text-slate-800 overflow-hidden bg-white pt-10 pb-16">
      <div className="max-w-6xl mx-auto w-full z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-black">
            Where to?
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing destinations, hotels, and activities
          </p>
        </div>
        
        {/* Search tabs and form */}
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl mx-auto p-5 relative">
          {/* Search categories */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button 
              variant={searchCategory === "all" ? "default" : "outline"} 
              className="rounded-full px-4 py-2 flex items-center gap-2 border-gray-200"
              onClick={() => setSearchCategory("all")}
            >
              <Search className="h-4 w-4" />
              <span>Search All</span>
            </Button>
            <Button 
              variant={searchCategory === "hotels" ? "default" : "outline"} 
              className="rounded-full px-4 py-2 flex items-center gap-2 border-gray-200"
              onClick={() => setSearchCategory("hotels")}
            >
              <Hotel className="h-4 w-4" />
              <span>Hotels</span>
            </Button>
            <Button 
              variant={searchCategory === "things" ? "default" : "outline"} 
              className="rounded-full px-4 py-2 flex items-center gap-2 border-gray-200"
              onClick={() => setSearchCategory("things")}
            >
              <MapPin className="h-4 w-4" />
              <span>Things to Do</span>
            </Button>
            <Button 
              variant={searchCategory === "restaurants" ? "default" : "outline"} 
              className="rounded-full px-4 py-2 flex items-center gap-2 border-gray-200"
              onClick={() => setSearchCategory("restaurants")}
            >
              <Utensils className="h-4 w-4" />
              <span>Restaurants</span>
            </Button>

          </div>
          
          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-grow relative rounded-full border border-gray-200 bg-gray-50">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Places to go, things to do, hotels..."
                className="pl-12 py-6 pr-4 text-gray-800 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              {destination && (
                <button
                  type="button"
                  onClick={() => setDestination("")}
                  className="absolute inset-y-0 right-16 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              className="py-6 px-8 rounded-full bg-[#3264ff] hover:bg-[#2851cc] text-white flex items-center gap-2"
              disabled={!destination.trim() || isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </Button>
          </form>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold">Search Results for "{destination}"</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full h-8 w-8 p-0" 
                  onClick={handleCloseResults}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="divide-y">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="p-4 hover:bg-gray-50 flex cursor-pointer transition-colors duration-150"
                    onClick={() => handleResultClick(result)}
                  >
                    {result.image ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                        <img 
                          src={result.image}
                          alt={result.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(result.type)}`;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        {result.type === 'flight' && <Plane className="h-8 w-8 text-gray-400" />}
                        {result.type === 'hotel' && <Hotel className="h-8 w-8 text-gray-400" />}
                        {result.type === 'activity' && <MapPin className="h-8 w-8 text-gray-400" />}
                        {result.type === 'restaurant' && <Utensils className="h-8 w-8 text-gray-400" />}
                        {result.type === 'rental' && <Car className="h-8 w-8 text-gray-400" />}
                      </div>
                    )}
                    
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900">{result.name}</div>
                      {result.description && (
                        <div className="text-sm text-gray-600 line-clamp-1">{result.description}</div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          {renderRating(result.rating)}
                        </div>
                        {result.price && (
                          <div className="text-sm font-medium">{result.price}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* AI trip planner banner */}
        <div className="mt-10 w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-3/5 text-white">
              <div className="inline-block mb-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                <span className="font-semibold">Powered by AI</span>
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">BETA</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Plan your kind of trip</h2>
              <p className="text-white/80 mb-5">
                Get custom recs for all the things you're into with AI trip builder.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full bg-white text-blue-900 hover:bg-gray-100 border-none px-4"
                onClick={() => navigate("/trips/create")}
              >
                <span className="mr-2">Start a trip with AI</span>
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            <div className="md:w-2/5 h-48 md:h-auto flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="AI Trip Planner" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
