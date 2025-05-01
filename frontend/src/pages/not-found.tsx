import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Map, Compass, ArrowLeft, PlaneTakeoff } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const destinations = [
    "Paris", "Tokyo", "New York", "Rome", "Barcelona", 
    "Sydney", "Dubai", "London", "Bali", "Santorini"
  ];
  
  // Get random destinations
  const suggestedDestinations = destinations
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-sky-100">
      <Card className="w-full max-w-md mx-4 border-blue-200 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Map className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Destination Not Found</h1>
            <div className="flex items-center justify-center text-amber-600 mb-4">
              <MapPin className="h-5 w-5 mr-1" />
              <span className="text-lg">404 Error</span>
            </div>
            
            <p className="text-gray-600 mb-6">
              Looks like you've wandered off the map! The destination you're looking for doesn't exist or has moved to a new location.
            </p>
            
            <div className="w-full bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <Compass className="h-4 w-4 mr-1" />
                Popular Destinations
              </h3>
              <ul className="text-gray-700 space-y-1">
                {suggestedDestinations.map((destination, index) => (
                  <li key={index} className="flex items-center">
                    <PlaneTakeoff className="h-3 w-3 mr-2 text-blue-500" />
                    {destination}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Link href="/">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
