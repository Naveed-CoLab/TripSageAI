import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  Loader2, 
  Plane, 
  MapPin, 
  Calendar as CalendarIcon2, 
  Check, 
  Globe, 
  Hotel,
  Coffee,
  Compass,
  Camera,
  ShoppingBag,
  Utensils,
  Mountain,
  Palmtree,
  Music,
  LibraryBig,
  GalleryHorizontalEnd,
  TicketCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { TripGeneratedView } from '@/components/trips/trip-generated-view';
import { useLocation } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// Define types for AI trip generation
type GeneratedTrip = {
  id: number;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  tripType: string;
  interests: string[];
  withPets: boolean;
  countryFacts?: string[];
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
  { id: 'solo', label: 'Solo Trip', icon: <Compass className="h-5 w-5" /> },
  { id: 'couple', label: 'Couple Trip', icon: <Hotel className="h-5 w-5" /> },
  { id: 'family', label: 'Family Trip', icon: <TicketCheck className="h-5 w-5" /> },
  { id: 'friends', label: 'Friends Trip', icon: <Music className="h-5 w-5" /> },
  { id: 'business', label: 'Business Trip', icon: <Plane className="h-5 w-5" /> },
];

// Map interest icons
const interestIcons: Record<string, React.ReactNode> = {
  'culture': <LibraryBig className="h-5 w-5" />,
  'food': <Utensils className="h-5 w-5" />,
  'nature': <Palmtree className="h-5 w-5" />,
  'adventure': <Mountain className="h-5 w-5" />,
  'relaxation': <Coffee className="h-5 w-5" />,
  'shopping': <ShoppingBag className="h-5 w-5" />,
  'nightlife': <Music className="h-5 w-5" />,
  'family': <TicketCheck className="h-5 w-5" />,
  'art': <GalleryHorizontalEnd className="h-5 w-5" />,
  'photography': <Camera className="h-5 w-5" />,
};

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
  
  // Loading dialog state
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [countryFacts, setCountryFacts] = useState<string[]>([]);
  
  // Rotate through facts during loading
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (loadingDialogOpen && countryFacts.length > 0) {
      interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % countryFacts.length);
      }, 5000); // Show a new fact every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingDialogOpen, countryFacts.length]);
  
  // Generate trip mutation
  const generateTripMutation = useMutation({
    mutationFn: (data: any) => {
      // Show loading dialog with initial placeholder facts
      setCountryFacts([
        `Discovering exciting adventures in ${destination}...`,
        `Did you know that ${destination} is known for its unique culture and history?`,
        `Planning your perfect trip to ${destination}...`,
        `Researching local attractions and hidden gems in ${destination}...`,
        `Building your personalized itinerary for ${destination}...`
      ]);
      setCurrentFactIndex(0);
      setLoadingDialogOpen(true);
      
      return apiRequest('/api/ai-trips', 'POST', data);
    },
    onSuccess: (data: any) => {
      console.log('Trip generated successfully:', data);
      
      // Close loading dialog
      setLoadingDialogOpen(false);
      
      const tripData = data as GeneratedTrip;
      setGeneratedTrip(tripData);
      setActiveTab('result');
      
      toast({
        title: 'Trip Generated!',
        description: 'Your AI-powered trip has been created. You can now review it.',
      });
      
      // If the API returned country facts, save them for later use
      if (tripData.countryFacts && tripData.countryFacts.length > 0) {
        setCountryFacts(tripData.countryFacts);
      }
    },
    onError: (error) => {
      // Close loading dialog on error
      setLoadingDialogOpen(false);
      
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
      console.log('Trip saved successfully:', data);
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
      <h1 className="text-3xl font-bold mb-8 text-center">AI Trip Generator Tool</h1>
      
      {/* Loading Dialog with Country Facts */}
      <Dialog open={loadingDialogOpen} onOpenChange={setLoadingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 animate-pulse text-primary" />
              Generating Your Trip to {destination}
            </DialogTitle>
            <DialogDescription>
              This may take a minute as our AI crafts a detailed itinerary for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <Globe className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            {countryFacts.length > 0 && (
              <div className="bg-muted p-4 rounded-lg mt-4 max-w-md min-h-[100px] flex items-center">
                <div className="relative">
                  <div className="animate-fade-in-up">
                    <p className="text-center text-sm">{countryFacts[currentFactIndex]}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-1 mt-4">
              {countryFacts.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1.5 w-6 rounded-full ${index === currentFactIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {tripTypeOptions.map(option => (
                      <div
                        key={option.id}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer border border-border transition-all hover:border-primary ${
                          tripType === option.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-card hover:bg-muted/50'
                        }`}
                        onClick={() => setTripType(option.id)}
                      >
                        <div className={`mb-2 p-2 rounded-full ${
                          tripType === option.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {option.icon}
                        </div>
                        <span className="text-xs font-medium text-center">{option.label}</span>
                        {tripType === option.id && (
                          <Check className="h-4 w-4 text-primary mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {interestOptions.map(option => (
                      <div
                        key={option.id}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer border border-border transition-all hover:border-primary ${
                          selectedInterests.includes(option.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-card hover:bg-muted/50'
                        }`}
                        onClick={() => toggleInterest(option.id)}
                      >
                        <div className={`mb-2 p-2 rounded-full ${
                          selectedInterests.includes(option.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {interestIcons[option.id] || <Compass className="h-5 w-5" />}
                        </div>
                        <span className="text-xs font-medium text-center">{option.label}</span>
                        {selectedInterests.includes(option.id) && (
                          <Check className="h-4 w-4 text-primary mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Options</Label>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="withPets"
                        checked={withPets}
                        onCheckedChange={(checked) => setWithPets(checked === true)}
                        className={withPets ? "bg-primary border-primary" : ""}
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-full ${withPets ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Palmtree className="h-4 w-4" />
                        </div>
                        <Label htmlFor="withPets" className="font-medium">I'm traveling with pets</Label>
                      </div>
                    </div>
                    {withPets && (
                      <div className="mt-2 ml-9 text-sm text-muted-foreground">
                        We'll recommend pet-friendly accommodations and activities for your trip.
                      </div>
                    )}
                  </div>
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