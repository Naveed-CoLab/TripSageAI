import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CardContent, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Form validation schema
const formSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestEmail: z.string().email("Please enter a valid email"),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function HotelBookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nights, setNights] = useState(0);

  // Parse query params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data: Record<string, any> = {};
    
    // Extract all query parameters
    params.forEach((value, key) => {
      data[key] = value;
    });
    
    if (
      !data.hotelId ||
      !data.hotelName ||
      !data.checkInDate ||
      !data.checkOutDate ||
      !data.price
    ) {
      toast({
        title: "Missing booking information",
        description: "Some required booking details are missing. Please try again.",
        variant: "destructive",
      });
      navigate("/hotels");
      return;
    }
    
    // Calculate number of nights
    try {
      const checkIn = parseISO(data.checkInDate);
      const checkOut = parseISO(data.checkOutDate);
      const nightCount = differenceInDays(checkOut, checkIn);
      setNights(nightCount);
    } catch (error) {
      console.error("Error calculating nights:", error);
      setNights(1); // Default to 1 night if there's an error
    }
    
    setBookingData(data);
    setLoading(false);
  }, [location, navigate, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.username || "",
      guestEmail: user?.email || "",
      guestPhone: "",
      specialRequests: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      // Create complete request data with all required fields
      const requestData = {
        ...bookingData,
        ...formData,
        userId: user?.id,
        price: parseFloat(bookingData.price),
        guests: parseInt(bookingData.guests),
        rooms: parseInt(bookingData.rooms),
        hotelRating: parseFloat(bookingData.hotelRating),
        roomType: bookingData.roomType || "Standard Room", // Ensure roomType is set
      };
      
      console.log("Sending booking data:", JSON.stringify(requestData, null, 2));
      return await apiRequest("/api/hotel-bookings", "POST", requestData);
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed!",
        description: "Your hotel booking has been confirmed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      navigate("/bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    bookingMutation.mutate(data);
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const totalPrice = parseFloat(bookingData.price) * nights * parseInt(bookingData.rooms);

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Confirm Your Booking</h1>
          <p className="text-muted-foreground">
            Review and complete your hotel reservation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
                <CardDescription>
                  Please provide your contact details for this reservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guestEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 555 123 4567" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special requests or preferences" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingData.hotelImage && (
                  <div className="mb-4 overflow-hidden rounded-md">
                    <img
                      src={bookingData.hotelImage}
                      alt={bookingData.hotelName}
                      className="h-[200px] w-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold">{bookingData.hotelName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.hotelAddress}, {bookingData.hotelCity}, {bookingData.hotelCountry}
                  </p>
                  
                  {bookingData.hotelRating && (
                    <div className="flex items-center mt-2 space-x-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(parseFloat(bookingData.hotelRating))
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
                      <span className="text-sm">
                        {parseFloat(bookingData.hotelRating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Check-in:</span>
                    <span>{format(parseISO(bookingData.checkInDate), "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Check-out:</span>
                    <span>{format(parseISO(bookingData.checkOutDate), "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Nights:</span>
                    <span>{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Guests:</span>
                    <span>{bookingData.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Rooms:</span>
                    <span>{bookingData.rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Room Type:</span>
                    <span>{bookingData.roomType || "Standard"}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per night</span>
                    <span>
                      {bookingData.price} {bookingData.currency || "USD"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {bookingData.price} x {nights} nights x {bookingData.rooms} rooms
                    </span>
                    <span>
                      {totalPrice.toFixed(2)} {bookingData.currency || "USD"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      {totalPrice.toFixed(2)} {bookingData.currency || "USD"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <p>
                  * Cancellation policy: Free cancellation up to 24 hours before check-in.
                </p>
                <p>
                  * Payment will be processed after confirmation.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default HotelBookingPage;