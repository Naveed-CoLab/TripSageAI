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
  Utensils, Hotel, Camera, Landmark, Plane, Plus, Building, Edit, Ticket,
  Calculator, Image, ChevronDown
} from "lucide-react";
import { TripAdvisorImageGallery } from "@/components/tripadvisor/image-gallery"; 
import { HotelImages } from "@/components/tripadvisor/hotel-images";
import { BookingImage } from "@/components/tripadvisor/booking-image";
import { fetchDestinationImage, getDestinationImageSync } from "@/lib/image-service";
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

// Import our static image helper
import { getDestinationImage } from "@/lib/destination-images";

// Activity type definition
type Activity = {
  id?: string | number;
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
  budgetIsEstimated: boolean | null;
  preferences: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  days: Day[]; // Itinerary days with activities
  bookings: Booking[]; // Trip bookings
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
  // For dynamic image loading - must be before any conditional logic to maintain hook order
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  
  // Fetch wishlist items to check if any attractions are already saved
  const { data: wishlistItems } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });
  
  const { data: trip, isLoading, error } = useQuery<TripWithDetails>({
    queryKey: [`/api/trips/${tripId}`],
    enabled: !isNaN(tripId),
  });

  // Initialize Google Maps for the trip destination using our Maps API
  useEffect(() => {
    if (trip?.destination) {
      // Use our new Maps API to get the map URL
      const getMapUrl = async () => {
        try {
          // First try to use our map service to get an embed URL
          const response = await fetch(`/api/maps/embed?location=${encodeURIComponent(trip.destination)}`);
          const data = await response.json();
          
          if (data.embedUrl) {
            setMapUrl(data.embedUrl);
          } else {
            // If our service fails, fall back to the basic URL
            setMapUrl(getGoogleMapsUrl(trip.destination));
          }
        } catch (error) {
          console.error("Error fetching map URL:", error);
          // Fallback to basic URL in case of errors
          setMapUrl(getGoogleMapsUrl(trip.destination));
        }
      };
      
      getMapUrl();
    }
  }, [trip?.destination]);
  
  // Estimate budget if not already set
  const estimateBudgetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/ai/estimate-budget", "POST", { tripId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}`] });
      toast({
        title: "Budget Estimated",
        description: "AI-powered budget estimation complete.",
      });
    },
    onError: (error: Error) => {
      console.error("Budget estimation error:", error);
    },
  });
  
  // Trigger budget estimation if needed
  useEffect(() => {
    if (trip && !trip.budget && !estimateBudgetMutation.isPending) {
      estimateBudgetMutation.mutate();
    }
  }, [trip]);
  
  // Load destination image dynamically
  useEffect(() => {
    if (!trip?.destination) return;
    
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        // Start with a fallback image first
        const fallbackImage = `/images/destinations/${trip.destination.toLowerCase().replace(/ /g, '-')}.jpg`;
        if (isMounted) setBackgroundImage(fallbackImage);
        
        // Try to get a better image from Unsplash
        const destination = encodeURIComponent(trip.destination);
        const response = await fetch(`/api/images/search?query=${destination}&width=1200&height=600`);
        if (response.ok) {
          const data = await response.json();
          if (data.url && isMounted) {
            setBackgroundImage(data.url);
          }
        }
      } catch (error) {
        console.error("Error loading destination image:", error);
        // If all else fails, use a default placeholder
        if (isMounted && !backgroundImage) {
          setBackgroundImage("https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=600&q=80");
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
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

  // Use existing values - removed duplicate hook

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
        <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-gray-200">
            {backgroundImage && (
              <img 
                src={backgroundImage}
                alt={trip.destination}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-100"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
          
          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate("/trips")}
            >
              <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
              Back to Trips
            </Button>
          </div>
          
          <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
                {trip.title}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 flex items-center shadow border border-white/20">
                  <Calendar className="w-6 h-6 mr-2 text-primary-200" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/80">Duration</div>
                    <div className="text-white font-medium">
                      {trip.days.length} days
                    </div>
                  </div>
                </div>
                
                {trip.startDate && trip.endDate && (
                  <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 flex items-center shadow border border-white/20">
                    <Calendar className="w-6 h-6 mr-2 text-primary-200" />
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/80">Date</div>
                      <div className="text-white font-medium">
                        {trip.startDate && typeof trip.startDate === 'string' 
                          ? format(new Date(trip.startDate), "MMM d") 
                          : "Start date"} - {trip.endDate && typeof trip.endDate === 'string' 
                          ? format(new Date(trip.endDate), "MMM d, yyyy") 
                          : "End date"}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 flex items-center shadow border border-white/20">
                  <MapPin className="w-6 h-6 mr-2 text-primary-200" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/80">Destination</div>
                    <div className="text-white font-medium">{trip.destination}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-6xl mx-auto relative -mt-10">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="py-1 px-3 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  Trip preferences
                </div>
                {trip.preferences && trip.preferences.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trip.preferences.map((preference, index) => (
                      <Badge key={`pref-${index}`} variant="outline" className="bg-white hover:bg-primary-50 transition-colors">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}/edit`)} className="hover:bg-primary-50 transition-colors">
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
                <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="h-48 relative bg-gray-100">
                    <iframe 
                      ref={mapRef}
                      src={mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(trip.destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      title="Google Maps"
                    />
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
                      onClick={() => {
                        // Get a Google Maps URL from our maps service
                        fetch(`/api/maps/embed?location=${encodeURIComponent(trip.destination)}&zoom=14`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.embedUrl) {
                              window.open(data.embedUrl, '_blank');
                            } else {
                              window.open(getGoogleMapsUrl(trip.destination), '_blank');
                            }
                          })
                          .catch(() => {
                            // Fallback to the basic URL
                            window.open(getGoogleMapsUrl(trip.destination), '_blank');
                          });
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open in Google Maps
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Saved Activities */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
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
                            let matchDay = null;
                            for (const day of trip.days) {
                              const found = day.activities.find(a => `${a.id}` === activityId);
                              if (found) {
                                activity = found;
                                matchDay = day;
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
                                    Day {matchDay?.dayNumber}: {matchDay?.title}
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
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
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
                        <div className="text-right">
                          {trip.budget ? (
                            <div>
                              <span className="font-medium">{trip.budget}</span>
                              {trip.budgetIsEstimated && (
                                <div className="flex items-center justify-end mt-1">
                                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium h-4 border-yellow-200 bg-yellow-50 text-amber-800">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      className="mr-1"
                                    >
                                      <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#CC8B00" strokeWidth="1" />
                                      <path 
                                        d="M12 3.953a7.442 7.442 0 1 0 .001 14.884A7.442 7.442 0 0 0 12 3.953m0 14.05a6.61 6.61 0 1 1 0-13.218 6.61 6.61 0 0 1 0 13.219M10.343 11.9a.91.91 0 1 1-1.821 0 .91.91 0 0 1 1.821 0m5.134 0a.91.91 0 1 1-1.821 0 .91.91 0 0 1 1.82 0m.82-1.897.84-.913h-1.863A5.8 5.8 0 0 0 12 8.08a5.77 5.77 0 0 0-3.27 1.008H6.862l.84.913a2.567 2.567 0 1 0 3.475 3.78l.823.896.823-.895a2.568 2.568 0 1 0 3.474-3.78"
                                        fill="#FFD700" 
                                        stroke="#CC8B00"
                                        strokeWidth="0.8"
                                      />
                                    </svg>
                                    AI Estimated
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : estimateBudgetMutation.isPending ? (
                            <div className="flex items-center">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              <span className="text-xs">Estimating...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-gray-400 text-sm">Not specified</span>
                              <Button 
                                variant="link" 
                                className="text-xs p-0 h-auto text-primary-600" 
                                onClick={() => estimateBudgetMutation.mutate()}
                              >
                                <Calculator className="h-3 w-3 mr-1 inline" />
                                Estimate with AI
                              </Button>
                            </div>
                          )}
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Trip Content */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="itinerary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="itinerary" className="text-sm md:text-base">
                      <Calendar className="h-4 w-4 mr-2 inline-block" />
                      Itinerary
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="text-sm md:text-base">
                      <Image className="h-4 w-4 mr-2 inline-block" />
                      Photos
                    </TabsTrigger>
                    <TabsTrigger value="for-you" className="text-sm md:text-base">
                      <User className="h-4 w-4 mr-2 inline-block" />
                      For you
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="text-sm md:text-base">
                      <Ticket className="h-4 w-4 mr-2 inline-block" />
                      Bookings
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="itinerary" className="mt-0">
                    {hasItinerary ? (
                      <div className="space-y-8">
                        {Object.entries(groupedDays).map(([month, days]) => (
                          <div key={month} className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 pb-2 border-b border-gray-200 flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                              {month}
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                              {days.map((day) => (
                                <div 
                                  key={day.dayNumber}
                                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                                >
                                  <div 
                                    className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-gray-50 to-white"
                                    onClick={() => toggleDayExpansion(day.dayNumber)}
                                  >
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3">
                                        {day.dayNumber}
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{day.title}</h4>
                                        {day.date && (
                                          <p className="text-sm text-gray-500">
                                            {format(new Date(day.date), 'EEEE, MMMM d, yyyy')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-2">
                                      <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 font-normal">
                                        {day.activities.length} activities
                                      </Badge>
                                      <Button variant="ghost" size="sm">
                                        {expandedDay === day.dayNumber ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                                            <path d="m18 15-6-6-6 6"/>
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                                            <path d="m6 9 6 6 6-6"/>
                                          </svg>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {expandedDay === day.dayNumber && (
                                    <div className="p-4 pt-0 border-t border-gray-100 mt-2">
                                      <div className="mt-4 space-y-6 relative before:absolute before:left-3 before:top-2 before:w-0.5 before:h-[calc(100%-24px)] before:bg-gray-200">
                                        {day.activities.map((activity, idx) => {
                                          const activityId = `${activity.id || idx}`;
                                          const isSaved = savedStates[activityId];
                                          
                                          return (
                                            <div key={idx} className="pl-8 relative pb-1">
                                              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white flex items-center justify-center z-10 border border-gray-200">
                                                {getActivityIcon(activity.type)}
                                              </div>
                                              
                                              <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                  <div>
                                                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                                    
                                                    <div className="flex flex-wrap gap-y-1 gap-x-4 mt-1">
                                                      {activity.time && (
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                          <Clock className="h-3 w-3 mr-1" />
                                                          {formatTimeString(activity.time)}
                                                        </span>
                                                      )}
                                                      
                                                      {activity.location && (
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                          <MapPin className="h-3 w-3 mr-1" />
                                                          {activity.location}
                                                        </span>
                                                      )}
                                                      
                                                      {activity.type && (
                                                        <Badge variant="outline" className="text-xs py-0 h-5">
                                                          {activity.type}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                    onClick={() => toggleSaved(activityId)}
                                                  >
                                                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                                                    <span className="sr-only">Save</span>
                                                  </Button>
                                                </div>
                                                
                                                {activity.description && (
                                                  <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                                                )}
                                                
                                                {activity.rating && (
                                                  <div className="flex items-center mt-2">
                                                    <div className="flex">
                                                      {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                          key={i} 
                                                          className={`h-3.5 w-3.5 ${i < Math.round(activity.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                                        />
                                                      ))}
                                                    </div>
                                                    {activity.reviewCount && (
                                                      <span className="text-xs text-gray-500 ml-1">
                                                        ({activity.reviewCount} reviews)
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                                
                                                {activity.location && (
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="mt-2 h-8 text-primary-600 px-2" 
                                                    onClick={() => window.open(getGoogleMapsUrl(activity.location), '_blank')}
                                                  >
                                                    <Map className="h-3.5 w-3.5 mr-1.5" />
                                                    View on Map
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl shadow-inner">
                        <div className="max-w-md mx-auto">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">No itinerary yet</h3>
                          <p className="text-gray-500 mb-6">
                            This trip doesn't have an itinerary yet. Generate an AI-powered itinerary or create one manually.
                          </p>
                          <Button 
                            onClick={handleGenerateItinerary} 
                            disabled={generateItineraryMutation.isPending}
                            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                            size="lg"
                          >
                            {generateItineraryMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Generate Itinerary
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="photos" className="mt-0">
                    <div className="space-y-8">
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                          <Image className="h-5 w-5 mr-2 text-primary-500" />
                          Places in {trip.destination}
                        </h3>
                        
                        <TripAdvisorImageGallery 
                          searchQuery={trip.destination} 
                          type="location" 
                          limit={6} 
                        />
                      </div>
                      
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                          <Hotel className="h-5 w-5 mr-2 text-primary-500" />
                          Hotels in {trip.destination}
                        </h3>
                        
                        <TripAdvisorImageGallery 
                          searchQuery={`hotels in ${trip.destination}`} 
                          type="hotels" 
                          limit={6} 
                        />
                      </div>
                      
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                          <Utensils className="h-5 w-5 mr-2 text-primary-500" />
                          Restaurants in {trip.destination}
                        </h3>
                        
                        <TripAdvisorImageGallery 
                          searchQuery={`restaurants in ${trip.destination}`} 
                          type="restaurants" 
                          limit={6} 
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="for-you" className="mt-0">
                    <div className="text-center py-16 bg-gray-50 rounded-xl shadow-inner">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Personalized recommendations coming soon</h3>
                        <p className="text-gray-500 mb-6">
                          We're working on personalized recommendations based on your preferences and past trips.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bookings" className="mt-0">
                    {hasBookings ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {trip.bookings.map((booking, index) => {
                          // Determine website URL based on provider
                          let websiteUrl = '';
                          if (booking.provider === 'Booking.com') {
                            websiteUrl = 'https://www.booking.com';
                          } else if (booking.provider === 'Expedia') {
                            websiteUrl = 'https://www.expedia.com';
                          } else if (booking.provider === 'Renfe') {
                            websiteUrl = 'https://www.renfe.com';
                          } else if (booking.provider && booking.provider.includes('Official')) {
                            // For cases like "Sagrada Familia Official Website"
                            websiteUrl = `https://www.${booking.title.toLowerCase().replace(/\s+/g, '')}.org`;
                          }

                          return (
                            <div 
                              key={index}
                              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="relative h-32 bg-gray-100">
                                {booking.type === 'hotel' ? (
                                  <BookingImage 
                                    booking={booking}
                                    destination={trip.destination}
                                  />
                                ) : booking.image ? (
                                  <img
                                    src={booking.image}
                                    alt={booking.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-50 to-primary-100">
                                    {booking.type === 'flight' ? (
                                      <Plane className="h-12 w-12 text-primary-300" />
                                    ) : (
                                      <Ticket className="h-12 w-12 text-primary-300" />
                                    )}
                                  </div>
                                )}
                                <div className="absolute top-2 right-2">
                                  <Badge variant="default" className="capitalize bg-primary-600">
                                    {booking.type}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <h4 className="font-medium text-gray-900 text-lg mb-1">{booking.title}</h4>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                                  {booking.provider && (
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <Building className="h-3.5 w-3.5 mr-1.5" />
                                      {booking.provider}
                                    </span>
                                  )}
                                  
                                  {booking.rating && (
                                    <div className="flex items-center">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={`h-3.5 w-3.5 ${i < Math.round(booking.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                          />
                                        ))}
                                      </div>
                                      {booking.reviewCount && (
                                        <span className="text-xs text-gray-500 ml-1">
                                          ({booking.reviewCount})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {booking.price && (
                                  <div className="px-2 py-1 bg-green-50 text-green-700 rounded-md inline-block text-sm font-medium mb-3">
                                    {booking.price}
                                  </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {websiteUrl && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs flex-1"
                                      onClick={() => window.open(websiteUrl, '_blank')}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                      Visit Website
                                    </Button>
                                  )}
                                  
                                  {booking.type === 'hotel' ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => window.open('https://www.booking.com', '_blank')}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                      Visit Booking.com
                                    </Button>
                                  ) : booking.type === 'flight' ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => window.open(`https://www.${booking.provider?.toLowerCase().replace(/\s+/g, '')}.com`, '_blank')}
                                    >
                                      <Calculator className="h-3.5 w-3.5 mr-1.5" />
                                      View Expenditure
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs flex-1"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                      More Details
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl shadow-inner">
                        <div className="max-w-md mx-auto">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings yet</h3>
                          <p className="text-gray-500 mb-6">
                            You haven't made any bookings for this trip yet. Add bookings to keep track of your reservations.
                          </p>
                          <Button 
                            variant="outline"
                            size="lg"
                            className="border-primary-300 text-primary-700 hover:bg-primary-50"
                          >
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Add Booking
                          </Button>
                        </div>
                      </div>
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