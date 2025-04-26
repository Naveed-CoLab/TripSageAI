import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Plane, Calendar, Clock, MapPin, Users, CreditCard, CheckCircle, 
  AlertCircle, HelpCircle, Building, Bookmark, BedDouble, Home,
  Check, X
} from "lucide-react";
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

type HotelBooking = {
  id: number;
  userId: number;
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelCountry: string;
  hotelStars: number;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  nightsCount: number;
  bookingReference: string;
  price: number;
  currency: string;
  status: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelDetails: any;
  createdAt: string;
};

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [bookingType, setBookingType] = useState<"all" | "flights" | "hotels">("all");
  
  const { data: flightBookings, isLoading: isLoadingFlights, error: flightError } = useQuery<FlightBooking[]>({
    queryKey: ["/api/flight-bookings"],
    enabled: !!user
  });
  
  const { data: hotelBookings, isLoading: isLoadingHotels, error: hotelError } = useQuery<HotelBooking[]>({
    queryKey: ["/api/hotel-bookings"],
    enabled: !!user
  });

  // Handle combined loading state
  if (isLoadingFlights || isLoadingHotels) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  // Handle error states
  if (flightError && hotelError) {
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

  // Get all bookings or filter by status
  const filteredFlightBookings = tab === "all" 
    ? flightBookings 
    : flightBookings?.filter(booking => booking.status.toLowerCase() === tab.toLowerCase());
    
  const filteredHotelBookings = tab === "all" 
    ? hotelBookings 
    : hotelBookings?.filter(booking => booking.status.toLowerCase() === tab.toLowerCase());
    
  // Combine all bookings when type is "all"
  const hasFlightBookings = filteredFlightBookings && filteredFlightBookings.length > 0;
  const hasHotelBookings = filteredHotelBookings && filteredHotelBookings.length > 0;
  const hasNoBookings = (!hasFlightBookings && !hasHotelBookings);

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

  const parseDate = (dateTimeStr: string) => {
    try {
      // Try parsing as ISO date first
      if (dateTimeStr.includes('T') || dateTimeStr.includes('-')) {
        return new Date(dateTimeStr);
      } else {
        // Try parsing as a timestamp (assuming ms)
        return new Date(parseInt(dateTimeStr));
      }
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = parseDate(dateTimeStr);
      if (!date || isNaN(date.getTime())) {
        return dateTimeStr;
      }
      return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {
      console.error('Error formatting datetime:', e);
      return dateTimeStr;
    }
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = parseDate(dateTimeStr);
      if (!date || isNaN(date.getTime())) {
        return dateTimeStr;
      }
      return format(date, "h:mm a");
    } catch (e) {
      console.error('Error formatting time:', e);
      return dateTimeStr;
    }
  };

  const formatDate = (dateTimeStr: string) => {
    try {
      const date = parseDate(dateTimeStr);
      if (!date || isNaN(date.getTime())) {
        return dateTimeStr;
      }
      return format(date, "MMM d, yyyy");
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateTimeStr;
    }
  };

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    try {
      const departure = parseDate(departureTime);
      const arrival = parseDate(arrivalTime);
      
      // Validate dates are valid before calculating
      if (!departure || !arrival || isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
        console.log('Invalid date format:', { departureTime, arrivalTime });
        return "Unknown";
      }
      
      const durationMs = arrival.getTime() - departure.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      console.error('Error formatting duration:', e);
      return "Unknown";
    }
  };

  const nightsStay = (checkInDate: string, checkOutDate: string) => {
    try {
      const checkIn = parseDate(checkInDate);
      const checkOut = parseDate(checkOutDate);
      
      if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return "Unknown";
      }
      
      const durationMs = checkOut.getTime() - checkIn.getTime();
      const nights = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      return nights === 1 ? `${nights} Night` : `${nights} Nights`;
    } catch (e) {
      console.error('Error calculating nights stay:', e);
      return "Unknown";
    }
  };
  
  const renderFlightCard = (booking: FlightBooking) => {
    return (
      <Card key={booking.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-blue-50 border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 font-bold h-10 w-10 rounded-md flex items-center justify-center mr-3">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{booking.airline || "Flight Booking"}</CardTitle>
                <CardDescription className="text-xs">
                  Flight {booking.flightNumber} • {booking.cabinClass}
                </CardDescription>
              </div>
            </div>
            <div>
              {booking.status.toUpperCase() === "CONFIRMED" ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Confirmed
                </Badge>
              ) : booking.status.toUpperCase() === "REJECTED" ? (
                <Badge className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Rejected
                </Badge>
              ) : (
                getStatusBadge(booking.status)
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-4 bg-blue-50 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{formatTime(booking.departureTime)}</div>
              <div className="text-sm text-gray-500">{booking.departureCode}</div>
            </div>
            <div className="flex-1 px-4 flex flex-col items-center">
              <div className="text-xs text-blue-600 font-semibold mb-1">{formatDuration(booking.departureTime, booking.arrivalTime)}</div>
              <div className="w-full flex items-center">
                <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                <div className="flex-1 h-[2px] bg-blue-300"></div>
                <Plane className="h-4 w-4 text-blue-600 mx-1" />
                <div className="flex-1 h-[2px] bg-blue-300"></div>
                <div className="h-1 w-1 rounded-full bg-blue-600"></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Direct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{formatTime(booking.arrivalTime)}</div>
              <div className="text-sm text-gray-500">{booking.arrivalCode}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Date</div>
                <div className="text-sm text-gray-600">{formatDate(booking.departureTime)}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-sm text-gray-600">{formatDuration(booking.departureTime, booking.arrivalTime)}</div>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">From</div>
                <div className="text-sm text-gray-600">{booking.departureAirport}</div>
                <div className="text-xs text-gray-500">{booking.departureCode}</div>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">To</div>
                <div className="text-sm text-gray-600">{booking.arrivalAirport}</div>
                <div className="text-xs text-gray-500">{booking.arrivalCode}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Passenger</div>
                <div className="text-sm text-gray-600">{booking.passengerName}</div>
                {booking.passengerEmail && <div className="text-xs text-gray-500">{booking.passengerEmail}</div>}
              </div>
            </div>
            <div className="flex items-start">
              <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Price</div>
                <div className="text-sm text-gray-600 font-semibold">{booking.price} {booking.currency}</div>
                <div className="text-xs text-gray-500">{booking.cabinClass}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 -mx-6 -mb-6 p-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Booking Reference</div>
              <div className="text-sm font-mono text-blue-600 font-bold">{booking.bookingReference}</div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                View Details
              </Button>
              {booking.status.toUpperCase() === "CONFIRMED" && (
                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Check In
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderHotelCard = (booking: HotelBooking) => {
    return (
      <Card key={booking.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-blue-50 border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 font-bold h-10 w-10 rounded-md flex items-center justify-center mr-3">
                <BedDouble className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{booking.hotelName || "Hotel Booking"}</CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  {Array.from({ length: booking.hotelStars || 0 }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                  {booking.hotelStars ? ` • ${booking.roomType}` : booking.roomType}
                </CardDescription>
              </div>
            </div>
            <div>
              {booking.status.toUpperCase() === "CONFIRMED" ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Confirmed
                </Badge>
              ) : booking.status.toUpperCase() === "REJECTED" ? (
                <Badge className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Rejected
                </Badge>
              ) : (
                getStatusBadge(booking.status)
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4 bg-blue-50 rounded-md p-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <div className="text-sm font-medium">{formatDate(booking.checkInDate)}</div>
                <div className="text-xs text-gray-500">Check-in</div>
              </div>
            </div>
            <div className="text-xs text-blue-600 px-3 font-semibold">{nightsStay(booking.checkInDate, booking.checkOutDate)}</div>
            <div className="flex items-center">
              <div>
                <div className="text-sm font-medium text-right">{formatDate(booking.checkOutDate)}</div>
                <div className="text-xs text-gray-500 text-right">Check-out</div>
              </div>
              <Calendar className="h-5 w-5 text-blue-500 ml-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start">
              <Building className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Location</div>
                <div className="text-sm text-gray-600">
                  {booking.hotelAddress && <div className="text-xs text-gray-500">{booking.hotelAddress}</div>}
                  {booking.hotelCity || "City"}, {booking.hotelCountry || "Country"}
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <BedDouble className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Room & Guests</div>
                <div className="text-sm text-gray-600">
                  {booking.roomType || "Standard Room"}
                  <div className="text-xs text-gray-500">
                    {booking.nightsCount} {booking.nightsCount === 1 ? 'Night' : 'Nights'} • 
                    {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Guest Name</div>
                <div className="text-sm text-gray-600">{booking.guestName || "Guest"}</div>
                {booking.guestEmail && <div className="text-xs text-gray-500">{booking.guestEmail}</div>}
              </div>
            </div>
            <div className="flex items-start">
              <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">Price</div>
                <div className="text-sm text-gray-600 font-semibold">{booking.price} {booking.currency}</div>
                <div className="text-xs text-gray-500">Total for {booking.nightsCount} {booking.nightsCount === 1 ? 'night' : 'nights'}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 -mx-6 -mb-6 p-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Booking Reference</div>
              <div className="text-sm font-mono text-blue-600 font-bold">{booking.bookingReference}</div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                View Details
              </Button>
              {booking.status.toUpperCase() === "CONFIRMED" && (
                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Bookmark className="mr-1 h-4 w-4" />
                  View Voucher
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage all your travel bookings in one place</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="mb-2 md:mb-0">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
            <TabsTrigger value="confirmed" className="text-sm">Confirmed</TabsTrigger>
            <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-sm">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Tabs defaultValue="all" value={bookingType} onValueChange={(value) => setBookingType(value as "all" | "flights" | "hotels")}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <span className="hidden md:inline">All Types</span>
              <span className="md:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-1">
              <Plane className="h-4 w-4" />
              <span className="hidden md:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" />
              <span className="hidden md:inline">Hotels</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {hasNoBookings || (!flightBookings?.length && !hotelBookings?.length) ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <HelpCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            {tab === "all" 
              ? "You haven't made any bookings yet. Start by searching for flights or hotels."
              : `You don't have any ${tab.toLowerCase()} bookings. Try checking the "All Bookings" tab.`}
          </p>
          <div className="flex gap-4">
            <Link href="/flights">
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Search Flights
              </Button>
            </Link>
            <Link href="/hotels">
              <Button variant="outline" className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Search Hotels
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Flight Bookings Section */}
          {(hasFlightBookings && (bookingType === "all" || bookingType === "flights")) && (
            <div className="mb-8">
              {bookingType === "all" && (
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Flight Bookings</h2>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFlightBookings?.map(renderFlightCard)}
              </div>
            </div>
          )}
          
          {/* Hotel Bookings Section */}
          {(hasHotelBookings && (bookingType === "all" || bookingType === "hotels")) && (
            <div>
              {bookingType === "all" && (
                <div className="flex items-center gap-2 mb-4">
                  <BedDouble className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Hotel Bookings</h2>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredHotelBookings?.map(renderHotelCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}