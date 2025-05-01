import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AiTrip {
  id: number;
  userId: number;
  username: string;
  userEmail: string;
  destination: string;
  dateRange: string;
  tripType: string;
  interests: string[];
  withPets: boolean;
  prompt: string;
  saved: boolean;
  savedTripId: number | null;
  savedTripTitle: string | null;
  savedTripStatus: string | null;
  createdAt: string;
}

export default function AiTripsList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: aiTrips, isLoading, error } = useQuery<AiTrip[]>({
    queryKey: ['/api/admin/ai-trips'],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load AI-generated trips. Please try again.",
      variant: "destructive",
    });
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive mb-4">Failed to load AI-generated trips</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const filteredTrips = aiTrips?.filter(trip => 
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.tripType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.interests.some(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI-Generated Trips</CardTitle>
        <CardDescription>
          View all trips generated with our AI trip planner
        </CardDescription>
        
        <div className="flex items-center mt-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by destination, username, or trip type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Trip Type</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Saved</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No AI-generated trips found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{trip.username}</span>
                      <span className="text-xs text-muted-foreground">{trip.userEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{trip.destination}</TableCell>
                  <TableCell>{trip.tripType}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trip.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trip.saved ? (
                      <Badge variant="success">Yes - {trip.savedTripTitle}</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/ai-trips/${trip.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}