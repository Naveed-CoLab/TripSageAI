import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import MainLayout from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  location: z.string().min(2, "Location must be at least 2 characters"),
  checkInDate: z.date({
    required_error: "Check-in date is required",
  }),
  checkOutDate: z.date({
    required_error: "Check-out date is required",
  }).refine(date => date > new Date(), {
    message: "Check-out date must be in the future",
  }),
  guests: z.coerce.number().min(1, "At least 1 guest required").max(10, "Maximum 10 guests allowed"),
  rooms: z.coerce.number().min(1, "At least 1 room required").max(5, "Maximum 5 rooms allowed"),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date",
  path: ["checkOutDate"],
});

type FormValues = z.infer<typeof formSchema>;

function HotelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      guests: 1,
      rooms: 1,
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      setIsSearching(true);
      return await apiRequest("/api/hotels/search", "POST", {
        ...data,
        checkInDate: format(data.checkInDate, "yyyy-MM-dd"),
        checkOutDate: format(data.checkOutDate, "yyyy-MM-dd"),
      });
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  function onSubmit(data: FormValues) {
    searchMutation.mutate(data);
  }

  function handleBooking(hotel: any) {
    const searchData = form.getValues();
    const searchParams = new URLSearchParams();
    
    // Add parameters to URL
    searchParams.append("hotelId", hotel.id);
    searchParams.append("hotelName", hotel.name);
    searchParams.append("hotelAddress", hotel.address);
    searchParams.append("hotelCity", hotel.city);
    searchParams.append("hotelCountry", hotel.country);
    searchParams.append("hotelRating", hotel.rating.toString());
    searchParams.append("hotelImage", hotel.imageUrl);
    searchParams.append("checkInDate", format(searchData.checkInDate, "yyyy-MM-dd"));
    searchParams.append("checkOutDate", format(searchData.checkOutDate, "yyyy-MM-dd"));
    searchParams.append("guests", searchData.guests.toString());
    searchParams.append("rooms", searchData.rooms.toString());
    searchParams.append("price", hotel.price.toString());
    searchParams.append("currency", hotel.currency || "USD");
    
    // Always add a roomType, defaulting to the first one available or "Standard Room"
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      searchParams.append("roomType", hotel.roomTypes[0]);
    } else if (hotel.roomType) {
      searchParams.append("roomType", hotel.roomType);
    } else {
      searchParams.append("roomType", "Standard Room");
    }
    
    navigate(`/hotel-booking?${searchParams.toString()}`);
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Find your perfect hotel</h1>
          <p className="text-muted-foreground">Search for hotels by location, dates, and number of guests</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Hotels</CardTitle>
            <CardDescription>Enter your destination and travel dates</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination</FormLabel>
                          <FormControl>
                            <Input placeholder="City or Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Check-in Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
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
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Check-out Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const checkInDate = form.getValues("checkInDate");
                                return checkInDate && date < checkInDate;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="guests"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Guests</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={10} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rooms"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Rooms</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={5} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSearching} className="w-full md:w-auto">
                  {isSearching ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Hotels
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {searchResults && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">
              {searchResults.length > 0
                ? `${searchResults.length} hotels found`
                : "No hotels found"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden h-full flex flex-col">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={hotel.imageUrl}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{hotel.name}</CardTitle>
                    <CardDescription>
                      {hotel.city}, {hotel.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(hotel.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {hotel.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{hotel.address}</p>
                    <div className="mt-4">
                      <p className="text-xl font-bold">
                        {hotel.price} {hotel.currency}
                        <span className="text-sm font-normal text-muted-foreground"> / night</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Room types: {hotel.roomTypes.join(", ")}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleBooking(hotel)} 
                      className="w-full"
                    >
                      Book Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default HotelsPage;