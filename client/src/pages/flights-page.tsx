import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plane, MapPin, X, Filter, ShieldCheck, Sparkles, Users, ChevronDown, XCircle, User, LucideIcon } from "lucide-react";
import PopularFlightDestinations from "@/components/flights/popular-flight-destinations";

// Types
type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
};

type Airline = {
  code: string;
  name: string;
  logo: string;
};

type Flight = {
  id: string;
  airline: Airline;
  flightNumber: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  cabinClass: string;
  seatsAvailable: number;
};

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

// Helper functions
function getRandomAirport(exclude?: string): Airport {
  const airports = [
    { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States" },
    { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
    { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom" },
    { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
    { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
    { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
    { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
    { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
    { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
    { code: "FCO", name: "Leonardo da Vinci International Airport", city: "Rome", country: "Italy" },
    { code: "BCN", name: "Barcelona–El Prat Airport", city: "Barcelona", country: "Spain" },
    { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada" },
  ];
  
  const filteredAirports = exclude ? airports.filter(airport => airport.code !== exclude) : airports;
  return filteredAirports[Math.floor(Math.random() * filteredAirports.length)];
}

function getRandomAirline(): Airline {
  const airlines = [
    { code: "DL", name: "Delta Air Lines", logo: "https://www.delta.com/content/dam/delta-com/logos/delta-logo.png" },
    { code: "UA", name: "United Airlines", logo: "https://www.united.com/ual/en/us/fly/assets/img/logos/united-airlines-logo.png" },
    { code: "AA", name: "American Airlines", logo: "https://www.aa.com/content/images/chrome/rebrand/aa-logo.png" },
    { code: "BA", name: "British Airways", logo: "https://www.britishairways.com/assets/images/global/common/logos/ba-logo.png" },
    { code: "LH", name: "Lufthansa", logo: "https://www.lufthansa.com/content/dam/lh/images/logos/lufthansa-logo.svg" },
    { code: "AF", name: "Air France", logo: "https://www.airfrance.fr/FR/en/common/common/img/logos/logo-air-france.png" },
    { code: "KL", name: "KLM Royal Dutch Airlines", logo: "https://www.klm.com/wcm/assets/images/kl-logo.svg" },
    { code: "JL", name: "Japan Airlines", logo: "https://www.jal.com/assets/img/logo_jal.png" },
    { code: "SQ", name: "Singapore Airlines", logo: "https://www.singaporeair.com/saar5/images/navigation/sia-logo.png" },
    { code: "EK", name: "Emirates", logo: "https://www.emirates.com/assets/images/emirates-logo.svg" },
    { code: "QF", name: "Qantas", logo: "https://www.qantas.com/content/dam/qantas/logos/qantas-masterbrand-logo-large.svg" },
    { code: "CX", name: "Cathay Pacific", logo: "https://www.cathaypacific.com/content/dam/focal-point/cx/logos/desktop-and-mobile/cathay-pacific-logo.svg" },
  ];
  
  return airlines[Math.floor(Math.random() * airlines.length)];
}

function generateRandomFlightNumber(): string {
  const airline = getRandomAirline();
  const number = Math.floor(Math.random() * 10000);
  return `${airline.code}${number.toString().padStart(3, '0')}`;
}

function getRandomDuration(): string {
  const hours = Math.floor(Math.random() * 12) + 1;
  const minutes = Math.floor(Math.random() * 60);
  return `${hours}h ${minutes}m`;
}

function getRandomPrice(): number {
  return Math.floor(Math.random() * 1500) + 200;
}

function getRandomStops(): number {
  const weights = [0.6, 0.3, 0.1]; // 60% for 0 stops, 30% for 1 stop, 10% for 2 stops
  const random = Math.random();
  
  if (random < weights[0]) return 0;
  if (random < weights[0] + weights[1]) return 1;
  return 2;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function generateMockFlights(
  origin: string, 
  destination: string, 
  departureDate: Date | null,
  returnDate: Date | null = null,
  count: number = 10
): { outbound: Flight[], return: Flight[] } {
  if (!departureDate) {
    return { outbound: [], return: [] };
  }
  
  const departureAirport = { 
    code: origin,
    name: `${origin} International Airport`,
    city: origin,
    country: "Unknown"
  };
  
  const arrivalAirport = {
    code: destination,
    name: `${destination} International Airport`,
    city: destination,
    country: "Unknown"
  };
  
  // Outbound flights
  const outboundFlights: Flight[] = Array.from({ length: count }, (_, i) => {
    const departureDateCopy = new Date(departureDate);
    departureDateCopy.setHours(6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0);
    
    const durationInMinutes = 60 + Math.floor(Math.random() * 480);
    const arrivalDateCopy = new Date(departureDateCopy.getTime() + durationInMinutes * 60000);
    
    const airline = getRandomAirline();
    const stops = getRandomStops();
    
    const cabinClasses = ["Economy", "Premium Economy", "Business", "First"];
    
    return {
      id: `outbound-${i}`,
      airline,
      flightNumber: generateRandomFlightNumber(),
      departureAirport,
      arrivalAirport,
      departureTime: departureDateCopy.toISOString(),
      arrivalTime: arrivalDateCopy.toISOString(),
      duration: `${Math.floor(durationInMinutes / 60)}h ${durationInMinutes % 60}m`,
      price: getRandomPrice(),
      currency: "USD",
      stops,
      cabinClass: cabinClasses[Math.floor(Math.random() * cabinClasses.length)],
      seatsAvailable: Math.floor(Math.random() * 50) + 1,
    };
  });
  
  // Sort by price
  outboundFlights.sort((a, b) => a.price - b.price);
  
  // Return flights (if roundtrip)
  let returnFlights: Flight[] = [];
  
  if (returnDate) {
    returnFlights = Array.from({ length: count }, (_, i) => {
      const returnDateCopy = new Date(returnDate);
      returnDateCopy.setHours(6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0);
      
      const durationInMinutes = 60 + Math.floor(Math.random() * 480);
      const arrivalDateCopy = new Date(returnDateCopy.getTime() + durationInMinutes * 60000);
      
      const airline = getRandomAirline();
      const stops = getRandomStops();
      
      const cabinClasses = ["Economy", "Premium Economy", "Business", "First"];
      
      return {
        id: `return-${i}`,
        airline,
        flightNumber: generateRandomFlightNumber(),
        departureAirport: arrivalAirport,
        arrivalAirport: departureAirport,
        departureTime: returnDateCopy.toISOString(),
        arrivalTime: arrivalDateCopy.toISOString(),
        duration: `${Math.floor(durationInMinutes / 60)}h ${durationInMinutes % 60}m`,
        price: getRandomPrice(),
        currency: "USD",
        stops,
        cabinClass: cabinClasses[Math.floor(Math.random() * cabinClasses.length)],
        seatsAvailable: Math.floor(Math.random() * 50) + 1
      };
    });
    
    // Sort by price
    returnFlights.sort((a, b) => a.price - b.price);
  }
  
  return {
    outbound: outboundFlights,
    return: returnFlights
  };
}

export default function FlightsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Search form state
  const [tripType, setTripType] = useState<string>("roundtrip");
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [departDate, setDepartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState<string>("1");
  const [cabinClass, setCabinClass] = useState<string>("Economy");
  
  // Flight display state
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<string>("");
  const [selectedReturn, setSelectedReturn] = useState<string>("");
  
  // Filter state
  const [priceFilter, setPriceFilter] = useState<[number, number]>([0, 2000]);
  const [stopsFilter, setStopsFilter] = useState<number[]>([0, 1, 2]);
  const [airlineFilter, setAirlineFilter] = useState<string[]>([]);
  const airlines = [...new Set(flights.map(f => f.airline.code))].map(code => 
    flights.find(f => f.airline.code === code)?.airline || { code: "", name: "", logo: "" }
  );
  
  // Popular airports for autocomplete
  const popularAirports = [
    { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States" },
    { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
    { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom" },
    { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
    { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
    { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
    { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
    { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
  ];
  
  // Search history
  const searchHistoryQuery = useQuery({
    queryKey: ['/api/flights/history'],
    enabled: !!user,
  });
  
  const searchFlightsMutation = useMutation({
    mutationFn: async (searchData: any) => {
      // Save search to history if user is logged in
      if (user) {
        try {
          await apiRequest('/api/flights/history', 'POST', searchData);
        } catch (error) {
          console.error('Failed to save search history:', error);
        }
      }
      
      // In a real app, this would be an API call to search flights
      // For now, just generate mock flights
      const mockResults = generateMockFlights(
        searchData.originLocationCode,
        searchData.destinationLocationCode,
        new Date(searchData.departureDate),
        searchData.returnDate ? new Date(searchData.returnDate) : null
      );
      
      return mockResults;
    },
    onSuccess: (data) => {
      setFlights(data.outbound);
      setReturnFlights(data.return);
      setShowResults(true);
      setLoading(false);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.querySelector('.search-form')?.clientHeight || 0, behavior: 'smooth' });
      }, 100);
      
      // Re-fetch search history
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/flights/history'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    },
  });
  
  const deleteSearchMutation = useMutation({
    mutationFn: async (searchId: number) => {
      return await apiRequest(`/api/flights/history/${searchId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flights/history'] });
      toast({
        title: "Search removed",
        description: "The search has been removed from your history.",
      });
    },
  });
  
  // Handle search
  const handleSearch = () => {
    // Validate inputs
    if (!origin) {
      toast({
        title: "Origin Required",
        description: "Please enter an origin airport",
        variant: "destructive"
      });
      return;
    }
    
    if (!destination) {
      toast({
        title: "Destination Required",
        description: "Please enter a destination airport",
        variant: "destructive"
      });
      return;
    }
    
    if (!departDate) {
      toast({
        title: "Departure Date Required",
        description: "Please select a departure date",
        variant: "destructive"
      });
      return;
    }
    
    if (tripType === "roundtrip" && !returnDate) {
      toast({
        title: "Return Date Required",
        description: "Please select a return date for round trip",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setSelectedOutbound("");
    setSelectedReturn("");
    
    const searchData = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate.toISOString().split('T')[0],
      returnDate: returnDate ? returnDate.toISOString().split('T')[0] : undefined,
      adults: parseInt(passengers),
      travelClass: cabinClass,
      tripType: tripType === "roundtrip" ? "ROUND_TRIP" : "ONE_WAY",
    };
    
    searchFlightsMutation.mutate(searchData);
  };
  
  // Filter flights
  const filteredFlights = flights.filter(flight => {
    // Filter by price
    if (flight.price < priceFilter[0] || flight.price > priceFilter[1]) return false;
    
    // Filter by stops
    if (!stopsFilter.includes(flight.stops)) return false;
    
    // Filter by airline
    if (airlineFilter.length > 0 && !airlineFilter.includes(flight.airline.code)) return false;
    
    return true;
  });
  
  const filteredReturnFlights = returnFlights.filter(flight => {
    // Filter by price
    if (flight.price < priceFilter[0] || flight.price > priceFilter[1]) return false;
    
    // Filter by stops
    if (!stopsFilter.includes(flight.stops)) return false;
    
    // Filter by airline
    if (airlineFilter.length > 0 && !airlineFilter.includes(flight.airline.code)) return false;
    
    return true;
  });
  
  // Handle flight selection
  const handleFlightSelect = (flightId: string, type: 'outbound' | 'return') => {
    if (type === 'outbound') {
      setSelectedOutbound(flightId);
    } else {
      setSelectedReturn(flightId);
    }
  };
  
  // Handle booking
  const handleBooking = () => {
    if (!selectedOutbound) {
      toast({
        title: "Flight Selection Required",
        description: "Please select an outbound flight",
        variant: "destructive"
      });
      return;
    }
    
    if (tripType === "roundtrip" && !selectedReturn) {
      toast({
        title: "Flight Selection Required",
        description: "Please select a return flight",
        variant: "destructive"
      });
      return;
    }
    
    // Save flight search results to session storage for the booking page
    sessionStorage.setItem('flightSearchResults', JSON.stringify({
      outboundFlights: flights,
      returnFlights: tripType === "roundtrip" ? returnFlights : null
    }));
    
    // Navigate to the booking page with the selected flight IDs
    if (tripType === "roundtrip" && selectedReturn) {
      setLocation(`/flight-booking/${selectedOutbound}/${selectedReturn}`);
    } else {
      setLocation(`/flight-booking/${selectedOutbound}`);
    }
  };
  
  // Apply search from history
  const applySearchFromHistory = (search: FlightSearch) => {
    setOrigin(search.originLocationCode);
    setDestination(search.destinationLocationCode);
    
    // Set depart date
    if (search.departureDate) {
      setDepartDate(new Date(search.departureDate));
    }
    
    // Set return date if available
    if (search.returnDate) {
      setReturnDate(new Date(search.returnDate));
    } else {
      setReturnDate(null);
    }
    
    // Set trip type
    if (search.tripType) {
      const tripTypeValue = search.tripType === "ONE_WAY" ? "oneway" : "roundtrip";
      setTripType(tripTypeValue);
    }
    
    // Set passengers
    if (search.adults) {
      setPassengers(search.adults.toString());
    }
    
    // Set cabin class if available
    if (search.travelClass) {
      setCabinClass(search.travelClass);
    }
    
    // Scroll to search form
    document.querySelector('.search-form')?.scrollIntoView({ behavior: 'smooth' });
    
    toast({
      title: "Search loaded",
      description: "Your previous search has been loaded. Click 'Search Flights' to proceed.",
    });
  };
  
  // Delete search from history
  const deleteSearchFromHistory = (searchId: number) => {
    deleteSearchMutation.mutate(searchId);
  };

  return (
    <MainLayout>
      <div>
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 h-80 overflow-hidden">
          <div className="absolute inset-0 bg-blue-800 mix-blend-multiply opacity-30"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1536516677467-a8cf206e1066?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" 
            }}
          ></div>
          
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-bold text-white mb-2">Find Your Next Adventure</h1>
                <p className="text-xl text-white/80 mb-8">Search flights to destinations worldwide with our easy-to-use flight finder</p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-white/90 text-sm">
                  <div className="flex items-center">
                    <Plane className="h-4 w-4 mr-2" />
                    <span>100+ Airlines</span>
                  </div>
                  <div className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <span>Secure Booking</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Best Price Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Form Card */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-6 relative z-10 search-form">
          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              <Tabs defaultValue={tripType} onValueChange={setTripType} className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <TabsList className="grid grid-cols-3 w-auto">
                    <TabsTrigger value="roundtrip" className="px-6">Round Trip</TabsTrigger>
                    <TabsTrigger value="oneway" className="px-6">One Way</TabsTrigger>
                    <TabsTrigger value="multicity" className="px-6">Multi-City</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Label htmlFor="flexible-dates" className="cursor-pointer">Flexible Dates</Label>
                    <Switch id="flexible-dates" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                  {/* Origin */}
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor="origin" className="text-sm font-medium">From</Label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 rotate-45" />
                      <Input
                        id="origin"
                        placeholder="City or Airport"
                        className="pl-10 h-12"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        list="origin-options"
                      />
                      <datalist id="origin-options">
                        {popularAirports.map(airport => (
                          <option key={airport.code} value={airport.code}>
                            {airport.code} - {airport.city}, {airport.country}
                          </option>
                        ))}
                      </datalist>
                      
                      {origin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full text-gray-400 hover:text-gray-600"
                          onClick={() => setOrigin('')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Destination */}
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor="destination" className="text-sm font-medium">To</Label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4 -rotate-45" />
                      <Input
                        id="destination"
                        placeholder="City or Airport"
                        className="pl-10 h-12"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        list="destination-options"
                      />
                      <datalist id="destination-options">
                        {popularAirports.map(airport => (
                          <option key={airport.code} value={airport.code}>
                            {airport.code} - {airport.city}, {airport.country}
                          </option>
                        ))}
                      </datalist>
                      
                      {destination && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full text-gray-400 hover:text-gray-600"
                          onClick={() => setDestination('')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Date Selection */}
                  <div className="lg:col-span-2">
                    <Label className="text-sm font-medium mb-2 block">
                      {tripType === "roundtrip" ? "Departure - Return" : "Departure"}
                    </Label>
                    <div className="flex gap-2">
                      {/* Depart Date */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`justify-start text-left font-normal h-12 flex-1 ${!departDate ? 'text-gray-400' : ''}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departDate ? formatDate(departDate) : "Depart"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departDate || undefined}
                            onSelect={(date: Date | undefined) => setDepartDate(date || null)}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {/* Return Date - Only shown for round trip */}
                      {tripType === "roundtrip" && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`justify-start text-left font-normal h-12 flex-1 ${!returnDate ? 'text-gray-400' : ''}`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {returnDate ? formatDate(returnDate) : "Return"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={returnDate || undefined}
                              onSelect={(date: Date | undefined) => setReturnDate(date || null)}
                              initialFocus
                              className="rounded-md border"
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
                  {/* Passengers */}
                  <div className="lg:col-span-3 space-y-2">
                    <Label htmlFor="passengers" className="text-sm font-medium">Passengers</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="pl-10 h-12">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Passenger' : 'Passengers'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Cabin Class */}
                  <div className="lg:col-span-3 space-y-2">
                    <Label htmlFor="cabin-class" className="text-sm font-medium">Cabin Class</Label>
                    <div className="relative">
                      <Select value={cabinClass} onValueChange={setCabinClass}>
                        <SelectTrigger className="h-12 pl-3">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Economy">Economy</SelectItem>
                          <SelectItem value="Premium Economy">Premium Economy</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="First">First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Search Button */}
                  <div className="lg:col-span-6 self-end">
                    <Button
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⊝</span>
                          Searching...
                        </>
                      ) : (
                        "Search Flights"
                      )}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Search Results */}
        {showResults && (
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Filters */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <Filter className="h-5 w-5 text-gray-500" />
                  </div>
                  
                  <div className="space-y-6">
                    {/* Price Range */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Price Range</h3>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>${priceFilter[0]}</span>
                        <span>${priceFilter[1]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={priceFilter[1]}
                        onChange={(e) => setPriceFilter([priceFilter[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Stops */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Stops</h3>
                      <div className="space-y-2">
                        {[0, 1, 2].map((stop) => (
                          <label key={stop} className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded text-blue-500 mr-2"
                              checked={stopsFilter.includes(stop)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setStopsFilter([...stopsFilter, stop]);
                                } else {
                                  setStopsFilter(stopsFilter.filter(s => s !== stop));
                                }
                              }}
                            />
                            {stop === 0 ? "Nonstop" : stop === 1 ? "1 Stop" : "2+ Stops"}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Airlines */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Airlines</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {airlines.map((airline) => (
                          <label key={airline.code} className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded text-blue-500 mr-2"
                              checked={airlineFilter.includes(airline.code)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAirlineFilter([...airlineFilter, airline.code]);
                                } else {
                                  setAirlineFilter(airlineFilter.filter(a => a !== airline.code));
                                }
                              }}
                            />
                            {airline.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Flight Results */}
              <div className="md:col-span-3 space-y-6">
                {/* Outbound Flights */}
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    {origin} to {destination} ({formatDate(departDate)})
                  </h2>
                  
                  {filteredFlights.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-6 text-center">
                      <p className="text-gray-500">No flights found. Please try different search criteria.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFlights.map((flight) => (
                        <div 
                          key={flight.id}
                          className={`bg-white rounded-xl shadow-md p-4 transition-all ${
                            selectedOutbound === flight.id
                              ? "ring-2 ring-blue-500"
                              : "hover:shadow-lg"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                            <div className="flex items-center mb-2 md:mb-0">
                              <div className="w-10 h-10 mr-3">
                                <img
                                  src={flight.airline.logo}
                                  alt={flight.airline.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${flight.airline.name}&background=random`;
                                  }}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{flight.airline.name}</div>
                                <div className="text-xs text-gray-500">{flight.flightNumber}</div>
                              </div>
                            </div>
                            
                            <div className="flex-1 mx-4 grid grid-cols-7 gap-2 items-center">
                              <div className="col-span-2">
                                <div className="text-lg font-bold">{formatTime(flight.departureTime)}</div>
                                <div className="text-sm text-gray-500">{flight.departureAirport.code}</div>
                              </div>
                              
                              <div className="col-span-3 flex flex-col items-center">
                                <div className="text-xs text-gray-500">{flight.duration}</div>
                                <div className="w-full flex items-center">
                                  <div className="h-0.5 flex-1 bg-gray-300"></div>
                                  <Plane className="h-4 w-4 text-gray-400 mx-1" />
                                  <div className="h-0.5 flex-1 bg-gray-300"></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {flight.stops === 0
                                    ? "Nonstop"
                                    : flight.stops === 1
                                    ? "1 Stop"
                                    : `${flight.stops} Stops`}
                                </div>
                              </div>
                              
                              <div className="col-span-2 text-right">
                                <div className="text-lg font-bold">{formatTime(flight.arrivalTime)}</div>
                                <div className="text-sm text-gray-500">{flight.arrivalAirport.code}</div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">${flight.price}</div>
                              <div className="text-xs text-gray-500">{flight.cabinClass}</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center border-t pt-4">
                            <div className="text-sm text-gray-500">
                              {flight.seatsAvailable} seats left
                            </div>
                            
                            {selectedOutbound === flight.id ? (
                              <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleBooking}
                              >
                                Continue to Booking
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => handleFlightSelect(flight.id, 'outbound')}
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Return Flights for Round Trip */}
                {tripType === "roundtrip" && filteredReturnFlights.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">
                      {destination} to {origin} ({formatDate(returnDate)})
                    </h2>
                    
                    <div className="space-y-4">
                      {filteredReturnFlights.map((flight) => (
                        <div 
                          key={flight.id}
                          className={`bg-white rounded-xl shadow-md p-4 transition-all ${
                            selectedReturn === flight.id
                              ? "ring-2 ring-blue-500"
                              : "hover:shadow-lg"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                            <div className="flex items-center mb-2 md:mb-0">
                              <div className="w-10 h-10 mr-3">
                                <img
                                  src={flight.airline.logo}
                                  alt={flight.airline.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${flight.airline.name}&background=random`;
                                  }}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{flight.airline.name}</div>
                                <div className="text-xs text-gray-500">{flight.flightNumber}</div>
                              </div>
                            </div>
                            
                            <div className="flex-1 mx-4 grid grid-cols-7 gap-2 items-center">
                              <div className="col-span-2">
                                <div className="text-lg font-bold">{formatTime(flight.departureTime)}</div>
                                <div className="text-sm text-gray-500">{flight.departureAirport.code}</div>
                              </div>
                              
                              <div className="col-span-3 flex flex-col items-center">
                                <div className="text-xs text-gray-500">{flight.duration}</div>
                                <div className="w-full flex items-center">
                                  <div className="h-0.5 flex-1 bg-gray-300"></div>
                                  <Plane className="h-4 w-4 text-gray-400 mx-1" />
                                  <div className="h-0.5 flex-1 bg-gray-300"></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {flight.stops === 0
                                    ? "Nonstop"
                                    : flight.stops === 1
                                    ? "1 Stop"
                                    : `${flight.stops} Stops`}
                                </div>
                              </div>
                              
                              <div className="col-span-2 text-right">
                                <div className="text-lg font-bold">{formatTime(flight.arrivalTime)}</div>
                                <div className="text-sm text-gray-500">{flight.arrivalAirport.code}</div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">${flight.price}</div>
                              <div className="text-xs text-gray-500">{flight.cabinClass}</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center border-t pt-4">
                            <div className="text-sm text-gray-500">
                              {flight.seatsAvailable} seats left
                            </div>
                            
                            {selectedReturn === flight.id ? (
                              <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleBooking}
                              >
                                Continue to Booking
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => handleFlightSelect(flight.id, 'return')}
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Booking button (shown when flights are selected) */}
                {(selectedOutbound && (tripType !== "roundtrip" || selectedReturn)) && (
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="text-lg font-medium">Your Selection</h3>
                        <div className="text-sm text-gray-500">
                          Total price: 
                          <span className="text-blue-600 font-bold ml-2">
                            ${filteredFlights.find(f => f.id === selectedOutbound)?.price || 0}
                            {selectedReturn && ` + $${filteredReturnFlights.find(f => f.id === selectedReturn)?.price || 0}`}
                          </span>
                        </div>
                      </div>
                      <Button onClick={handleBooking} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                        Continue to Booking
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Popular Destinations (shown when no results) */}
        {!showResults && (
          <PopularFlightDestinations 
            onDestinationSelect={(destinationName) => {
              setDestination(destinationName);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            layout="grid"
          />
        )}
      </div>
    </MainLayout>
  );
}