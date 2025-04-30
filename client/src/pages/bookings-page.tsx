import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import {
  Plane,
  BedDouble,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  Bookmark,
  HelpCircle,
  Building,
  Check,
  X,
  AlertCircle,
  Clock8,
} from "lucide-react";

interface FlightBooking {
  id: number;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  departureCode: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalCode: string;
  arrivalTime: string;
  tripType: string;
  returnFlightNumber?: string;
  returnAirline?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  bookingReference: string;
  price: string;
  currency: string;
  status: string;
  cabinClass: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  flightDetails?: any;
}

interface HotelBooking {
  id: number;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  hotelAddress?: string;
  hotelStars?: number;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  guestCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  bookingReference: string;
  price: string;
  currency: string;
  status: string;
  specialRequests?: string;
}

export default function BookingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("all");
  const [bookingType, setBookingType] = useState<"all" | "flights" | "hotels">("all");
  const [, navigate] = useLocation();

  const { data: flightBookings, isLoading: isLoadingFlightBookings } = useQuery<FlightBooking[]>({
    queryKey: ["/api/flight-bookings"],
    queryFn: getQueryFn({ baseURL: "" }),
  });

  const { data: hotelBookings, isLoading: isLoadingHotelBookings } = useQuery<HotelBooking[]>({
    queryKey: ["/api/hotel-bookings"],
    queryFn: getQueryFn({ baseURL: "" }),
  });

  const hasFlightBookings = flightBookings && flightBookings.length > 0;
  const hasHotelBookings = hotelBookings && hotelBookings.length > 0;
  const hasNoBookings = !isLoadingFlightBookings && !isLoadingHotelBookings && !hasFlightBookings && !hasHotelBookings;

  const filteredFlightBookings = React.useMemo(() => {
    if (!flightBookings) return [];
    if (tab === "all") return flightBookings;
    
    return flightBookings.filter(booking => 
      booking.status.toUpperCase() === tab.toUpperCase()
    );
  }, [flightBookings, tab]);

  const filteredHotelBookings = React.useMemo(() => {
    if (!hotelBookings) return [];
    if (tab === "all") return hotelBookings;
    
    return hotelBookings.filter(booking => 
      booking.status.toUpperCase() === tab.toUpperCase()
    );
  }, [hotelBookings, tab]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    if (!departureTime || !arrivalTime) return '';
    
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    
    const diffMs = Math.abs(arrival.getTime() - departure.getTime());
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };
  
  const nightsStay = (checkInDate: string, checkOutDate: string) => {
    if (!checkInDate || !checkOutDate) return '';
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} ${diffDays === 1 ? 'night' : 'nights'}`;
  };

  const getStatusBadge = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    
    if (uppercaseStatus === "PENDING") {
      return (
        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1">
          <Clock8 className="h-3 w-3" />
          Pending
        </Badge>
      );
    } else if (uppercaseStatus === "PROCESSING") {
      return (
        <Badge className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Processing
        </Badge>
      );
    } else if (uppercaseStatus === "CONFIRMED") {
      return (
        <Badge className="bg-[#15be53] text-white hover:bg-[#13a749] flex items-center gap-1">
          <Check className="h-3 w-3" />
          Confirmed
        </Badge>
      );
    } else if (uppercaseStatus === "CANCELLED") {
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-1">
          <X className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-1">
          {status}
        </Badge>
      );
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
                <CardTitle className="text-lg">{booking.airline}</CardTitle>
                <CardDescription>
                  Flight {booking.flightNumber}
                </CardDescription>
              </div>
            </div>
            <div>
              {booking.status.toUpperCase() === "CONFIRMED" ? (
                <Badge className="bg-[#15be53] text-white hover:bg-[#13a749] flex items-center gap-1">
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
                <CardDescription>
                  <div className="text-xs flex items-center gap-1 mb-1">
                    {Array.from({ length: booking.hotelStars || 0 }).map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                    {booking.hotelStars ? ` • ${booking.roomType}` : booking.roomType}
                  </div>
                </CardDescription>
              </div>
            </div>
            <div>
              {booking.status.toUpperCase() === "CONFIRMED" ? (
                <Badge className="bg-[#15be53] text-white hover:bg-[#13a749] flex items-center gap-1">
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
                  {booking.hotelCity || "City"}, {booking.hotelCountry || "Country"}
                </div>
                {booking.hotelAddress && <div className="text-xs text-gray-500">{booking.hotelAddress}</div>}
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
    <MainLayout>
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
                    <h2 className="text-xl font-semibold text-gray-900">Hotel Bookings</h2>
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
    </MainLayout>
  );
}