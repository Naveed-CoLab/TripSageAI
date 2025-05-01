import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Tag, 
  MessageSquare,
  Layers,
  Check,
  X 
} from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface TripDay {
  day: number;
  activities: {
    title: string;
    description: string;
  }[];
}

interface AiTripDetail {
  id: number;
  userId: number;
  username: string;
  userEmail: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  interests: string[];
  withPets: boolean;
  prompt: string;
  aiResponse: string;
  generatedTrip: {
    days: TripDay[];
  };
  saved: boolean;
  savedTripId: number | null;
  savedTripTitle: string | null;
  savedTripStatus: string | null;
  createdAt: string;
}

export default function AiTripDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const { data: trip, isLoading, error } = useQuery<AiTripDetail>({
    queryKey: [`/api/admin/ai-trips/${id}`],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trip) {
    toast({
      title: "Error",
      description: "Failed to load AI trip details. Please try again.",
      variant: "destructive",
    });
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive mb-4">Failed to load AI trip details</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" asChild>
          <Link to="/ai-trips">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All AI Trips
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{trip.destination} AI Trip</CardTitle>
              <CardDescription>Generated on {new Date(trip.createdAt).toLocaleDateString()}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {trip.saved ? (
                <Badge variant="success" className="flex items-center">
                  <Check className="mr-1 h-3 w-3" />
                  Saved as Trip
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center">
                  <X className="mr-1 h-3 w-3" />
                  Not Saved
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm font-medium">User:</p>
                  <p><span className="font-semibold">{trip.username}</span> ({trip.userEmail})</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm font-medium">Destination:</p>
                  <p className="font-semibold">{trip.destination}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm font-medium">Date Range:</p>
                  <p>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1 flex items-center">
                  <Tag className="h-5 w-5 text-muted-foreground mr-2" />
                  Trip Type & Interests:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{trip.tripType}</Badge>
                  {trip.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">{interest}</Badge>
                  ))}
                  {trip.withPets && <Badge variant="outline">With Pets</Badge>}
                </div>
              </div>
              
              {trip.saved && (
                <div>
                  <p className="text-sm font-medium mb-1">Saved Trip Details:</p>
                  <p>
                    <Badge variant="success">Saved</Badge> as{" "}
                    <span className="font-semibold">{trip.savedTripTitle}</span> (Status: {trip.savedTripStatus})
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <Tabs defaultValue="prompt">
            <TabsList className="mb-4">
              <TabsTrigger value="prompt">
                <MessageSquare className="h-4 w-4 mr-2" />
                User Prompt
              </TabsTrigger>
              <TabsTrigger value="itinerary">
                <Layers className="h-4 w-4 mr-2" />
                Generated Itinerary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="prompt" className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium mb-2">User Prompt:</p>
                <p className="whitespace-pre-line">{trip.prompt}</p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">AI Response:</p>
                <p className="whitespace-pre-line">{trip.aiResponse}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="itinerary">
              <div className="space-y-4">
                {trip.generatedTrip.days.map((day) => (
                  <Card key={day.day}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Day {day.day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {day.activities.map((activity, i) => (
                          <li key={i} className="bg-muted/50 p-3 rounded-md">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}