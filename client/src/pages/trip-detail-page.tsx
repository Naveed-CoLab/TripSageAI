import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { 
  User, Pencil, Calendar, DollarSign, Share2, Loader2, PlusCircle, Map, 
  Heart, Info, ExternalLink, MoreHorizontal, MapPin, Star, Clock, Coffee,
  Utensils, Hotel, Camera, Landmark, Plane, Plus, Building, Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import ItineraryDay from "@/components/trips/itinerary-day";
import BookingCard from "@/components/trips/booking-card";

// Activity type definition
type Activity = {
  title: string;
  description?: string;
  time?: string;
  location?: string;
  type?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  city?: string;
};

// Day type definition
type Day = {
  dayNumber: number;
  title: string;
  date?: string | Date;
  activities: Activity[];
  image?: string;
  city?: string;
};

// Booking type definition
type Booking = {
  type: string;
  title: string;
  provider?: string;
  price?: string;
  details?: any;
  image?: string;
  rating?: number;
  reviewCount?: number;
};

type TripWithDetails = {
  id: number;
  userId: number;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  preferences: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  days: Day[]; // Itinerary days
  bookings: Booking[]; // Trip bookings
  createdAt: string;
  updatedAt: string;
  days: {
    id: number;
    tripId: number;
    dayNumber: number;
    date: string | null;
    title: string;
    activities: {
      id: number;
      tripDayId: number;
      title: string;
      description: string | null;
      time: string | null;
      location: string | null;
      type: string | null;
    }[];
  }[];
  bookings: {
    id: number;
    tripId: number;
    type: string;
    title: string;
    provider: string | null;
    price: string | null;
    details: any;
    confirmed: boolean;
  }[];
};

// Helper function to get the URL for a place in Google Maps
const getGoogleMapsUrl = (place: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
};

// Format time string (e.g., "9:00 AM")
const formatTimeString = (time: string | null) => {
  if (!time) return null;
  
  // Check if time is already in AM/PM format
  if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) {
    return time;
  }
  
  // Try to parse 24-hour format (e.g., "14:00")
  const hourMatch = time.match(/^(\d{1,2}):?(\d{2})?/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1]);
    const minute = hourMatch[2] ? parseInt(hourMatch[2]) : 0;
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }
  
  return time;
};

// Get icon component based on activity type
const getActivityIcon = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case 'transportation':
    case 'flight':
    case 'transit':
      return <Plane className="h-4 w-4 text-blue-600" />;
    case 'accommodation':
    case 'hotel':
    case 'lodging':
      return <Hotel className="h-4 w-4 text-green-600" />;
    case 'meal':
    case 'food':
    case 'restaurant':
      return <Utensils className="h-4 w-4 text-yellow-600" />;
    case 'sightseeing':
    case 'tour':
      return <Camera className="h-4 w-4 text-purple-600" />;
    case 'coffee':
    case 'breakfast':
      return <Coffee className="h-4 w-4 text-red-600" />;
    case 'attraction':
    case 'monument':
      return <Landmark className="h-4 w-4 text-purple-600" />;
    case 'shopping':
      return <Building className="h-4 w-4 text-indigo-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

