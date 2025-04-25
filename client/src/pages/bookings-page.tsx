import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plane, Calendar, Clock, MapPin, Users, CreditCard, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Link } from "wouter";

type FlightBooking = {
  id: number;
  userId: number;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  departureCode: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalCode: string;
  arrivalTime: string;
  tripType: string;
  returnFlightNumber: string | null;
  returnAirline: string | null;
  returnDepartureTime: string | null;
  returnArrivalTime: string | null;
  bookingReference: string;
  price: number;
  currency: string;
  status: string;
  cabinClass: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  flightDetails: any;
  createdAt: string;
};

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  
  const { data: bookings, isLoading, error } = useQuery<FlightBooking[]>({
    queryKey: ["/api/flight-bookings"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load bookings</h2>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          We encountered an error while loading your bookings. Please try again later.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 hover:bg-primary-700"
        >
          Retry
        </Button>
      </div>
    );
  }

  const filteredBookings = tab === "all" 
    ? bookings 
    : bookings?.filter(booking => booking.status.toLowerCase() === tab.toLowerCase());

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "h:mm a");
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatDate = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    try {
      const departure = new Date(departureTime);
      const arrival = new Date(arrivalTime);
      const durationMs = arrival.getTime() - departure.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return "Unknown duration";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage all your flight bookings in one place</p>
      </div>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="mb-8">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="all" className="text-sm">All Bookings</TabsTrigger>
          <TabsTrigger value="confirmed" className="text-sm">Confirmed</TabsTrigger>
          <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-sm">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredBookings?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <HelpCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            {tab === "all" 
              ? "You haven't made any flight bookings yet. Start by searching for flights to your destination." 
              : `You don't have any ${tab.toLowerCase()} bookings. Try checking the "All Bookings" tab.`}
          </p>
          <Link href="/flights">
            <Button>Search Flights</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings?.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-200 text-gray-800 font-bold h-10 w-10 rounded-md flex items-center justify-center mr-3">
                      {booking.airline.substring(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{booking.airline}</CardTitle>
                      <CardDescription className="text-xs">
                        Flight {booking.flightNumber} • {booking.cabinClass}
                      </CardDescription>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(booking.departureTime)}</div>
                    <div className="text-sm text-gray-500">{booking.departureCode}</div>
                  </div>
                  <div className="flex-1 px-4 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{formatDuration(booking.departureTime, booking.arrivalTime)}</div>
                    <div className="w-full flex items-center">
                      <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                      <div className="flex-1 h-[2px] bg-gray-300"></div>
                      <Plane className="h-4 w-4 text-primary-500 mx-1" />
                      <div className="flex-1 h-[2px] bg-gray-300"></div>
                      <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Direct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(booking.arrivalTime)}</div>
                    <div className="text-sm text-gray-500">{booking.arrivalCode}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Date</div>
                      <div className="text-sm text-gray-600">{formatDate(booking.departureTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm text-gray-600">{formatDuration(booking.departureTime, booking.arrivalTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">From</div>
                      <div className="text-sm text-gray-600">{booking.departureAirport}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">To</div>
                      <div className="text-sm text-gray-600">{booking.arrivalAirport}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Passenger</div>
                      <div className="text-sm text-gray-600">{booking.passengerName}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CreditCard className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Price</div>
                      <div className="text-sm text-gray-600">{booking.price} {booking.currency}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 -mx-6 -mb-6 p-4 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Booking Reference</div>
                    <div className="text-sm font-mono text-gray-700">{booking.bookingReference}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {booking.status === "CONFIRMED" && (
                      <Button size="sm" variant="default" className="text-white">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}