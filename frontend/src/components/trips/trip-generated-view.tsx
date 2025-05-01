import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, MapPin, Calendar, Tag, Hotel, Plane, Ticket, CreditCard, 
  Utensils, LandmarkIcon, Coffee, Music, Building, Mountain, PalmtreeIcon,
  Car, Bus, TrainFront, Sailboat, Heart 
} from 'lucide-react';

// Define types for the trip data
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

type Day = {
  dayNumber: number;
  title: string;
  activities: Activity[];
  image?: string;
  city?: string;
};

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

type GeneratedTripData = {
  days: Day[];
  bookings: Booking[];
};

interface TripGeneratedViewProps {
  generatedTrip: GeneratedTripData;
}

// Placeholder images by category (in case no image is provided)
const PLACEHOLDER_IMAGES = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
  mountain: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop',
  landmark: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=600&auto=format&fit=crop',
  city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop',
  park: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=600&auto=format&fit=crop',
  museum: 'https://images.unsplash.com/photo-1503152394-c571994fd383?q=80&w=600&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop',
};

// Cities for demo (these should come from the API in production)
const CITY_IMAGES = {
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600&auto=format&fit=crop',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=600&auto=format&fit=crop',
  newyork: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop',
  barcelona: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=600&auto=format&fit=crop',
  rome: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=600&auto=format&fit=crop',
};