// Function to generate a placeholder image for a location
const getPlaceholderImage = (location: string) => {
  const baseUrl = "https://source.unsplash.com/featured/";
  const keywords = encodeURIComponent(location);
  return `${baseUrl}?${keywords},travel`;
};

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const tripId = parseInt(id);
  const [selectedTab, setSelectedTab] = useState("itinerary");
  const [mapUrl, setMapUrl] = useState("");
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLIFrameElement>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [savedStates, setSavedStates] = useState<{ [key: string]: boolean }>({});
  
  // Fetch wishlist items to check if any attractions are already saved
  const { data: wishlistItems } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });
  
  const { data: trip, isLoading, error } = useQuery<TripWithDetails>({
    queryKey: [`/api/trips/${tripId}`],
    enabled: !isNaN(tripId),
  });

  // Initialize Google Maps for the trip destination
  useEffect(() => {
    if (trip?.destination) {
      setMapUrl(getGoogleMapsUrl(trip.destination));
    }
  }, [trip?.destination]);

  const generateItineraryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/ai/generate-itinerary", "POST", { tripId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}`] });
      toast({
        title: "Itinerary generated",
        description: "Your AI-powered itinerary has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate itinerary: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleGenerateItinerary = () => {
    generateItineraryMutation.mutate();
  };

  // Add to wishlist mutation
  const addToWishlist = useMutation({
    mutationFn: async (wishlistItem: any) => {
      return apiRequest("/api/wishlist", "POST", wishlistItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to wishlist. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Check if an item is already saved in wishlist
  const isInWishlist = (itemType: string, itemId: string) => {
    if (!wishlistItems) return false;
    return wishlistItems.some(
      (item: any) => item.itemType === itemType && item.itemId === itemId
    );
  };
  
  // Toggle saved state for an activity
  const toggleSaved = (activityId: string) => {
    setSavedStates(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
    
    toast({
      title: savedStates[activityId] ? "Removed from saved" : "Added to saved",
      description: savedStates[activityId] 
        ? "The activity has been removed from your saved items." 
        : "The activity has been added to your saved items.",
    });
  };

  // Toggle expanded day view
  const toggleDayExpansion = (dayNumber: number) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  // Add a place to stay
  const handleAddPlaceToStay = (dayId: number) => {
    toast({
      title: "Add a place to stay",
      description: "This feature is coming soon!",
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !trip) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Error Loading Trip</h1>
            <p className="text-red-500 mb-6">{error?.message || "Trip not found"}</p>
            <Button onClick={() => navigate("/trips")}>Back to Trips</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const hasItinerary = trip.days && trip.days.length > 0;
  const hasBookings = trip.bookings && trip.bookings.length > 0;
  
  // Group days by month for better organization
  const groupedDays = trip.days.reduce((acc, day) => {
    if (day.date) {
      const month = format(new Date(day.date), 'MMMM yyyy');
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(day);
    } else {
      if (!acc['Unscheduled']) {
        acc['Unscheduled'] = [];
      }
      acc['Unscheduled'].push(day);
    }
    return acc;
  }, {} as Record<string, typeof trip.days>);
  
  return (
    <MainLayout>
      <div className="relative">
        {/* Hero Banner with Trip Title */}
        <div className="relative h-64 bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
          {trip.destination && (
            <img 
              src={getPlaceholderImage(trip.destination)} 
              alt={trip.destination}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
            <h1 className="text-4xl font-bold text-white mb-2">{trip.title} for {trip.days.length} days</h1>
            <div className="flex items-center text-white/90 text-sm gap-4">
              {trip.startDate && trip.endDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{trip.destination}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto relative -mt-16">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="py-1 px-3 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  What's this trip about? (optional)
                </div>
                {trip.preferences && trip.preferences.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trip.preferences.map((preference, index) => (
                      <Badge key={index} variant="outline" className="bg-white">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share this trip</DialogTitle>
                      <DialogDescription>
                        Copy the link below to share your trip with friends and family.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-4">
                      <Input 
                        value={`${window.location.origin}/trips/${trip.id}`} 
                        readOnly
                        className="flex-1"
                      />
                      <Button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/trips/${trip.id}`);
                        toast({
                          title: "Link copied",
                          description: "The trip link has been copied to your clipboard.",
                        });
                      }}>
                        Copy
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Trip Info & Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map & Trip Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Map Card */}
                <Card className="overflow-hidden">
                  <div className="h-48 relative bg-gray-100">
                    {showMap ? (
                      <iframe 
                        ref={mapRef}
                        src={mapUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        title="Google Maps"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                        onClick={() => setShowMap(true)}
                      >
                        <Map className="h-10 w-10 text-gray-400" />
                        <span className="ml-2 text-gray-500">Click to load map</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg mb-2">{trip.destination}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Explore {trip.destination} with this personalized itinerary
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-sm"
                      onClick={() => window.open(getGoogleMapsUrl(trip.destination), '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open in Google Maps
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Saved Activities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-red-500" />
                      Saved Activities
                    </CardTitle>
                    <CardDescription>
                      Places and activities you've saved for this trip
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {Object.keys(savedStates).length > 0 ? (
                      <ul className="space-y-3">
                        {Object.entries(savedStates)
                          .filter(([_, isSaved]) => isSaved)
                          .map(([activityId]) => {
                            // Find the activity in the trip
                            let activity: any = null;
                            for (const day of trip.days) {
                              const found = day.activities.find(a => `${a.id}` === activityId);
                              if (found) {
                                activity = { ...found, day };
                                break;
                              }
                            }
                            
                            if (!activity) return null;
                            
                            return (
                              <li key={activityId} className="flex gap-3 items-start">
                                <div className="p-1.5 rounded-full bg-gray-100 flex-shrink-0">
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{activity.title}</p>
                                  <p className="text-xs text-gray-500">
                                    Day {activity.day.dayNumber}: {activity.day.title}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">
                          Save activities by clicking the heart icon
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Trip Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      Trip Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="font-medium">{trip.days.length} days</span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-t border-gray-100 pt-2">
                        <span className="text-sm text-gray-600">Attractions</span>
                        <span className="font-medium">
                          {trip.days.reduce((count, day) => {
                            return count + day.activities.filter(a => 
                              a.type?.toLowerCase() === 'attraction' || 
                              a.type?.toLowerCase() === 'sightseeing'
                            ).length;
                          }, 0)}
                        </span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-t border-gray-100 pt-2">
                        <span className="text-sm text-gray-600">Restaurants</span>
                        <span className="font-medium">
                          {trip.days.reduce((count, day) => {
                            return count + day.activities.filter(a => 
                              a.type?.toLowerCase() === 'restaurant' || 
                              a.type?.toLowerCase() === 'meal' ||
                              a.type?.toLowerCase() === 'food'
                            ).length;
                          }, 0)}
                        </span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-t border-gray-100 pt-2">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="font-medium">{trip.budget || 'Not specified'}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Trip Content */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="itinerary" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="saves">For you</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="itinerary" className="mt-0">
                    {hasItinerary ? (
                      <div className="space-y-6">
                        {/* Itinerary Timeline */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <h2 className="text-lg font-semibold mb-4">
                            {trip.days.length} days itinerary
                          </h2>
                          
                          {/* Timeline View */}
                          <div className="relative">
                            {Object.entries(groupedDays).map(([month, days], monthIndex) => (
                              <div key={month} className="mb-8">
                                {month !== 'Unscheduled' && (
                                  <h3 className="text-sm font-medium text-gray-600 mb-4">{month}</h3>
                                )}
                                
                                {days.map((day) => (
                                  <div key={day.id} className="mb-2">
                                    <div 
                                      className="flex items-start cursor-pointer"
                                      onClick={() => toggleDayExpansion(day.dayNumber)}
                                    >
                                      {/* Day Number */}
                                      <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center z-10 mr-3 mt-0.5">
                                        <span className="text-sm font-medium text-gray-700">{day.dayNumber}</span>
                                      </div>
                                      
                                      {/* Day Header */}
                                      <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                          <h4 className="font-medium">
                                            {expandedDay === day.dayNumber ? (
                                              <span className="text-primary-700">{day.title}</span>
                                            ) : (
                                              day.title
                                            )}
                                          </h4>
                                          {day.date && (
                                            <span className="text-sm text-gray-500">
                                              {format(parseISO(day.date), "EEE, MMM d")}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Preview of activities (when collapsed) */}
                                        {expandedDay !== day.dayNumber && day.activities.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mb-2">
                                            {day.activities.slice(0, 3).map((activity) => (
                                              <Badge 
                                                key={activity.id} 
                                                variant="outline" 
                                                className="bg-white"
                                              >
                                                {activity.title}
                                              </Badge>
                                            ))}
                                            {day.activities.length > 3 && (
                                              <Badge variant="outline" className="bg-white">
                                                +{day.activities.length - 3} more
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Expanded Day View */}
                                    {expandedDay === day.dayNumber && (
                                      <div className="ml-11 mt-3 border-l-2 border-gray-200 pl-4">
                                        {day.activities.length > 0 ? (
                                          <div className="space-y-4">
                                            {day.activities.map((activity, activityIndex) => (
                                              <div 
                                                key={activity.id}
                                                className="relative flex gap-4 pb-6"
                                              >
                                                {/* Time Line */}
                                                <div className="absolute -left-6 h-full w-0.5 bg-gray-200">
                                                  <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-gray-300"></div>
                                                </div>
                                                
                                                {/* Activity Card */}
                                                <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                  {/* Activity Content */}
                                                  <div className="p-4">
                                                    {/* Time & Title */}
                                                    <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                        {activity.time && (
                                                          <div className="text-sm text-gray-500 mb-1">
                                                            {formatTimeString(activity.time)}
                                                          </div>
                                                        )}
                                                        <h5 className="font-medium">{activity.title}</h5>
                                                      </div>
                                                      
                                                      {/* Action Buttons */}
                                                      <div className="flex gap-1">
                                                        <TooltipProvider>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-full"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  toggleSaved(`${activity.id}`);
                                                                }}
                                                              >
                                                                <Heart 
                                                                  className={`h-4 w-4 ${savedStates[activity.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                                                                />
                                                              </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>{savedStates[activity.id] ? 'Remove from saved' : 'Save activity'}</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                        
                                                        <TooltipProvider>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-full"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  if (activity.location) {
                                                                    window.open(getGoogleMapsUrl(activity.location), '_blank');
                                                                  } else {
                                                                    window.open(getGoogleMapsUrl(`${activity.title} ${trip.destination}`), '_blank');
                                                                  }
                                                                }}
                                                              >
                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                              </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>View on map</p>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                        
                                                        <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                            <Button
                                                              variant="ghost"
                                                              size="icon"
                                                              className="h-7 w-7 rounded-full"
                                                            >
                                                              <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                            </Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent align="end">
                                                            <DropdownMenuItem className="cursor-pointer flex items-center">
                                                              <Edit className="mr-2 h-4 w-4" />
                                                              <span>Edit details</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                              className="cursor-pointer flex items-center text-red-600"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Implement delete
                                                                toast({
                                                                  title: "Delete activity",
                                                                  description: "This feature is coming soon!",
                                                                });
                                                              }}
                                                            >
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                                                                <path d="M3 6h18"></path>
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                              </svg>
                                                              <span>Delete</span>
                                                            </DropdownMenuItem>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Location & Type */}
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                      {activity.location && (
                                                        <div className="flex items-center text-sm text-gray-500">
                                                          <MapPin className="h-3.5 w-3.5 mr-1" />
                                                          {activity.location}
                                                        </div>
                                                      )}
                                                      {activity.type && (
                                                        <Badge variant="outline" className="text-xs">
                                                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    
                                                    {/* Description */}
                                                    {activity.description && (
                                                      <p className="text-sm text-gray-600 mt-2">
                                                        {activity.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {/* Add Activity Button */}
                                            <div className="flex justify-center">
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="border-dashed"
                                                onClick={() => {
                                                  // Implement add activity
                                                  toast({
                                                    title: "Add activity",
                                                    description: "This feature is coming soon!",
                                                  });
                                                }}
                                              >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Activity
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-8">
                                            <p className="text-gray-500 mb-4">No activities for this day yet</p>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => handleAddPlaceToStay(day.id)}
                                            >
                                              <Plus className="h-4 w-4 mr-1" />
                                              Add Place To Stay
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6 pb-8 text-center">
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Calendar className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Itinerary Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                              Let our AI create a personalized day-by-day itinerary for your trip to {trip.destination}.
                            </p>
                          </div>
                          
                          <Button 
                            className="mx-auto" 
                            onClick={handleGenerateItinerary}
                            disabled={generateItineraryMutation.isPending}
                          >
                            {generateItineraryMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Itinerary...
                              </>
                            ) : (
                              <>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Generate AI Itinerary
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="saves" className="mt-0">
                    <Card>
                      <CardContent className="pt-6 pb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Recommended for you</h3>
                          <Button variant="ghost" size="sm">View all</Button>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Based on your trip to {trip.destination}, we think you might like these places:
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Beach Location */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                              <div className="h-40 bg-gray-100 relative">
                                <img 
                                  src={getPlaceholderImage(`${trip.destination} beach`)}
                                  alt="Beach"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-medium">Beautiful Beaches</h5>
                                  <div className="flex items-center text-yellow-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="ml-1 text-sm">4.8</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Explore the stunning beaches around {trip.destination}.
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-3"
                                  onClick={() => {
                                    if (!user) {
                                      toast({
                                        title: "Sign in required",
                                        description: "Please sign in to save items to your wishlist",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    const beachesId = `trip-${trip.id}-beaches`;
                                    const isAlreadySaved = isInWishlist("attraction", beachesId);
                                    
                                    if (!isAlreadySaved) {
                                      addToWishlist.mutate({
                                        itemType: "attraction",
                                        itemId: beachesId,
                                        itemName: `Beaches in ${trip.destination}`,
                                        itemImage: getPlaceholderImage(`${trip.destination} beach`),
                                        additionalData: {
                                          tripId: trip.id,
                                          description: `Explore the stunning beaches around ${trip.destination}.`,
                                          location: trip.destination
                                        }
                                      });
                                    } else {
                                      toast({
                                        title: "Already in wishlist",
                                        description: "This attraction is already in your wishlist",
                                      });
                                    }
                                  }}
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Save for later
                                </Button>
                              </div>
                            </div>
                            
                            {/* Restaurant */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                              <div className="h-40 bg-gray-100 relative">
                                <img 
                                  src={getPlaceholderImage(`${trip.destination} restaurant`)}
                                  alt="Restaurant"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-medium">Local Cuisine</h5>
                                  <div className="flex items-center text-yellow-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="ml-1 text-sm">4.7</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Try the authentic cuisine of {trip.destination}.
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-3"
                                  onClick={() => {
                                    if (!user) {
                                      toast({
                                        title: "Sign in required",
                                        description: "Please sign in to save items to your wishlist",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    const cuisineId = `trip-${trip.id}-cuisine`;
                                    const isAlreadySaved = isInWishlist("restaurant", cuisineId);
                                    
                                    if (!isAlreadySaved) {
                                      addToWishlist.mutate({
                                        itemType: "restaurant",
                                        itemId: cuisineId,
                                        itemName: `Local Cuisine in ${trip.destination}`,
                                        itemImage: getPlaceholderImage(`${trip.destination} restaurant`),
                                        additionalData: {
                                          tripId: trip.id,
                                          description: `Try the authentic cuisine of ${trip.destination}.`,
                                          location: trip.destination
                                        }
                                      });
                                    } else {
                                      toast({
                                        title: "Already in wishlist",
                                        description: "This restaurant is already in your wishlist",
                                      });
                                    }
                                  }}
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Save for later
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="bookings" className="mt-0">
                    {hasBookings ? (
                      <div className="space-y-6">
                        {/* Accommodations */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Accommodations</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {trip.bookings
                              .filter(b => b.type.toLowerCase() === 'hotel' || b.type.toLowerCase() === 'accommodation')
                              .map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                              ))}
                              
                            {/* Add Hotel Button */}
                            {trip.bookings.filter(b => b.type.toLowerCase() === 'hotel' || b.type.toLowerCase() === 'accommodation').length === 0 && (
                              <Button 
                                variant="outline" 
                                className="border-dashed h-20"
                                onClick={() => {
                                  toast({
                                    title: "Add accommodation",
                                    description: "This feature is coming soon!",
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Accommodation
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Transportation */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Transportation</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {trip.bookings
                              .filter(b => b.type.toLowerCase() === 'flight' || b.type.toLowerCase() === 'transportation')
                              .map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                              ))}
                              
                            {/* Add Transportation Button */}
                            {trip.bookings.filter(b => b.type.toLowerCase() === 'flight' || b.type.toLowerCase() === 'transportation').length === 0 && (
                              <Button 
                                variant="outline" 
                                className="border-dashed h-20"
                                onClick={() => navigate('/flights')}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Transportation
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Activities & Tours */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Activities & Tours</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {trip.bookings
                              .filter(b => b.type.toLowerCase() === 'activity' || b.type.toLowerCase() === 'tour' || b.type.toLowerCase() === 'ticket')
                              .map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                              ))}
                              
                            {/* Add Activity Button */}
                            {trip.bookings.filter(b => b.type.toLowerCase() === 'activity' || b.type.toLowerCase() === 'tour' || b.type.toLowerCase() === 'ticket').length === 0 && (
                              <Button 
                                variant="outline" 
                                className="border-dashed h-20"
                                onClick={() => {
                                  toast({
                                    title: "Add activity booking",
                                    description: "This feature is coming soon!",
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Activity Booking
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6 pb-8 text-center">
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <DollarSign className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Bookings Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                              When you're ready to book your trip, you'll see your reservations here.
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Find hotels",
                                  description: "This feature is coming soon!",
                                });
                              }}
                            >
                              <Hotel className="h-4 w-4 mr-2" />
                              Find Hotels
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => navigate('/flights')}
                            >
                              <Plane className="h-4 w-4 mr-2" />
                              Search Flights
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
