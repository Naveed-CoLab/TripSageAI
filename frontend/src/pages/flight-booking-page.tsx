import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plane, Calendar, Clock, User, CreditCard, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Flight data types from flights page
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

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper function to format time
function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Define passenger info schema for form validation
const passengerSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
});

type PassengerFormValues = z.infer<typeof passengerSchema>;

export default function FlightBookingPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ outboundId: string; returnId?: string }>(
    "/flight-booking/:outboundId/:returnId?"
  );
  const { user } = useAuth();
  
  // State for flight data
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Confirm, 3: Success
  
  // Create form
  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      dateOfBirth: "",
      nationality: "",
      passportNumber: "",
    },
  });
  
  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/flight-bookings', 'POST', data);
    },
    onSuccess: () => {
      setCurrentStep(3); // Show success state
      // Invalidate bookings cache to refresh profile page
      queryClient.invalidateQueries({ queryKey: ['/api/flight-bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Load flight data from session storage on component mount
  useEffect(() => {
    // If no params, try to load from session storage
    if (!params?.outboundId) {
      const storedBookingData = sessionStorage.getItem('flightBookingData');
      if (storedBookingData) {
        try {
          const bookingData = JSON.parse(storedBookingData);
          setOutboundFlight(bookingData.outboundFlight);
          if (bookingData.returnFlight) {
            setReturnFlight(bookingData.returnFlight);
          }
          setLoading(false);
        } catch (error) {
          console.error('Error parsing flight data from session storage:', error);
          redirectToFlightsPage();
        }
      } else {
        redirectToFlightsPage();
      }
    } else {
      // In a real app, we'd fetch the flight data from API using the IDs
      const storedFlights = sessionStorage.getItem('flightSearchResults');
      if (storedFlights) {
        try {
          const { outboundFlights, returnFlights } = JSON.parse(storedFlights);
          
          // Find the selected outbound flight
          const outbound = outboundFlights.find((f: Flight) => f.id === params.outboundId);
          
          if (outbound) {
            setOutboundFlight(outbound);
            
            // If there's a return flight ID, find that as well
            if (params.returnId && returnFlights) {
              const returnF = returnFlights.find((f: Flight) => f.id === params.returnId);
              if (returnF) {
                setReturnFlight(returnF);
              }
            }
            
            // Save to session storage for persistence
            sessionStorage.setItem('flightBookingData', JSON.stringify({
              outboundFlight: outbound,
              returnFlight: params.returnId ? returnFlights.find((f: Flight) => f.id === params.returnId) : null
            }));
            
            setLoading(false);
          } else {
            redirectToFlightsPage();
          }
        } catch (error) {
          console.error('Error parsing flight search results:', error);
          redirectToFlightsPage();
        }
      } else {
        redirectToFlightsPage();
      }
    }
  }, [params]);
  
  // Helper function to redirect back to flights page
  const redirectToFlightsPage = () => {
    toast({
      title: "Error",
      description: "Could not find flight details. Please search again.",
      variant: "destructive",
    });
    setLocation("/flights");
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    let total = outboundFlight?.price || 0;
    if (returnFlight) {
      total += returnFlight.price;
    }
    return total;
  };
  
  // Form submission handler
  const onSubmit = (data: PassengerFormValues) => {
    if (currentStep === 1) {
      // Move to confirmation step
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // If no user is logged in, require login first
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please login or register to complete your booking.",
          variant: "default",
        });
        // Save booking data in session storage
        sessionStorage.setItem('pendingBooking', JSON.stringify({
          passengerData: data,
          outboundFlight,
          returnFlight
        }));
        setLocation("/auth?redirect=flight-booking");
        return;
      }
      
      // Proceed with booking
      if (!outboundFlight) {
        toast({
          title: "Booking Error",
          description: "No flight selected for booking.",
          variant: "destructive",
        });
        return;
      }
      
      // Create booking record
      const bookingData = {
        userId: user.id,
        flightNumber: outboundFlight.flightNumber,
        airline: outboundFlight.airline.name,
        departureAirport: outboundFlight.departureAirport.name,
        departureCode: outboundFlight.departureAirport.code,
        departureTime: outboundFlight.departureTime,
        arrivalAirport: outboundFlight.arrivalAirport.name,
        arrivalCode: outboundFlight.arrivalAirport.code,
        arrivalTime: outboundFlight.arrivalTime,
        tripType: returnFlight ? "ROUND_TRIP" : "ONE_WAY",
        returnFlightNumber: returnFlight?.flightNumber,
        returnAirline: returnFlight?.airline.name,
        returnDepartureTime: returnFlight?.departureTime,
        returnArrivalTime: returnFlight?.arrivalTime,
        bookingReference: `BK${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        price: calculateTotalPrice(),
        currency: outboundFlight.currency,
        cabinClass: outboundFlight.cabinClass,
        passengerName: `${data.firstName} ${data.lastName}`,
        passengerEmail: data.email,
        passengerPhone: data.phone,
        flightDetails: {
          passportNumber: data.passportNumber,
          nationality: data.nationality,
          dateOfBirth: data.dateOfBirth,
        },
        status: "CONFIRMED"
      };
      
      // Submit booking
      bookingMutation.mutate(bookingData);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold">Loading your booking details...</h2>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Render flight card
  const renderFlightCard = (flight: Flight | null, isReturn: boolean = false) => {
    if (!flight) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
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
          <div className="text-right">
            <div className="text-xs text-gray-500">{isReturn ? "Return" : "Outbound"}</div>
            <div className="text-sm font-medium">{formatDate(flight.departureTime)}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="text-lg font-bold">{formatTime(flight.departureTime)}</div>
            <div className="text-sm text-gray-600">{flight.departureAirport.code}</div>
            <div className="text-xs text-gray-500">{flight.departureAirport.city}</div>
          </div>
          
          <div className="flex flex-col items-center px-4">
            <div className="text-xs text-gray-500">{flight.duration}</div>
            <div className="w-24 sm:w-32 md:w-40 flex items-center">
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
          
          <div className="text-right">
            <div className="text-lg font-bold">{formatTime(flight.arrivalTime)}</div>
            <div className="text-sm text-gray-600">{flight.arrivalAirport.code}</div>
            <div className="text-xs text-gray-500">{flight.arrivalAirport.city}</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Show appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Passenger details form
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Passport Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your passport number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Required for international flights. You can add this later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation("/flights")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Flights
                  </Button>
                  
                  <Button type="submit">
                    Continue to Review
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        );
        
      case 2: // Confirmation step
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Passenger Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{form.getValues("firstName")} {form.getValues("lastName")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{form.getValues("email")}</p>
                  <p className="font-medium">{form.getValues("phone")}</p>
                </div>
                {form.getValues("passportNumber") && (
                  <div>
                    <p className="text-sm text-gray-500">Passport</p>
                    <p className="font-medium">{form.getValues("passportNumber")}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Passenger Info
              </Button>
              
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={bookingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bookingMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⊝</span>
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </div>
        );
        
      case 3: // Success step
        return (
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for your booking. Your confirmation has been sent to your email.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6 inline-block">
              <p className="text-sm text-gray-500">Booking Reference</p>
              <p className="text-xl font-mono font-bold tracking-wider">
                {`BK${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button onClick={() => setLocation("/profile/flights")}>
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => setLocation("/flights")}>
                Book Another Flight
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Complete Your Booking</h1>
          <p className="text-gray-600">
            {currentStep === 1 && "Enter passenger information to continue with your booking."}
            {currentStep === 2 && "Please review your booking details before confirming."}
            {currentStep === 3 && "Your booking has been confirmed. Safe travels!"}
          </p>
        </div>
        
        {/* Progress indicators */}
        {currentStep < 3 && (
          <div className="mb-8 flex justify-between relative">
            <div className="w-full h-1 bg-gray-200 absolute top-4 z-0"></div>
            <div 
              className="h-1 bg-blue-500 absolute top-4 z-0"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            ></div>
            
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                1
              </div>
              <span className="text-sm mt-1">Passenger Info</span>
            </div>
            
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                2
              </div>
              <span className="text-sm mt-1">Review & Confirm</span>
            </div>
            
            <div className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                3
              </div>
              <span className="text-sm mt-1">Booking Complete</span>
            </div>
          </div>
        )}
        
        {/* Two-column layout for booking content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Flight details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Passenger Information"}
                  {currentStep === 2 && "Review Booking"}
                  {currentStep === 3 && "Booking Confirmed"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Please enter your details below"}
                  {currentStep === 2 && "Please review the details of your booking"}
                  {currentStep === 3 && "Your booking has been confirmed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Price summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">FLIGHTS</h3>
                  {renderFlightCard(outboundFlight)}
                  {returnFlight && renderFlightCard(returnFlight, true)}
                </div>
                
                {/* Passenger details */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">PASSENGERS</h3>
                  <div className="text-sm">1 Adult</div>
                </div>
                
                {/* Price breakdown */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">PRICE DETAILS</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Outbound Flight</span>
                      <span className="text-sm font-medium">${outboundFlight?.price || 0}</span>
                    </div>
                    
                    {returnFlight && (
                      <div className="flex justify-between">
                        <span className="text-sm">Return Flight</span>
                        <span className="text-sm font-medium">${returnFlight?.price || 0}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Taxes & Fees</span>
                      <span className="text-sm font-medium">Included</span>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="text-base font-bold">Total</span>
                      <span className="text-base font-bold">${calculateTotalPrice()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Additional information */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">INCLUDES</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <ShieldCheck className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Free cancellation up to 24h before departure</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Personalized customer service</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Secure payment</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}