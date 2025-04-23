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
import { Loader2, Calendar, Plane, ArrowRightIcon, Luggage, Users } from "lucide-react";
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
      
      const response = await apiRequest("POST", "/api/flights/search", formattedData);
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
    return `${format(date, "MMM d")}, ${format(date, "HH:mm")}`;
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Flight Search</h1>
        <p className="text-muted-foreground mb-6">Find the best flights for your trip</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Search Flights</CardTitle>
                <CardDescription>Enter your flight details</CardDescription>
              </CardHeader>
              <CardContent>
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
                                        className="cursor-pointer hover:bg-accent p-2"
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
                                        className="cursor-pointer hover:bg-accent p-2"
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
                                    "w-full pl-3 text-left font-normal",
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
                                    "w-full pl-3 text-left font-normal",
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
                                <SelectTrigger>
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
                    
                    <Button type="submit" className="w-full" disabled={isSearching || flightSearchMutation.isPending}>
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
          
          <div className="lg:col-span-3">
            {isSearching && flightSearchMutation.isPending ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                    <p className="text-lg font-medium">Searching for flights...</p>
                    <p className="text-sm text-muted-foreground">This may take a moment</p>
                  </div>
                </CardContent>
              </Card>
            ) : flightOffers.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-lg shadow-sm mb-4">
                  <h2 className="text-xl font-semibold">
                    {flightOffers.length} Flight{flightOffers.length !== 1 && 's'} Found
                  </h2>
                </div>
                
                {flightOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">{selectedOrigin?.iataCode} to {selectedDestination?.iataCode}</CardTitle>
                          <CardDescription>
                            {offer.itineraries.length > 1 ? 'Round trip' : 'One way'} • {offer.travelerPricings.length} passenger{offer.travelerPricings.length !== 1 && 's'}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">
                            {offer.price.currency} {parseFloat(offer.price.total).toFixed(2)}
                          </span>
                          <CardDescription>
                            Total price
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      {offer.itineraries.map((itinerary, itineraryIndex) => (
                        <div key={itineraryIndex} className="mb-4">
                          <div className="flex items-center mb-2">
                            <div className="font-semibold">
                              {itineraryIndex === 0 ? 'Outbound' : 'Return'} • {itinerary.duration ? formatDuration(itinerary.duration) : ''}
                            </div>
                            {itineraryIndex === 0 && offer.itineraries.length > 1 && (
                              <Separator className="flex-1 mx-2" />
                            )}
                          </div>
                          
                          {itinerary.segments.map((segment, segmentIndex) => (
                            <div key={segmentIndex} className="mb-3">
                              <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-4">
                                  <div className="text-xl font-semibold">{formatDateTime(segment.departure.at)}</div>
                                  <div>{segment.departure.iataCode} {segment.departure.terminal && `Terminal ${segment.departure.terminal}`}</div>
                                </div>
                                
                                <div className="col-span-4 flex flex-col items-center justify-center">
                                  <div className="text-xs text-muted-foreground">
                                    {formatDuration(segment.duration)}
                                  </div>
                                  <div className="w-full flex items-center">
                                    <div className="h-0.5 flex-1 bg-muted"></div>
                                    <ArrowRightIcon className="h-4 w-4 mx-1" />
                                    <div className="h-0.5 flex-1 bg-muted"></div>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {segment.carrierCode} {segment.number}
                                  </div>
                                </div>
                                
                                <div className="col-span-4 text-right">
                                  <div className="text-xl font-semibold">{formatDateTime(segment.arrival.at)}</div>
                                  <div>{segment.arrival.iataCode} {segment.arrival.terminal && `Terminal ${segment.arrival.terminal}`}</div>
                                </div>
                              </div>
                              
                              {segmentIndex < itinerary.segments.length - 1 && (
                                <div className="my-2 pl-4 border-l-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
                                  Connection time: 
                                  {(() => {
                                    const arrivalTime = new Date(segment.arrival.at);
                                    const departureTime = new Date(itinerary.segments[segmentIndex + 1].departure.at);
                                    const diffMs = departureTime.getTime() - arrivalTime.getTime();
                                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                    return ` ${diffHrs}h ${diffMins}m`;
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                          {offer.travelerPricings[0].fareDetailsBySegment.map((fareDetail, index) => (
                            <div key={index} className="text-sm px-2 py-1 bg-accent rounded-full flex items-center">
                              <Luggage className="h-3 w-3 mr-1" />
                              {fareDetail.cabin}
                            </div>
                          ))}
                          <div className="text-sm px-2 py-1 bg-accent rounded-full flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {offer.travelerPricings.length} passenger{offer.travelerPricings.length !== 1 && 's'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-muted/30 flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Operated by: {offer.validatingAirlineCodes.join(', ')}
                      </div>
                      <Button>
                        Select this flight
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg p-8">
                <Plane className="h-16 w-16 text-muted-foreground mb-4" />
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
  );
}