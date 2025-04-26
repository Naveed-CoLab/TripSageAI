import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plane, MapPin, Calendar as CalendarIcon2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { TripGeneratedView } from '@/components/trips/trip-generated-view';
import { useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for AI trip generation
type GeneratedTrip = {
  id: number;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  tripType: string;
  interests: string[];
  withPets: boolean;
  generatedTrip: {
    days: Array<{
      dayNumber: number;
      title: string;
      activities: Array<{
        title: string;
        description?: string;
        time?: string;
        location?: string;
        type?: string;
      }>;
    }>;
    bookings: Array<{
      type: string;
      title: string;
      provider?: string;
      price?: string;
      details?: any;
    }>;
  };
};

// Interests options
const interestOptions = [
  { id: 'culture', label: 'Culture & History' },
  { id: 'food', label: 'Food & Dining' },
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'adventure', label: 'Adventure & Sports' },
  { id: 'relaxation', label: 'Relaxation & Wellness' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'family', label: 'Family-Friendly' },
  { id: 'art', label: 'Art & Museums' },
  { id: 'photography', label: 'Photography' },
];

// Trip type options
const tripTypeOptions = [
  { id: 'solo', label: 'Solo Trip' },
  { id: 'couple', label: 'Couple Trip' },
  { id: 'family', label: 'Family Trip' },
  { id: 'friends', label: 'Friends Trip' },
  { id: 'business', label: 'Business Trip' },
];

export default function AITripGeneratorPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for form inputs
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [tripType, setTripType] = useState('solo');
  const [withPets, setWithPets] = useState(false);
  
  // State for generated trip
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedTrip | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  
  // Generate trip mutation
  const generateTripMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/ai-trips', 'POST', data),
    onSuccess: (data: any) => {
      setGeneratedTrip(data as GeneratedTrip);
      setActiveTab('result');
      toast({
        title: 'Trip Generated!',
        description: 'Your AI-powered trip has been created. You can now review it.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate trip. Please try again.',
        variant: 'destructive',
      });
      console.error('Error generating trip:', error);
    },
  });
  
  // Save trip mutation
  const saveTripMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ai-trips/${id}/save`, 'POST', {}),
    onSuccess: (data: any) => {
      toast({
        title: 'Trip Saved!',
        description: 'Your trip has been saved to your account.',
      });
      setLocation(`/trips/${data.tripId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save trip. Please try again.',
        variant: 'destructive',
      });
      console.error('Error saving trip:', error);
    },
  });

  // Handle generate trip form submission
  const handleGenerateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destination) {
      toast({
        title: 'Destination Required',
        description: 'Please enter a destination for your trip.',
        variant: 'destructive',
      });
      return;
    }
    
    generateTripMutation.mutate({
      destination,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      interests: selectedInterests,
      tripType,
      withPets,
    });
  };
  
  // Handle saving generated trip
  const handleSaveTrip = () => {
    if (generatedTrip) {
      saveTripMutation.mutate(generatedTrip.id);
    }
  };
  
  // Toggle interest selection
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Trip Generator</h1>
      
      <Tabs defaultValue="form" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 mx-auto">
          <TabsTrigger value="form">Create Trip</TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedTrip}>View Generated Trip</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Generate Your Dream Trip</CardTitle>
              <CardDescription>
                Let our AI create a personalized travel itinerary based on your preferences.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleGenerateTrip} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-muted-foreground h-5 w-5" />
                    <Input
                      id="destination"
                      placeholder="Where do you want to go?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                          disabled={!startDate}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick an end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Trip Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {tripTypeOptions.map(option => (
                      <Badge
                        key={option.id}
                        variant={tripType === option.id ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => setTripType(option.id)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map(option => (
                      <Badge
                        key={option.id}
                        variant={selectedInterests.includes(option.id) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleInterest(option.id)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withPets"
                    checked={withPets}
                    onCheckedChange={(checked) => setWithPets(checked === true)}
                  />
                  <Label htmlFor="withPets">I'm traveling with pets</Label>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setLocation('/trips')}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateTrip} 
                disabled={!destination || generateTripMutation.isPending}
              >
                {generateTripMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plane className="mr-2 h-4 w-4" />
                    Generate Trip
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="result">
          {generatedTrip && (
            <div className="space-y-6">
              <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Your Generated Trip to {generatedTrip.destination}</CardTitle>
                      <CardDescription>
                        {generatedTrip.startDate && generatedTrip.endDate ? (
                          <>
                            <CalendarIcon2 className="inline-block mr-1 h-4 w-4" />
                            {format(new Date(generatedTrip.startDate), "MMM d, yyyy")} - {format(new Date(generatedTrip.endDate), "MMM d, yyyy")}
                          </>
                        ) : (
                          "Flexible dates"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setActiveTab('form')}>
                        Edit Preferences
                      </Button>
                      <Button 
                        onClick={handleSaveTrip} 
                        disabled={saveTripMutation.isPending}
                      >
                        {saveTripMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Trip
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <TripGeneratedView generatedTrip={generatedTrip.generatedTrip} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}