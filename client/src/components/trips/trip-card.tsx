import { format, parseISO } from "date-fns";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Trash2, MoreVertical } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TripCardProps = {
  trip: {
    id: number;
    title: string;
    destination: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string;
  };
};

export default function TripCard({ trip }: TripCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/trips/${trip.id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Trip deleted",
        description: "Your trip has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete trip: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteTrip = () => {
    deleteTripMutation.mutate();
    setShowDeleteDialog(false);
  };

  const getRandomBgImage = () => {
    const images = [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80"
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Stop event propagation to prevent navigation when clicking on dropdown or its items
  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer h-full flex flex-col group relative">
        <Link href={`/trips/${trip.id}`}>
          <div className="h-48 w-full relative overflow-hidden">
            <img 
              src={getRandomBgImage()} 
              alt={trip.destination} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <Badge className={`${getStatusColor(trip.status)}`}>
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
              <h3 className="text-xl font-bold mt-2">{trip.title}</h3>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{trip.destination}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-4 pb-2 flex-grow">
            {trip.startDate && trip.endDate ? (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {format(parseISO(trip.startDate), "MMM d, yyyy")} - {format(parseISO(trip.endDate), "MMM d, yyyy")}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Dates not set</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0 pb-4">
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              <span>Created {format(parseISO(trip.createdAt), "MMM d, yyyy")}</span>
            </div>
          </CardFooter>
        </Link>
        
        {/* Menu button positioned absolutely in the top-right with improved visibility */}
        <div 
          className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
          onClick={handleActionClick}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm rounded-full">
                <MoreVertical className="h-4 w-4 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={5} className="w-48 p-1 border border-gray-200 shadow-lg rounded-lg">
              <DropdownMenuItem 
                onClick={() => navigate(`/trips/${trip.id}/edit`)}
                className="flex items-center py-2 px-3 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Trip
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center py-2 px-3 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <AlertDialogTitle className="text-center text-xl">Delete Trip</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to delete your "<span className="font-medium text-gray-900">{trip.title}</span>" trip to {trip.destination}?
              <p className="mt-2 text-sm text-gray-500">
                This will permanently remove all itineraries, activities, and bookings associated with this trip. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-2 border-t pt-4">
            <AlertDialogCancel className="mt-3 sm:mt-0 w-full sm:w-auto border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrip}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 w-full sm:w-auto"
            >
              {deleteTripMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : "Delete Trip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
