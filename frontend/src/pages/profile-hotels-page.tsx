import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, Calendar, User, Clock, Filter, DollarSign, Plus, Search, X, ChevronDown, History, Trash2, Building } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLocation } from 'wouter';

type HotelSearch = {
  id: number;
  userId: number;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms: number;
  locationDetails?: {
    city?: string;
    country?: string;
  };
  createdAt: string;
};

// Popular locations for display purposes
const popularLocations = [
  { city: "New York", country: "USA" },
  { city: "Los Angeles", country: "USA" },
  { city: "London", country: "UK" },
  { city: "Paris", country: "France" },
  { city: "Dubai", country: "UAE" },
  { city: "Singapore", country: "Singapore" },
  { city: "Tokyo", country: "Japan" },
  { city: "Sydney", country: "Australia" },
];

// Get location information 
const getLocationInfo = (location: string): { city: string, country: string } | undefined => {
  // Try to match with popular locations
  const matchedLocation = popularLocations.find(
    (loc) => location.toLowerCase().includes(loc.city.toLowerCase())
  );
  
  if (matchedLocation) {
    return matchedLocation;
  }
  
  // If we have JSON stored in locationDetails
  try {
    if (location.includes("{")) {
      const parsedLocation = JSON.parse(location);
      if (parsedLocation.city && parsedLocation.country) {
        return {
          city: parsedLocation.city,
          country: parsedLocation.country
        };
      }
    }
  } catch (e) {
    // Parsing failed, continue with default handling
  }
  
  // Return the location as city name if we can't get more info
  return {
    city: location,
    country: ""
  };
};

export default function ProfileHotelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewDetailsId, setViewDetailsId] = useState<number | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    sortBy: "date-desc", // date-desc, date-asc, location
  });

  // Fetch hotel search history
  const {
    data: searchHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery<HotelSearch[]>({
    queryKey: ['/api/hotels/history'],
    enabled: !!user,
  });

  // Delete search mutation
  const deleteSearchMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/hotels/history/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotels/history'] });
      toast({
        title: "Search deleted",
        description: "The hotel search has been removed from your history",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete search: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Apply filters and sorting to search history
  const filteredAndSortedHistory = searchHistory ? 
    searchHistory
      .sort((a, b) => {
        if (searchFilters.sortBy === "date-desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (searchFilters.sortBy === "date-asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (searchFilters.sortBy === "location") {
          return a.location.localeCompare(b.location);
        }
        return 0;
      }) : [];

  // Delete search from history
  const deleteSearch = (id: number) => {
    deleteSearchMutation.mutate(id);
  };

  // View search details
  const viewDetails = (id: number) => {
    setViewDetailsId(id);
  };

  // Navigate to search page with prefilled data
  const searchAgain = (search: HotelSearch) => {
    // Save the search details in session storage to be used by the hotels page
    sessionStorage.setItem('reapplyHotelSearch', JSON.stringify(search));
    // Navigate to the hotels page
    navigate('/hotels');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Hotel Searches</h1>
            <p className="text-gray-500 mt-1">View and manage your hotel search history</p>
          </div>
          <Button 
            onClick={() => navigate('/hotels')} 
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Hotel Search
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-b">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Hotel Search History</h2>
                <Badge variant="outline" className="bg-white">
                  {searchHistory?.length || 0} searches
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select 
                  value={searchFilters.sortBy} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, sortBy: value})}
                >
                  <SelectTrigger className="w-[160px] bg-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest first</SelectItem>
                    <SelectItem value="date-asc">Oldest first</SelectItem>
                    <SelectItem value="location">Location (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {isHistoryLoading ? (
            <div className="p-12 flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-gray-500">Loading your hotel searches...</p>
              </div>
            </div>
          ) : filteredAndSortedHistory.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <Building className="h-12 w-12 text-teal-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hotel searches yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You haven't searched for any hotels yet. When you do, they'll appear here for easy access.
              </p>
              <Button 
                onClick={() => navigate('/hotels')} 
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Hotels
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAndSortedHistory.map((search) => {
                const locationInfo = getLocationInfo(search.location);
                
                return (
                  <div key={search.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="rounded-full bg-teal-100 p-2.5">
                            <Building className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              {locationInfo?.city}
                              {locationInfo?.country && 
                                <Badge className="ml-2 bg-teal-50 text-teal-600 border-teal-100">
                                  {locationInfo.country}
                                </Badge>
                              }
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'}, 
                              {search.guests} {search.guests === 1 ? 'guest' : 'guests'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {new Date(search.checkInDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {` - ${new Date(search.checkOutDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {search.guests} {search.guests === 1 ? 'guest' : 'guests'}, 
                              {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {new Date(search.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-teal-600 border-teal-200 hover:bg-teal-50"
                          onClick={() => searchAgain(search)}
                        >
                          <Search className="h-3.5 w-3.5 mr-1.5" />
                          Search Again
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}