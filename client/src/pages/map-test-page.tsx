import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapsService } from '@/lib/maps-service';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Search } from 'lucide-react';

export default function MapTestPage() {
  const [location, setLocation] = useState('Barcelona, Spain');
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  // Get map URL on component mount and when location changes
  const fetchMap = async () => {
    if (!location) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get embed map URL
      const response = await fetch(`/api/maps/embed?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      
      if (data.embedUrl) {
        setMapUrl(data.embedUrl);
      } else {
        setError('Could not generate map URL');
      }
      
      // Try to get coordinates
      const geoResponse = await fetch(`/api/maps/geocode?location=${encodeURIComponent(location)}`);
      const geoData = await geoResponse.json();
      
      if (geoData.success && geoData.coordinates) {
        setCoordinates(geoData.coordinates);
      } else {
        setCoordinates(null);
      }
    } catch (err) {
      setError('Error fetching map: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Initial map load
  useEffect(() => {
    fetchMap();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Maps Service Test</h1>
          <p className="text-gray-500 mb-8">
            Test our integration with Google Maps via RapidAPI
          </p>
          
          <div className="flex flex-col space-y-6">
            {/* Map Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-primary-500" />
                  Search Location
                </CardTitle>
                <CardDescription>
                  Enter a location to view on the map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter a location..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={fetchMap}
                    disabled={loading || !location}
                  >
                    {loading ? 'Loading...' : 'Get Map'}
                  </Button>
                </div>
                
                {coordinates && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Coordinates:</p>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                      Latitude: {coordinates.lat.toFixed(6)}, Longitude: {coordinates.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Map Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2 text-primary-500" />
                  Map View
                </CardTitle>
                <CardDescription>
                  Interactive map for {location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full relative rounded-md overflow-hidden border border-gray-200">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-8 w-8 rounded-full mb-2" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  ) : mapUrl ? (
                    <iframe 
                      src={mapUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      title="Google Maps"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">No map available</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(mapUrl, '_blank')}
                    disabled={!mapUrl}
                  >
                    Open in Google Maps
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((position) => {
                          const currentLocation = `${position.coords.latitude},${position.coords.longitude}`;
                          setLocation(currentLocation);
                          fetchMap();
                        });
                      }
                    }}
                  >
                    Use Current Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}