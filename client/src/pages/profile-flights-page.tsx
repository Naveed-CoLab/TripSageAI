import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, Calendar, User, Plane, Clock, Filter, DollarSign, Plus, Search, X, ChevronDown, History, Trash2 } from 'lucide-react';
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

type FlightSearch = {
  id: number;
  userId: number;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  tripType: string;
  maxPrice?: number;
  currencyCode?: string;
  createdAt: string;
};

type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
};

// Popular airports for display purposes
const popularAirports: Airport[] = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
];

// Get airport information by code
const getAirportByCode = (code: string): Airport | undefined => {
  return popularAirports.find((airport) => airport.code === code);
};

export default function ProfileFlightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewDetailsId, setViewDetailsId] = useState<number | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    type: "all", // all, oneway, roundtrip
    sortBy: "date-desc", // date-desc, date-asc, origin, destination
  });

  // Fetch flight search history
  const {
    data: searchHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery<FlightSearch[]>({
    queryKey: ['/api/flights/history'],
    enabled: !!user,
  });

  // Delete search mutation
  const deleteSearchMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/flights/history/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flights/history'] });
      toast({
        title: "Search deleted",
        description: "The search has been removed from your history",
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
      .filter(search => {
        if (searchFilters.type === "all") return true;
        if (searchFilters.type === "oneway") return search.tripType === "ONE_WAY";
        if (searchFilters.type === "roundtrip") return search.tripType === "ROUND_TRIP";
        return true;
      })
      .sort((a, b) => {
        if (searchFilters.sortBy === "date-desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (searchFilters.sortBy === "date-asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (searchFilters.sortBy === "origin") {
          return a.originLocationCode.localeCompare(b.originLocationCode);
        }
        if (searchFilters.sortBy === "destination") {
          return a.destinationLocationCode.localeCompare(b.destinationLocationCode);
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
  const searchAgain = (search: FlightSearch) => {
    // Save the search details in session storage to be used by the flights page
    sessionStorage.setItem('reapplySearch', JSON.stringify(search));
    // Navigate to the flights page
    navigate('/flights');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Flight Searches</h1>
            <p className="text-gray-500 mt-1">View and manage your flight search history</p>
          </div>
          <Button 
            onClick={() => navigate('/flights')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Search
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
                <Badge variant="outline" className="bg-white">
                  {searchHistory?.length || 0} searches
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select 
                  value={searchFilters.type} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, type: value})}
                >
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All trips</SelectItem>
                    <SelectItem value="oneway">One way</SelectItem>
                    <SelectItem value="roundtrip">Round trip</SelectItem>
                  </SelectContent>
                </Select>
                
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
                    <SelectItem value="origin">Origin (A-Z)</SelectItem>
                    <SelectItem value="destination">Destination (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {isHistoryLoading ? (
            <div className="p-12 flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500">Loading your flight searches...</p>
              </div>
            </div>
          ) : filteredAndSortedHistory.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Plane className="h-12 w-12 text-blue-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flight searches yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You haven't searched for any flights yet. When you do, they'll appear here for easy access.
              </p>
              <Button 
                onClick={() => navigate('/flights')} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Flights
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAndSortedHistory.map((search) => {
                const originAirport = getAirportByCode(search.originLocationCode);
                const destinationAirport = getAirportByCode(search.destinationLocationCode);
                
                return (
                  <div key={search.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="rounded-full bg-blue-100 p-2.5">
                            <Plane className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              {search.originLocationCode} → {search.destinationLocationCode}
                              <Badge className="ml-2 bg-blue-50 text-blue-600 border-blue-100">
                                {search.tripType === "ONE_WAY" ? "One way" : "Round trip"}
                              </Badge>
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {originAirport?.city || search.originLocationCode} to {destinationAirport?.city || search.destinationLocationCode}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {new Date(search.departureDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {search.returnDate && ` - ${new Date(search.returnDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {search.adults} {search.adults === 1 ? 'adult' : 'adults'}
                              {search.children ? `, ${search.children} children` : ''}
                              {search.infants ? `, ${search.infants} infants` : ''}
                            </span>
                          </div>
                          
                          {search.travelClass && (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1.5 text-gray-400" />
                              <span>{search.travelClass}</span>
                            </div>
                          )}
                          
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
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
        
        {/* Details Dialog */}
        {viewDetailsId && searchHistory && (
          <Dialog open={!!viewDetailsId} onOpenChange={() => setViewDetailsId(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Search Details</DialogTitle>
                <DialogDescription>
                  Detailed information about your flight search
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {searchHistory.find(s => s.id === viewDetailsId) && (
                  <div className="space-y-4">
                    {/* Render detailed search information here */}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailsId(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    const search = searchHistory.find(s => s.id === viewDetailsId);
                    if (search) {
                      searchAgain(search);
                    }
                  }}
                >
                  Search Again
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}