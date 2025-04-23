import { useLocation } from "wouter";
import PopularFlightDestinations from "@/components/flights/popular-flight-destinations";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

export default function FlightDestinationsSection() {
  const [, navigate] = useLocation();

  // Handle flight destination selection
  const handleDestinationSelect = (destinationName: string) => {
    navigate(`/flights?destination=${encodeURIComponent(destinationName)}`);
  };

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Explore Flight Destinations</h2>
          <p className="mt-3 text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing deals to these popular destinations
          </p>
        </div>

        <PopularFlightDestinations 
          onDestinationSelect={handleDestinationSelect} 
          layout="scroll"
          showTitle={false}
        />
        
        <div className="mt-10 text-center">
          <Button 
            onClick={() => navigate("/flights")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Plane className="mr-2 h-5 w-5" />
            Find More Flight Deals
          </Button>
        </div>
      </div>
    </section>
  );
}