export function TripGeneratedView({ generatedTrip }: TripGeneratedViewProps) {
  const [activeTab, setActiveTab] = useState('itinerary');
  
  // Function to get appropriate icon for activity type
  const getActivityTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'sightseeing':
        return <MapPin className="h-4 w-4" />;
      case 'meal':
      case 'restaurant':
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'transportation':
        return <Plane className="h-4 w-4" />;
      case 'accommodation':
      case 'hotel':
      case 'resort':
        return <Hotel className="h-4 w-4" />;
      case 'cultural':
      case 'museum':
      case 'gallery':
        return <LandmarkIcon className="h-4 w-4" />;
      case 'entertainment':
      case 'nightlife':
        return <Music className="h-4 w-4" />;
      case 'landmark':
      case 'monument':
        return <Building className="h-4 w-4" />;
      case 'adventure':
      case 'outdoor':
        return <Mountain className="h-4 w-4" />;
      case 'relaxation':
      case 'spa':
        return <Coffee className="h-4 w-4" />;
      case 'beach':
        return <PalmtreeIcon className="h-4 w-4" />;
      case 'car':
        return <Car className="h-4 w-4" />;
      case 'bus':
        return <Bus className="h-4 w-4" />;
      case 'train':
        return <TrainFront className="h-4 w-4" />;
      case 'boat':
      case 'cruise':
        return <Sailboat className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };
  
  // Function to get activity type color
  const getActivityTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'sightseeing':
        return 'bg-blue-100 text-blue-700';
      case 'meal':
      case 'restaurant':
      case 'dining':
        return 'bg-amber-100 text-amber-700';
      case 'transportation':
        return 'bg-purple-100 text-purple-700';
      case 'accommodation':
      case 'hotel':
      case 'resort':
        return 'bg-green-100 text-green-700';
      case 'cultural':
      case 'museum':
      case 'gallery':
        return 'bg-red-100 text-red-700';
      case 'entertainment':
      case 'nightlife':
        return 'bg-pink-100 text-pink-700';
      case 'landmark':
      case 'monument':
        return 'bg-indigo-100 text-indigo-700';
      case 'adventure':
      case 'outdoor':
        return 'bg-emerald-100 text-emerald-700';
      case 'relaxation':
      case 'spa':
        return 'bg-sky-100 text-sky-700';
      case 'beach':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Function to get appropriate icon and color for booking type
  const getBookingIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel':
      case 'accommodation':
        return <Hotel className="h-4 w-4 text-green-500" />;
      case 'flight':
      case 'transportation':
        return <Plane className="h-4 w-4 text-blue-500" />;
      case 'activity':
      case 'tour':
        return <Ticket className="h-4 w-4 text-purple-500" />;
      case 'restaurant':
      case 'dining':
        return <Utensils className="h-4 w-4 text-amber-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Function to get image URL based on activity type
  const getImageUrl = (activity: Activity) => {
    if (activity.image) return activity.image;
    
    const type = activity.type?.toLowerCase() || '';
    
    if (type.includes('restaurant') || type.includes('dining') || type.includes('meal')) {
      return PLACEHOLDER_IMAGES.restaurant;
    } else if (type.includes('hotel') || type.includes('accommodation') || type.includes('resort')) {
      return PLACEHOLDER_IMAGES.hotel;
    } else if (type.includes('beach')) {
      return PLACEHOLDER_IMAGES.beach;
    } else if (type.includes('mountain') || type.includes('hiking')) {
      return PLACEHOLDER_IMAGES.mountain;
    } else if (type.includes('landmark') || type.includes('monument')) {
      return PLACEHOLDER_IMAGES.landmark;
    } else if (type.includes('museum') || type.includes('gallery')) {
      return PLACEHOLDER_IMAGES.museum;
    } else if (type.includes('park') || type.includes('garden')) {
      return PLACEHOLDER_IMAGES.park;
    }
    
    return PLACEHOLDER_IMAGES.default;
  };
  
  // Function to get city image
  const getCityImage = (city?: string) => {
    if (!city) return PLACEHOLDER_IMAGES.city;
    
    const normalizedCity = city.toLowerCase().replace(/\s+/g, '');
    
    for (const [key, url] of Object.entries(CITY_IMAGES)) {
      if (normalizedCity.includes(key)) {
        return url;
      }
    }
    
    return PLACEHOLDER_IMAGES.city;
  };
  
  // Function to render rating stars
  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-4 w-4 ${i < fullStars ? 'text-amber-400' : (i === fullStars && hasHalfStar ? 'text-amber-400' : 'text-gray-300')}`}>
              ★
            </div>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
        {reviewCount && (
          <span className="text-xs text-gray-500">({reviewCount})</span>
        )}
      </div>
    );
  };
  
  // Get a city name from the day if available
  const getDayCity = (day: Day) => {
    if (day.city) return day.city;
    
    // Try to extract city from the first activity with a city or from the day title
    const firstActivityWithCity = day.activities.find(a => a.city);
    if (firstActivityWithCity?.city) return firstActivityWithCity.city;
    
    // Extract potential city name from day title
    const titleMatch = day.title.match(/in\s+([A-Za-z\s]+)(?:,|\s|$)/);
    return titleMatch ? titleMatch[1].trim() : '';
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="itinerary" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="itinerary">Day-by-Day Itinerary</TabsTrigger>
          <TabsTrigger value="bookings">Suggested Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="itinerary" className="space-y-6">
          {generatedTrip.days.map((day) => {
            const cityName = getDayCity(day);
            
            return (
              <Card key={day.dayNumber} className="overflow-hidden">
                {/* City image at the top of each day */}
                <div className="relative h-40 w-full overflow-hidden">
                  <img 
                    src={day.image || getCityImage(cityName)} 
                    alt={cityName || `Day ${day.dayNumber}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div>
                      <Badge className="bg-green-600 text-white border-none mb-2">
                        Day {day.dayNumber}
                      </Badge>
                      <h3 className="text-white text-lg font-semibold">{day.title}</h3>
                      {cityName && (
                        <Badge variant="outline" className="mt-1 bg-blue-600/80 text-white border-none">
                          {cityName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {day.activities.map((activity, index) => (
                      <div key={index} className="rounded-lg border border-border overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          {/* Image on the left/top */}
                          <div className="md:w-1/3 h-48 md:h-auto relative">
                            <img 
                              src={getImageUrl(activity)} 
                              alt={activity.title}
                              className="h-full w-full object-cover"
                            />
                            <button className="absolute top-2 right-2 rounded-full bg-white p-1.5 shadow-md">
                              <Heart className="h-4 w-4 text-rose-500" />
                            </button>
                          </div>
                          
                          {/* Content on the right/bottom */}
                          <div className="flex-1 p-4">
                            <div className="mb-2 flex flex-wrap gap-2">
                              {activity.city && (
                                <Badge className="bg-blue-600 text-white border-none">
                                  {activity.city}
                                </Badge>
                              )}
                              {activity.type && (
                                <Badge variant="outline" className={`flex items-center ${getActivityTypeColor(activity.type)}`}>
                                  {getActivityTypeIcon(activity.type)}
                                  <span className="ml-1 capitalize">{activity.type}</span>
                                </Badge>
                              )}
                              {activity.time && (
                                <Badge variant="outline" className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {activity.time}
                                </Badge>
                              )}
                            </div>
                            
                            <h4 className="text-lg font-semibold mb-1">{activity.title}</h4>
                            {renderRating(activity.rating, activity.reviewCount)}
                            
                            {activity.location && (
                              <div className="mt-1.5 flex items-center text-sm text-muted-foreground">
                                <MapPin className="mr-1 h-3.5 w-3.5" />
                                {activity.location}
                              </div>
                            )}
                            
                            {activity.description && (
                              <p className="mt-3 text-sm text-gray-700">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {generatedTrip.bookings.map((booking, index) => (
              <Card key={index} className="overflow-hidden">
                {booking.image && (
                  <div className="h-36 w-full">
                    <img 
                      src={booking.image} 
                      alt={booking.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getBookingIcon(booking.type)}
                      <CardTitle className="ml-2 text-md font-semibold">{booking.title}</CardTitle>
                    </div>
                    {booking.price && (
                      <Badge className="bg-green-600 text-white border-none">
                        {booking.price}
                      </Badge>
                    )}
                  </div>
                  
                  {renderRating(booking.rating, booking.reviewCount)}
                  
                  {booking.provider && (
                    <CardDescription className="text-sm">
                      Provider: {booking.provider}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  {booking.details && (
                    <div className="mt-2 space-y-1 text-sm">
                      {Object.entries(booking.details).map(([key, value], i) => (
                        <div key={i} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-gray-600">
                            {Array.isArray(value) 
                              ? (value as string[]).join(', ') 
                              : value as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Badge variant="outline" className="mt-3 flex w-fit items-center">
                    <span className="capitalize">{booking.type}</span>
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}