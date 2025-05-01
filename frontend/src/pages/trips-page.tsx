import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import TripCard from "@/components/trips/trip-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";

export default function TripsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ["/api/trips"],
  });
  
  const filteredTrips = searchTerm && trips
    ? trips.filter((trip: any) => 
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : trips;
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Trips</h1>
            <p className="text-gray-600 mt-1">Manage your travel plans</p>
          </div>
          
          <Button className="mt-4 sm:mt-0" onClick={() => navigate("/trips/create")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Trip
          </Button>
        </div>
        
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Search your trips by title or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Error loading trips</h3>
            <p className="mt-2 text-sm text-gray-500">
              {(error as Error).message || "An unknown error occurred"}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredTrips?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <h3 className="text-lg font-medium text-gray-900">No trips matching "{searchTerm}"</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try another search term or clear the search
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900">You don't have any trips yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create your first trip by clicking the button above
                </p>
                <Button className="mt-4" onClick={() => navigate("/trips/create")}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Trip
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
