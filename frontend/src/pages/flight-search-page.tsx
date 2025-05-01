import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, Plane, ArrowRightIcon, Luggage, Users, Clock, Briefcase, Wifi, Filter } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import debounce from "lodash.debounce";

// Flight search form schema
const flightSearchSchema = z.object({
  originLocationCode: z.string().min(3, "Origin airport code is required"),
  destinationLocationCode: z.string().min(3, "Destination airport code is required"),
  departureDate: z.date({
    required_error: "Departure date is required",
  }),
  returnDate: z.date().optional(),
  adults: z.number().min(1).max(9).default(1),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
});

type FlightSearchValues = z.infer<typeof flightSearchSchema>;

type Airport = {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  address?: {
    cityName: string;
    countryName: string;
  };
};

type FlightOffer = {
  id: string;
  source: string;
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO date string
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO date string
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
      id: string;
    }>;
    duration?: string;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    grandTotal: string;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      class: string;
    }>;
  }>;
};

export default function FlightSearchPage() {
  const { toast } = useToast();
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [originQuery, setOriginQuery] = useState<string>("");
  const [destinationQuery, setDestinationQuery] = useState<string>("");
  const [flightOffers, setFlightOffers] = useState<FlightOffer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Create the flight search form
  const form = useForm<FlightSearchValues>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      adults: 1,
      travelClass: "ECONOMY",
    },
  });

  // Debounced airport search functions
  const debouncedOriginSearch = debounce((searchTerm: string) => {
    setOriginQuery(searchTerm);
  }, 500);

  const debouncedDestinationSearch = debounce((searchTerm: string) => {
    setDestinationQuery(searchTerm);
  }, 500);

  // Airport search queries
  const {
    data: originAirports,
    isLoading: isLoadingOriginAirports,
  } = useQuery({
    queryKey: ["/api/airports/search", originQuery],
    queryFn: async () => {
      if (!originQuery || originQuery.length < 2) return [];
      const response = await fetch(`/api/airports/search?keyword=${originQuery}`);
      if (!response.ok) throw new Error("Failed to fetch airports");
      return response.json();
    },
    enabled: originQuery.length >= 2,
  });

  const {
    data: destinationAirports,
    isLoading: isLoadingDestinationAirports,
  } = useQuery({
    queryKey: ["/api/airports/search", destinationQuery],
    queryFn: async () => {
      if (!destinationQuery || destinationQuery.length < 2) return [];
      const response = await fetch(`/api/airports/search?keyword=${destinationQuery}`);
      if (!response.ok) throw new Error("Failed to fetch airports");
      return response.json();
    },
    enabled: destinationQuery.length >= 2,
  });

  // Flight search mutation
  const flightSearchMutation = useMutation({
    mutationFn: async (data: FlightSearchValues) => {
      const formattedData = {
        ...data,
        departureDate: format(data.departureDate, "yyyy-MM-dd"),
        returnDate: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : undefined,
      };
      
      const response = await apiRequest("/api/flights/search", "POST", formattedData);
      return response.json();
    },
    onSuccess: (data) => {
      setFlightOffers(data);
      setIsSearching(false);
      
      if (data.length === 0) {
        toast({
          title: "No flights found",
          description: "Try changing your search criteria.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setIsSearching(false);
      toast({
        title: "Error searching flights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: FlightSearchValues) {
    setIsSearching(true);
    flightSearchMutation.mutate(data);
  }

  // Format duration string (e.g., PT2H30M to 2h 30m)
  function formatDuration(duration: string) {
    const durationRegex = /PT(\d+H)?(\d+M)?/;
    const matches = duration.match(durationRegex);
    
    if (!matches) return duration;
    
    let hours = 0;
    let minutes = 0;
    
    if (matches[1]) {
      hours = parseInt(matches[1].replace("H", ""));
    }
    
    if (matches[2]) {
      minutes = parseInt(matches[2].replace("M", ""));
    }
    
    return `${hours ? hours + "h " : ""}${minutes ? minutes + "m" : ""}`;
  }

  // Format date string (e.g., 2023-05-15T10:30:00 to May 15, 10:30)
  function formatDateTime(dateTime: string) {
    const date = new Date(dateTime);
    return `${format(date, "HH:mm")}`;
  }
  
  function formatDate(dateTime: string) {
    const date = new Date(dateTime);
    return `${format(date, "MMM d")}`;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Flight Search</h1>
          <p className="text-muted-foreground mb-6">Find the best flights for your trip</p>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4">
              <Card className="sticky top-6 shadow-md">
                <CardHeader className="bg-white border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle>Filters</CardTitle>
                    <Filter className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardDescription>Refine your search</CardDescription>
                </CardHeader>
                <CardContent className="bg-white">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="originLocationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Search airports..."
                                  value={selectedOrigin ? `${selectedOrigin.iataCode} - ${selectedOrigin.name}` : ""}
                                  onChange={(e) => {
                                    debouncedOriginSearch(e.target.value);
                                    setSelectedOrigin(null);
                                    field.onChange("");
                                  }}
                                  className="border-blue-200 focus:border-blue-500"
                                />
                              </FormControl>
                              {originQuery.length >= 2 && !selectedOrigin && (
                                <div className="absolute z-10 mt-1 w-full bg-background rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
                                  {isLoadingOriginAirports ? (
                                    <div className="p-2 text-center">
                                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                      Loading...
                                    </div>
                                  ) : originAirports?.length ? (
                                    <ul>
                                      {originAirports.map((airport: Airport) => (
                                        <li
                                          key={airport.iataCode}
                                          className="cursor-pointer hover:bg-blue-50 p-2"
                                          onClick={() => {
                                            setSelectedOrigin(airport);
                                            field.onChange(airport.iataCode);
                                            setOriginQuery("");
                                          }}
                                        >
                                          <div className="font-semibold">
                                            {airport.iataCode} - {airport.name}
                                          </div>
                                          {airport.address && (
                                            <div className="text-sm text-muted-foreground">
                                              {airport.address.cityName}, {airport.address.countryName}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="p-2 text-center text-muted-foreground">
                                      No airports found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="destinationLocationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  placeholder="Search airports..."
                                  value={selectedDestination ? `${selectedDestination.iataCode} - ${selectedDestination.name}` : ""}
                                  onChange={(e) => {
                                    debouncedDestinationSearch(e.target.value);
                                    setSelectedDestination(null);
                                    field.onChange("");
                                  }}
                                  className="border-blue-200 focus:border-blue-500"
                                />
                              </FormControl>
                              {destinationQuery.length >= 2 && !selectedDestination && (
                                <div className="absolute z-10 mt-1 w-full bg-background rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
                                  {isLoadingDestinationAirports ? (
                                    <div className="p-2 text-center">
                                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                      Loading...
                                    </div>
                                  ) : destinationAirports?.length ? (
                                    <ul>
                                      {destinationAirports.map((airport: Airport) => (
                                        <li
                                          key={airport.iataCode}
                                          className="cursor-pointer hover:bg-blue-50 p-2"
                                          onClick={() => {
                                            setSelectedDestination(airport);
                                            field.onChange(airport.iataCode);
                                            setDestinationQuery("");
                                          }}
                                        >
                                          <div className="font-semibold">
                                            {airport.iataCode} - {airport.name}
                                          </div>
                                          {airport.address && (
                                            <div className="text-sm text-muted-foreground">
                                              {airport.address.cityName}, {airport.address.countryName}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="p-2 text-center text-muted-foreground">
                                      No airports found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Departure Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal border-blue-200 focus:border-blue-500",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="returnDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Return Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal border-blue-200 focus:border-blue-500",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    onClick={() => {
                                      if (!field.value) {
                                        const departureDate = form.getValues('departureDate');
                                        if (departureDate) {
                                          // Default to the day after departure
                                          const nextDay = new Date(departureDate);
                                          nextDay.setDate(nextDay.getDate() + 1);
                                          field.onChange(nextDay);
                                        }
                                      }
                                    }}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ?? undefined}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                  }}
                                  disabled={(date) => {
                                    const departureDate = form.getValues('departureDate');
                                    // Disable dates before departure date
                                    return departureDate ? date < departureDate : date < new Date();
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="adults"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passengers</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={9}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="border-blue-200 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="travelClass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                    <SelectValue placeholder="Select class" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ECONOMY">Economy</SelectItem>
                                  <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                                  <SelectItem value="BUSINESS">Business</SelectItem>
                                  <SelectItem value="FIRST">First</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        disabled={isSearching || flightSearchMutation.isPending}
                      >
                        {isSearching || flightSearchMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Searching...
                          </>
                        ) : (
                          'Search Flights'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:w-3/4">
              {isSearching && flightSearchMutation.isPending ? (
                <Card className="shadow-md">
                  <CardContent className="py-10">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
                      <p className="text-lg font-medium">Searching for flights...</p>
                      <p className="text-sm text-muted-foreground">This may take a moment</p>
                    </div>
                  </CardContent>
                </Card>
              ) : flightOffers.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center">
                      <span className="text-blue-600 mr-2">{selectedOrigin?.iataCode}</span> ⟶ 
                      <span className="text-blue-600 ml-2">{selectedDestination?.iataCode}</span>
                      <span className="ml-3 text-sm text-muted-foreground font-normal">
                        {form.getValues('departureDate') ? format(form.getValues('departureDate'), "MMM d, yyyy") : ""}
                        {form.getValues('returnDate') ? ` - ${format(form.getValues('returnDate'), "MMM d, yyyy")}` : ""}
                      </span>
                    </h2>
                    <div className="text-sm">
                      <span className="text-blue-600 font-medium">{flightOffers.length}</span> flights found
                    </div>
                  </div>
                  
                  {flightOffers.map((offer) => (
                    <Card key={offer.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border-0 mb-6">
                      <div className="flex flex-col md:flex-row">
                        {/* Left side with airline info */}
                        <div className="p-6 md:w-1/6 flex flex-row md:flex-col items-center md:justify-center md:border-r border-gray-100">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 md:mr-0 md:mb-3">
                            <span className="font-bold text-blue-600">{offer.validatingAirlineCodes[0]?.substring(0, 2)}</span>
                          </div>
                          <div className="text-sm text-center">
                            <div className="font-medium">{offer.validatingAirlineCodes.join(', ')}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "Economy"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Middle with flight details */}
                        <div className="px-8 py-6 md:w-3/6 border-t md:border-t-0">
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatDateTime(offer.itineraries[0].segments[0].departure.at)}
                              </div>
                              <div className="text-sm font-medium">{offer.itineraries[0].segments[0].departure.iataCode}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(offer.itineraries[0].segments[0].departure.at)}
                              </div>
                            </div>
                            
                            <div className="flex-1 px-6 text-center">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                {offer.itineraries[0].duration ? formatDuration(offer.itineraries[0].duration) : ""}
                              </div>
                              <div className="relative flex items-center">
                                <div className="h-0.5 flex-1 bg-blue-200"></div>
                                <div className="mx-2 w-2 h-2 rounded-full bg-blue-600"></div>
                                <div className="flex-1 h-0.5 bg-blue-200"></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 font-medium">
                                {offer.itineraries[0].segments.length > 1 
                                  ? `${offer.itineraries[0].segments.length - 1} stop(s)`
                                  : "Nonstop"
                                }
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatDateTime(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at)}
                              </div>
                              <div className="text-sm font-medium">{offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.iataCode}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Connection details */}
                          {offer.itineraries[0].segments.length > 1 && (
                            <div className="mt-3 text-xs text-gray-600">
                              <div className="flex flex-wrap gap-2 items-center justify-center">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">Stops in:</span>
                                {offer.itineraries[0].segments.slice(0, -1).map((segment, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium">
                                    {segment.arrival.iataCode}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Amenities */}
                          <div className="mt-4 flex justify-center gap-4 text-xs">
                            <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                              <Briefcase className="h-3 w-3 mr-1" />
                              <span className="font-medium">Carry-on included</span>
                            </div>
                            <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                              <Wifi className="h-3 w-3 mr-1" />
                              <span className="font-medium">In-flight Wi-Fi</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side with price and button */}
                        <div className="p-6 md:w-2/6 bg-blue-50 flex flex-row md:flex-col justify-between items-center">
                          <div className="text-center mb-0 md:mb-6">
                            <div className="text-3xl font-bold text-blue-600">
                              {offer.price.currency} {parseFloat(offer.price.total).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Round trip, {offer.travelerPricings.length} {offer.travelerPricings.length > 1 ? 'passengers' : 'passenger'}
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute -top-5 -right-4 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              5 seats left
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                              Select
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-md p-8">
                  <Plane className="h-16 w-16 text-blue-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search for flights</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Enter your departure and destination airports, travel dates, and other preferences to search for available flights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}