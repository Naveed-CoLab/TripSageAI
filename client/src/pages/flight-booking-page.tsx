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
      return await apiRequest('POST', '/api/flight-bookings', data);
    },
    onSuccess: () => {
      setCurrentStep(3); // Show success state
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
        setLocation("/login?redirect=flight-booking");
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
        }
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
                Edit Details
              </Button>
              
              <Button 
                type="button"
                onClick={() => onSubmit(form.getValues())}
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>Confirm and Pay</>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 3: // Success step
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your booking has been successfully confirmed. You'll receive a confirmation email shortly.
            </p>
            
            <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-lg border mb-6">
              <p className="text-sm font-medium">Booking Reference</p>
              <p className="text-xl font-bold">{`BK${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`}</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button onClick={() => setLocation("/profile/bookings")}>
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Return to Home
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
        {/* Progress steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
            <li className={`flex md:w-full items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <User className="w-5 h-5" />
              </span>
              <span className="hidden sm:inline-flex sm:ml-2">Fill in your info</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 sm:ml-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 5 4 4 6-8"/>
              </svg>
            </li>
            <li className={`flex md:w-full items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="hidden sm:inline-flex sm:ml-2">Confirm & pay</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 sm:ml-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 5 4 4 6-8"/>
              </svg>
            </li>
            <li className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <Check className="w-5 h-5" />
              </span>
              <span className="hidden sm:inline-flex sm:ml-2">Complete</span>
            </li>
          </ol>
        </div>
        
        {/* Title section */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 3 ? 'Booking Complete' : 'Complete Your Booking'}
          </h1>
          <p className="text-gray-600 mb-8">
            {currentStep === 1 && 'Enter passenger details to continue with your booking'}
            {currentStep === 2 && 'Review your booking details before confirming'}
            {currentStep === 3 && 'Your flight has been successfully booked'}
          </p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Left column: Form or confirmation */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && 'Passenger Details'}
                  {currentStep === 2 && 'Booking Review'}
                  {currentStep === 3 && 'Booking Complete'}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Please enter details for the traveler'}
                  {currentStep === 2 && 'Please review your information before proceeding'}
                  {currentStep === 3 && 'Your booking has been confirmed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column: Price details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Price Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Flight details */}
                {outboundFlight && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8">
                          <img
                            src={outboundFlight.airline.logo}
                            alt={outboundFlight.airline.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${outboundFlight.airline.name}&background=random`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{outboundFlight.airline.name}</p>
                          <p className="text-sm text-gray-500">{outboundFlight.flightNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-lg font-bold">{formatTime(outboundFlight.departureTime)}</p>
                          <p className="text-sm text-gray-600">{outboundFlight.departureAirport.code}</p>
                        </div>
                        <div className="text-sm text-gray-500 text-center">
                          <p>{outboundFlight.duration}</p>
                          <div className="w-16 h-px bg-gray-300 my-1 mx-auto"></div>
                          <p>{formatDate(outboundFlight.departureTime)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatTime(outboundFlight.arrivalTime)}</p>
                          <p className="text-sm text-gray-600">{outboundFlight.arrivalAirport.code}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Return flight if applicable */}
                    {returnFlight && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8">
                            <img
                              src={returnFlight.airline.logo}
                              alt={returnFlight.airline.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${returnFlight.airline.name}&background=random`;
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{returnFlight.airline.name}</p>
                            <p className="text-sm text-gray-500">{returnFlight.flightNumber}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <p className="text-lg font-bold">{formatTime(returnFlight.departureTime)}</p>
                            <p className="text-sm text-gray-600">{returnFlight.departureAirport.code}</p>
                          </div>
                          <div className="text-sm text-gray-500 text-center">
                            <p>{returnFlight.duration}</p>
                            <div className="w-16 h-px bg-gray-300 my-1 mx-auto"></div>
                            <p>{formatDate(returnFlight.departureTime)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatTime(returnFlight.arrivalTime)}</p>
                            <p className="text-sm text-gray-600">{returnFlight.arrivalAirport.code}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Price breakdown */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between mb-2">
                        <span>Outbound Flight</span>
                        <span>${outboundFlight.price}</span>
                      </div>
                      
                      {returnFlight && (
                        <div className="flex justify-between mb-2">
                          <span>Return Flight</span>
                          <span>${returnFlight.price}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between mb-2">
                        <span>Taxes & Fees</span>
                        <span>Included</span>
                      </div>
                      
                      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total</span>
                        <span>${calculateTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}