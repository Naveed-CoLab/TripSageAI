import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import { 
  Activity, Calendar, Clock, Coffee, MapPin, Plane, Hotel, 
  Utensils, Camera, Landmark, Star, PlusCircle, X, Search,
  Building, Map, Trash2, Edit, Star as StarIcon, Search as SearchIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

type ItineraryDayProps = {
  day: {
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
  };
  destination: string;
  onAddActivity?: (dayId: number, activity: any) => void;
  onDeleteActivity?: (activityId: number) => void;
};

// Mock data for display purposes (would come from an API in production)
const activityImages = {
  "colosseum": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop",
  "vatican": "https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=2076&auto=format&fit=crop",
  "trevi": "https://images.unsplash.com/photo-1529154691717-3306083d869e?q=80&w=2076&auto=format&fit=crop",
  "spanish steps": "https://images.unsplash.com/photo-1519563144096-349c8ced0b7a?q=80&w=2070&auto=format&fit=crop",
  "pantheon": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=2070&auto=format&fit=crop",
  "florence": "https://images.unsplash.com/photo-1543429945-66b8d5aa0407?q=80&w=2070&auto=format&fit=crop",
  "uffizi": "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?q=80&w=2074&auto=format&fit=crop",
  "michelangelo": "https://images.unsplash.com/photo-1610387368241-d87c095c587e?q=80&w=1974&auto=format&fit=crop",
  "tuscany": "https://images.unsplash.com/photo-1559981421-3e0c0d156773?q=80&w=2070&auto=format&fit=crop",
  "siena": "https://images.unsplash.com/photo-1554773228-9a0579e6d889?q=80&w=2064&auto=format&fit=crop",
  "roman forum": "https://images.unsplash.com/photo-1634649473045-7ead5ef82c1d?q=80&w=2071&auto=format&fit=crop",
  "hotel": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
  "restaurant": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
  "train": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2084&auto=format&fit=crop",
  "airport": "https://images.unsplash.com/photo-1544019601-41b1bcca88c2?q=80&w=2070&auto=format&fit=crop",
  "default": "https://images.unsplash.com/photo-1531219572328-a0171b4448a3?q=80&w=2070&auto=format&fit=crop"
};

const hotelsData = [
  { id: 1, name: "Hotel de Russie", location: "Rome", rating: 4.8, reviews: 521, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop" },
  { id: 2, name: "Hotel Hassler Roma", location: "Rome", rating: 4.7, reviews: 489, image: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?q=80&w=2074&auto=format&fit=crop" },
  { id: 3, name: "Portrait Roma", location: "Rome", rating: 4.9, reviews: 355, image: "https://images.unsplash.com/photo-1587985064135-0366536eab42?q=80&w=2070&auto=format&fit=crop" },
  { id: 4, name: "Hotel Santa Maria Novella", location: "Florence", rating: 4.6, reviews: 412, image: "https://images.unsplash.com/photo-1533117512588-b3c7f04fb4cc?q=80&w=2070&auto=format&fit=crop" },
  { id: 5, name: "Four Seasons Florence", location: "Florence", rating: 4.9, reviews: 385, image: "https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=2070&auto=format&fit=crop" }
];

const restaurantsData = [
  { id: 1, name: "La Pergola", location: "Rome", rating: 4.8, reviews: 732, cuisine: "Italian", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop" },
  { id: 2, name: "Pierluigi", location: "Rome", rating: 4.5, reviews: 581, cuisine: "Seafood", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2074&auto=format&fit=crop" },
  { id: 3, name: "Roscioli", location: "Rome", rating: 4.7, reviews: 623, cuisine: "Roman", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" },
  { id: 4, name: "Enoteca Pinchiorri", location: "Florence", rating: 4.9, reviews: 412, cuisine: "Tuscan", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop" },
  { id: 5, name: "Trattoria Sostanza", location: "Florence", rating: 4.6, reviews: 385, cuisine: "Tuscan", image: "https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?q=80&w=2070&auto=format&fit=crop" }
];

const attractionsData = [
  { id: 1, name: "Colosseum", location: "Rome", rating: 4.8, reviews: 12542, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop" },
  { id: 2, name: "Vatican Museums", location: "Rome", rating: 4.7, reviews: 9841, image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=2076&auto=format&fit=crop" },
  { id: 3, name: "Trevi Fountain", location: "Rome", rating: 4.8, reviews: 8965, image: "https://images.unsplash.com/photo-1529154691717-3306083d869e?q=80&w=2076&auto=format&fit=crop" },
  { id: 4, name: "Uffizi Gallery", location: "Florence", rating: 4.7, reviews: 7532, image: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?q=80&w=2074&auto=format&fit=crop" },
  { id: 5, name: "Cathedral of Santa Maria del Fiore", location: "Florence", rating: 4.9, reviews: 8341, image: "https://images.unsplash.com/photo-1543429945-66b8d5aa0407?q=80&w=2070&auto=format&fit=crop" }
];

export default function ItineraryDay({ day, destination, onAddActivity, onDeleteActivity }: ItineraryDayProps) {
  const [showAddOnSheet, setShowAddOnSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("attractions");
  const [showMapSheet, setShowMapSheet] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Function to get the appropriate icon based on activity type
  const getActivityIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "transportation":
      case "flight":
      case "transit":
        return <Plane className="h-4 w-4 text-blue-600" />;
      case "accommodation":
      case "hotel":
      case "lodging":
        return <Hotel className="h-4 w-4 text-green-600" />;
      case "meal":
      case "food":
      case "restaurant":
        return <Utensils className="h-4 w-4 text-yellow-600" />;
      case "sightseeing":
      case "tour":
        return <Camera className="h-4 w-4 text-purple-600" />;
      case "coffee":
      case "breakfast":
        return <Coffee className="h-4 w-4 text-red-600" />;
      case "attraction":
      case "monument":
        return <Landmark className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-primary-600" />;
    }
  };

  // Function to get the background color based on activity type
  const getActivityBgColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "transportation":
      case "flight":
      case "transit":
        return "bg-blue-50";
      case "accommodation":
      case "hotel":
      case "lodging":
        return "bg-green-50";
      case "meal":
      case "food":
      case "restaurant":
        return "bg-yellow-50";
      case "sightseeing":
      case "tour":
        return "bg-purple-50";
      case "coffee":
      case "breakfast":
        return "bg-red-50";
      case "attraction":
      case "monument":
        return "bg-purple-50";
      default:
        return "bg-primary-50";
    }
  };

  // Function to get an image URL for an activity based on its title or type
  const getActivityImage = (activity: any) => {
    // Check if the activity title or location contains any of our image keywords
    const titleLower = activity.title?.toLowerCase() || "";
    const locationLower = activity.location?.toLowerCase() || "";
    const typeLower = activity.type?.toLowerCase() || "";
    
    for (const [keyword, url] of Object.entries(activityImages)) {
      if (titleLower.includes(keyword) || locationLower.includes(keyword)) {
        return url;
      }
    }
    
    // If no keyword match, return image based on type
    if (typeLower.includes("hotel") || typeLower.includes("accommodation")) {
      return activityImages.hotel;
    } else if (typeLower.includes("restaurant") || typeLower.includes("food") || typeLower.includes("meal")) {
      return activityImages.restaurant;
    } else if (typeLower.includes("train") || typeLower.includes("transport")) {
      return activityImages.train;
    } else if (typeLower.includes("flight") || typeLower.includes("airport")) {
      return activityImages.airport;
    }
    
    // Default image if nothing matches
    return activityImages.default;
  };

  // Helper to render rating bubbles
  const renderRating = (rating: number, reviewCount?: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-yellow-400">
              {i < fullStars ? (
                <StarIcon className="h-4 w-4 fill-current" />
              ) : i === fullStars && hasHalfStar ? (
                <StarIcon className="h-4 w-4 fill-current" />
              ) : (
                <StarIcon className="h-4 w-4 stroke-current fill-transparent" />
              )}
            </div>
          ))}
        </div>
        {reviewCount && (
          <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
        )}
      </div>
    );
  };

  // Handle adding a new activity
  const handleAddActivity = (item: any) => {
    const newActivity = {
      tripDayId: day.id,
      title: item.name,
      description: `Visit ${item.name} in ${item.location}`,
      location: item.location,
      type: selectedTab === "hotels" ? "hotel" : (selectedTab === "restaurants" ? "restaurant" : "attraction")
    };
    
    if (onAddActivity) {
      onAddActivity(day.id, newActivity);
    }
    setShowAddOnSheet(false);
  };

  // Handle activity deletion
  const handleDeleteActivity = () => {
    if (onDeleteActivity && selectedActivityId) {
      onDeleteActivity(selectedActivityId);
      setShowDeleteDialog(false);
    }
  };

  // Function to open the delete dialog
  const confirmDelete = (activityId: number) => {
    setSelectedActivityId(activityId);
    setShowDeleteDialog(true);
  };

  // Filter data based on search and destination
  const filterData = (data: any[]) => {
    const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim());
    return data
      .filter(item => {
        const locationMatch = item.location.toLowerCase().includes(destination.toLowerCase());
        const searchMatch = searchTerms.some(term => 
          item.name.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          (item.cuisine && item.cuisine.toLowerCase().includes(term))
        );
        return locationMatch && (searchQuery === "" || searchMatch);
      });
  };

  // Show map for an activity
  const openMapForActivity = (activity: any) => {
    setSelectedPlace({
      title: activity.title,
      location: activity.location || destination
    });
    setShowMapSheet(true);
  };

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-800 font-medium">{day.dayNumber}</span>
            </div>
            <CardTitle className="text-lg">{day.title}</CardTitle>
          </div>
          
          {day.date && (
            <Badge variant="outline" className="flex items-center gap-1 bg-white">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {format(parseISO(day.date), "EEE, MMM d, yyyy")}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          {day.activities && day.activities.length > 0 ? (
            day.activities.map((activity) => {
              const imageUrl = getActivityImage(activity);
              
              return (
                <div 
                  key={activity.id} 
                  className={`relative rounded-lg border border-gray-200 overflow-hidden group ${getActivityBgColor(activity.type)}`}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex space-x-1">
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="h-7 w-7 bg-white shadow-sm"
                      onClick={() => openMapForActivity(activity)}
                    >
                      <Map className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => confirmDelete(activity.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="flex md:flex-row flex-col">
                    {/* Image section */}
                    <div className="relative w-full md:w-1/3 h-40 md:h-auto">
                      <img 
                        src={imageUrl} 
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 md:hidden">
                        <h5 className="text-sm font-medium text-white">{activity.title}</h5>
                      </div>
                    </div>
                    
                    {/* Content section */}
                    <div className="p-4 flex-1">
                      <div className="flex items-start">
                        <div className="hidden md:flex flex-shrink-0 h-6 w-6 rounded-full items-center justify-center mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="w-full">
                          <div className="flex items-start justify-between">
                            <h5 className="text-sm font-medium hidden md:block">{activity.title}</h5>
                            
                            {/* Random rating just for demonstration */}
                            {activity.type?.toLowerCase().includes("hotel") || 
                             activity.type?.toLowerCase().includes("restaurant") ||
                             activity.type?.toLowerCase().includes("attraction") ? (
                              <div className="ml-auto">
                                {renderRating(4.5 + Math.random() * 0.5, Math.floor(100 + Math.random() * 900))}
                              </div>
                            ) : null}
                          </div>
                          
                          {activity.time && (
                            <div className="flex items-center text-xs text-gray-500 mt-2">
                              <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                              {activity.time}
                            </div>
                          )}
                          
                          {activity.location && (
                            <div className="flex items-center text-xs text-gray-500 mt-1.5">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                              {activity.location}
                            </div>
                          )}
                          
                          {activity.description && (
                            <p className="text-xs text-gray-600 mt-2">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-600 mb-1">No activities scheduled</h3>
              <p className="text-xs text-gray-500 mb-3">Add activities to fill your day</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddOnSheet(true)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                Add Activity
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {day.activities?.length > 0 && (
        <CardFooter className="bg-gray-50 px-4 py-3 flex justify-center border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddOnSheet(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Add On
          </Button>
        </CardFooter>
      )}
      
      {/* Add-on sheet */}
      <Sheet open={showAddOnSheet} onOpenChange={setShowAddOnSheet}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="px-4 py-4 border-b sticky top-0 bg-white z-10">
            <SheetTitle>Add to your itinerary</SheetTitle>
            <SheetDescription>
              Add places to visit, restaurants or accommodations for {destination}
            </SheetDescription>
            
            <div className="mt-4 relative">
              <SearchIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search places..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </SheetHeader>
          
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="mt-2"
          >
            <TabsList className="w-full h-auto p-1 bg-gray-100 rounded-none border-b">
              <TabsTrigger 
                value="attractions" 
                className="flex-1 py-2 data-[state=active]:bg-white"
              >
                <Landmark className="h-4 w-4 mr-2" />
                Attractions
              </TabsTrigger>
              <TabsTrigger 
                value="hotels" 
                className="flex-1 py-2 data-[state=active]:bg-white"
              >
                <Hotel className="h-4 w-4 mr-2" />
                Hotels
              </TabsTrigger>
              <TabsTrigger 
                value="restaurants" 
                className="flex-1 py-2 data-[state=active]:bg-white"
              >
                <Utensils className="h-4 w-4 mr-2" />
                Restaurants
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="attractions" className="p-0 mt-0">
              <div className="space-y-2 p-2">
                {filterData(attractionsData).map(attraction => (
                  <div 
                    key={attraction.id}
                    className="flex border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAddActivity(attraction)}
                  >
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={attraction.image} 
                        alt={attraction.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex-1">
                      <h3 className="font-medium text-sm">{attraction.name}</h3>
                      <p className="text-xs text-gray-500">{attraction.location}</p>
                      <div className="mt-1">
                        {renderRating(attraction.rating, attraction.reviews)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filterData(attractionsData).length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <Landmark className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No attractions found for '{searchQuery}' in {destination}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="hotels" className="p-0 mt-0">
              <div className="space-y-2 p-2">
                {filterData(hotelsData).map(hotel => (
                  <div 
                    key={hotel.id}
                    className="flex border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAddActivity(hotel)}
                  >
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex-1">
                      <h3 className="font-medium text-sm">{hotel.name}</h3>
                      <p className="text-xs text-gray-500">{hotel.location}</p>
                      <div className="mt-1">
                        {renderRating(hotel.rating, hotel.reviews)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filterData(hotelsData).length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <Hotel className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hotels found for '{searchQuery}' in {destination}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="restaurants" className="p-0 mt-0">
              <div className="space-y-2 p-2">
                {filterData(restaurantsData).map(restaurant => (
                  <div 
                    key={restaurant.id}
                    className="flex border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAddActivity(restaurant)}
                  >
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex-1">
                      <h3 className="font-medium text-sm">{restaurant.name}</h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{restaurant.location}</span>
                        <span className="mx-1">•</span>
                        <span>{restaurant.cuisine}</span>
                      </div>
                      <div className="mt-1">
                        {renderRating(restaurant.rating, restaurant.reviews)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filterData(restaurantsData).length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <Utensils className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No restaurants found for '{searchQuery}' in {destination}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <SheetFooter className="sticky bottom-0 border-t p-4 bg-white">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this activity from your itinerary?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Map Sheet */}
      <Sheet open={showMapSheet} onOpenChange={setShowMapSheet}>
        <SheetContent className="p-0 w-full max-w-md">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Map View</SheetTitle>
            {selectedPlace && (
              <SheetDescription>
                {selectedPlace.title} - {selectedPlace.location}
              </SheetDescription>
            )}
          </SheetHeader>
          
          <div className="h-[500px] w-full relative">
            {selectedPlace && (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=12.4,41.8,12.6,42.0&layer=mapnik&marker=41.9,12.5`}
                style={{ border: 0 }}
                title="Location Map"
                className="w-full h-full"
              />
            )}
          </div>
          
          <SheetFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setShowMapSheet(false)} className="w-full">
              Close Map
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
