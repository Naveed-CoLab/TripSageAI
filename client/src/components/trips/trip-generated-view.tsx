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
import { Clock, MapPin, Calendar, Tag, Hotel, Plane, Ticket, CreditCard } from 'lucide-react';

// Define types for the trip data
type Activity = {
  title: string;
  description?: string;
  time?: string;
  location?: string;
  type?: string;
};

type Day = {
  dayNumber: number;
  title: string;
  activities: Activity[];
};

type Booking = {
  type: string;
  title: string;
  provider?: string;
  price?: string;
  details?: any;
};

type GeneratedTripData = {
  days: Day[];
  bookings: Booking[];
};

interface TripGeneratedViewProps {
  generatedTrip: GeneratedTripData;
}

export function TripGeneratedView({ generatedTrip }: TripGeneratedViewProps) {
  const [activeTab, setActiveTab] = useState('itinerary');
  
  // Function to get appropriate icon for activity type
  const getActivityTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'sightseeing':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'meal':
        return <Tag className="h-4 w-4 text-amber-500" />;
      case 'transportation':
        return <Plane className="h-4 w-4 text-purple-500" />;
      case 'accommodation':
        return <Hotel className="h-4 w-4 text-green-500" />;
      case 'cultural':
        return <Ticket className="h-4 w-4 text-red-500" />;
      case 'entertainment':
        return <Ticket className="h-4 w-4 text-pink-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
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
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="itinerary" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="itinerary">Day-by-Day Itinerary</TabsTrigger>
          <TabsTrigger value="bookings">Suggested Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="itinerary" className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {generatedTrip.days.map((day) => (
              <AccordionItem key={day.dayNumber} value={`day-${day.dayNumber}`}>
                <AccordionTrigger>
                  <div className="flex items-center text-left">
                    <Badge variant="outline" className="mr-2">
                      Day {day.dayNumber}
                    </Badge>
                    <span>{day.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-2">
                    {day.activities.map((activity, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-md font-semibold">{activity.title}</CardTitle>
                            {activity.time && (
                              <Badge variant="outline" className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {activity.time}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          {activity.description && (
                            <CardDescription className="mt-2 text-sm text-gray-700">
                              {activity.description}
                            </CardDescription>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {activity.location && (
                              <Badge variant="secondary" className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {activity.location}
                              </Badge>
                            )}
                            {activity.type && (
                              <Badge variant="outline" className="flex items-center">
                                {getActivityTypeIcon(activity.type)}
                                <span className="ml-1 capitalize">{activity.type}</span>
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {generatedTrip.bookings.map((booking, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getBookingIcon(booking.type)}
                      <CardTitle className="ml-2 text-md font-semibold">{booking.title}</CardTitle>
                    </div>
                    {booking.price && (
                      <Badge variant="secondary">
                        {booking.price}
                      </Badge>
                    )}
                  </div>
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