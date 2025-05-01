import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Ticket, DollarSign, Check, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type BookingCardProps = {
  booking: {
    id: number;
    tripId: number;
    type: string;
    title: string;
    provider: string | null;
    price: string | null;
    details: any;
    confirmed: boolean;
  };
};

// List of hotel booking providers with their URLs for redirection
const hotelBookingProviders = [
  {
    name: "Booking.com",
    url: "https://www.booking.com/searchresults.html",
    searchParams: (query: string) => `?ss=${encodeURIComponent(query)}`
  },
  {
    name: "Hotels.com",
    url: "https://www.hotels.com/search.do",
    searchParams: (query: string) => `?q-destination=${encodeURIComponent(query)}`
  },
  {
    name: "Expedia",
    url: "https://www.expedia.com/Hotel-Search",
    searchParams: (query: string) => `?destination=${encodeURIComponent(query)}`
  },
  {
    name: "Airbnb",
    url: "https://www.airbnb.com/s",
    searchParams: (query: string) => `/${encodeURIComponent(query)}/homes`
  }
];

export default function BookingCard({ booking }: BookingCardProps) {
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Extract location from booking details
  useEffect(() => {
    // Check if booking is a hotel type
    const isHotel = booking.type.toLowerCase() === 'hotel' || booking.type.toLowerCase() === 'accommodation';
    
    if (isHotel) {
      let location = booking.title;
      
      // If booking has location details, use that
      if (booking.details) {
        const details = typeof booking.details === 'string' 
          ? JSON.parse(booking.details) 
          : booking.details;
          
        if (details.location) {
          location = details.location;
        }
      }
      
      setMapLocation(location);
    }
  }, [booking]);
  
  // Initialize map when component mounts
  useEffect(() => {
    // Only initialize map if we have a location and the map is visible
    if (mapLocation && showMap && mapRef.current) {
      // Using OpenStreetMap which is free and doesn't require any API key
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '150px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      
      // Encode the location for URL safety
      const encodedLocation = encodeURIComponent(mapLocation);
      
      // Create an OpenStreetMap iframe with the location
      const openStreetMapHtml = `
        <html>
          <head>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
                  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
                  crossorigin=""/>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
                    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
                    crossorigin=""></script>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                font-family: system-ui, sans-serif;
              }
              #map {
                height: 100%;
                width: 100%;
                border-radius: 8px;
              }
              .leaflet-marker-icon {
                filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
              }
              .map-attribution {
                font-size: 10px;
                position: absolute;
                bottom: 0;
                right: 0;
                background: rgba(255,255,255,0.7);
                padding: 2px 5px;
                border-radius: 3px;
                z-index: 1000;
              }
            </style>
          </head>
          <body>
            <div id="map"></div>
            <script>
              // Initialize the map
              const map = L.map('map', {
                zoomControl: false,
                attributionControl: false
              });
              
              // Add the OpenStreetMap tiles
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              
              // Add a marker for the location
              const marker = L.marker([0, 0]).addTo(map);
              
              // Use the Nominatim service to geocode the location
              fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent("${mapLocation}")}\`)
                .then(response => response.json())
                .then(data => {
                  if (data && data.length > 0) {
                    // Set map view to the coordinates
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    map.setView([lat, lon], 15);
                    marker.setLatLng([lat, lon]);
                    
                    // Add a popup with the location name
                    marker.bindPopup("${mapLocation}").openPopup();
                  } else {
                    // Fallback if geocoding fails
                    document.getElementById('map').innerHTML = \`
                      <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f0f4f8; text-align:center; padding:20px; border-radius:8px;">
                        <div style="font-size:24px; margin-bottom:10px;">📍</div>
                        <div style="font-weight:600; font-size:14px;">${mapLocation}</div>
                        <div style="font-size:12px; color:#666; margin-top:10px;">Location coordinates not found</div>
                      </div>
                    \`;
                  }
                })
                .catch(error => {
                  console.error('Error loading map:', error);
                  document.getElementById('map').innerHTML = \`
                    <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f0f4f8; text-align:center; padding:20px; border-radius:8px;">
                      <div style="font-size:24px; margin-bottom:10px;">📍</div>
                      <div style="font-weight:600; font-size:14px;">${mapLocation}</div>
                      <div style="font-size:12px; color:#666; margin-top:10px;">Map could not be loaded</div>
                    </div>
                  \`;
                });
                
              // Add attribution
              const attribution = document.createElement('div');
              attribution.className = 'map-attribution';
              attribution.innerHTML = '© OpenStreetMap contributors';
              document.body.appendChild(attribution);
            </script>
          </body>
        </html>
      `;
      
      iframe.srcdoc = openStreetMapHtml;
      
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(iframe);
      }
    }
  }, [mapLocation, showMap]);
  
  // Function to get icon based on booking type
  const getBookingIcon = () => {
    switch (booking.type.toLowerCase()) {
      case "flight":
        return <Plane className="h-5 w-5 text-blue-500" />;
      case "hotel":
      case "accommodation":
        return <Hotel className="h-5 w-5 text-green-500" />;
      case "activity":
      case "ticket":
      case "tour":
        return <Ticket className="h-5 w-5 text-purple-500" />;
      default:
        return <DollarSign className="h-5 w-5 text-primary-500" />;
    }
  };

  // Function to get background color based on booking type
  const getBookingColor = () => {
    switch (booking.type.toLowerCase()) {
      case "flight":
        return "bg-blue-50 border-blue-200";
      case "hotel":
      case "accommodation":
        return "bg-green-50 border-green-200";
      case "activity":
      case "ticket":
      case "tour":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDetails = () => {
    if (!booking.details) return null;
    
    const details = typeof booking.details === 'string' 
      ? JSON.parse(booking.details) 
      : booking.details;
    
    return (
      <div className="mt-3 space-y-1 text-sm">
        {Object.entries(details).map(([key, value]) => {
          // Skip if value is null, undefined, or an empty string
          if (value === null || value === undefined || value === '') return null;
          
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
            
          return (
            <div key={key} className="flex justify-between">
              <span className="text-gray-500">{formattedKey}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle booking action based on type
  const handleBookingAction = () => {
    const bookingType = booking.type.toLowerCase();
    
    if (bookingType === 'hotel' || bookingType === 'accommodation') {
      setShowBookingOptions(true);
      setShowMap(true); // Show map when booking options are displayed
    } else {
      // For other booking types, just show details
      console.log("Viewing details for:", booking.title);
    }
  };

  const redirectToBookingProvider = (provider: typeof hotelBookingProviders[0]) => {
    // Construct search query from booking details
    let searchQuery = mapLocation || booking.title;
    
    // Create the full URL with search parameters
    const fullUrl = `${provider.url}${provider.searchParams(searchQuery)}`;
    
    // Open in a new tab
    window.open(fullUrl, '_blank');
  };

  // Function to show the map inline
  const openInMaps = () => {
    if (mapLocation) {
      // Show the map
      setShowMap(true);
      
      // If booking options aren't already showing, show them
      if (!showBookingOptions) {
        setShowBookingOptions(true);
      }
      
      // Focus on the map element
      if (mapRef.current) {
        mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Check if this is a hotel booking
  const isHotelBooking = booking.type.toLowerCase() === 'hotel' || booking.type.toLowerCase() === 'accommodation';

  return (
    <Card className={`overflow-hidden border ${getBookingColor()} hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="rounded-full p-2 bg-white shadow-sm">
              {getBookingIcon()}
            </div>
            <div>
              <h3 className="font-medium">{booking.title}</h3>
              {booking.provider && (
                <p className="text-sm text-gray-500">{booking.provider}</p>
              )}
            </div>
          </div>
          
          {booking.confirmed ? (
            <Badge className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" /> Confirmed
            </Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
        </div>
        
        {booking.price && (
          <div className="mt-3 flex items-center text-lg font-semibold">
            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
            {booking.price}
          </div>
        )}
        
        {formatDetails()}
        
        {/* Map for hotel bookings */}
        {isHotelBooking && mapLocation && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                Location
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-2 text-blue-600"
                onClick={openInMaps}
              >
                Show Map
              </Button>
            </div>
            
            <div 
              ref={mapRef} 
              className="h-[150px] w-full rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative mb-3"
            >
              {!showMap && (
                <Skeleton className="h-full w-full absolute inset-0" />
              )}
            </div>
          </div>
        )}
        
        {/* Booking options for hotels */}
        {showBookingOptions && isHotelBooking && (
          <div className="mt-4 border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-3">Book this accommodation with:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hotelBookingProviders.map((provider) => {
                // Assign different colors to different providers
                const getProviderColors = (name: string) => {
                  switch (name) {
                    case "Booking.com":
                      return "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100";
                    case "Hotels.com":
                      return "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100";
                    case "Expedia":
                      return "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100";
                    case "Airbnb":
                      return "bg-red-50 border-red-200 text-red-600 hover:bg-red-100";
                    default:
                      return "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                  }
                };
                
                return (
                  <Button 
                    key={provider.name}
                    variant="outline" 
                    size="sm"
                    className={`justify-start py-3 border ${getProviderColors(provider.name)}`}
                    onClick={() => redirectToBookingProvider(provider)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate">{provider.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-3 border-t flex justify-end">
        {!showBookingOptions ? (
          <Button 
            variant={isHotelBooking ? "default" : "outline"}
            size="sm"
            className={isHotelBooking ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
            onClick={handleBookingAction}
          >
            {isHotelBooking ? (
              <>
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Book Now
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Details
              </>
            )}
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600"
              onClick={() => {
                setShowBookingOptions(false);
                setShowMap(false);
              }}
            >
              Hide Options
            </Button>
            {isHotelBooking && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => openInMaps()}
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                View Map
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
