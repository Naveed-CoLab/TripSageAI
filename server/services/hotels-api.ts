//HTTP client library 
import axios from 'axios';

// Hotel data structure to maintain consistency with existing frontend
interface HotelResult {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  price: number;
  currency: string;
  imageUrl: string;
  roomTypes: string[];
}

interface HotelDetail extends HotelResult {
  description: string;
  amenities: string[];
  offers: any[];
}

/**
 * Mock API service for hotels using realistic data patterns
 * This uses a combination of pre-defined data and dynamic generation
 * to provide realistic hotel search results when external APIs are unavailable
 */
class HotelsApiService {
  // Pre-defined list of popular hotel chains to create realistic names
  private hotelChains = [
    'Marriott', 'Hilton', 'Hyatt', 'Four Seasons', 'Ritz-Carlton', 
    'Sheraton', 'Holiday Inn', 'Westin', 'Radisson', 'InterContinental',
    'Novotel', 'Ibis', 'Best Western', 'Crowne Plaza', 'DoubleTree',
    'Renaissance', 'Fairmont', 'Sofitel', 'Hampton', 'Ramada'
  ];
  
  // Common hotel amenities for realistic data
  private amenities = [
    'Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Room Service',
    'Business Center', 'Spa', 'Airport Shuttle', 'Parking', 'Concierge Service',
    'Laundry Service', 'Air Conditioning', 'Conference Room', 'Bar/Lounge', 
    'Breakfast Included', '24-Hour Front Desk', 'Non-smoking Rooms', 'Accessible Rooms',
    'Pet Friendly', 'Coffee Maker in Room', 'Free Toiletries', 'Safety Deposit Box'
  ];
  
  // Room types for hotels
  private roomTypes = [
    'Standard Room', 'Deluxe Room', 'Superior Room', 'Suite', 'Executive Suite',
    'Junior Suite', 'Family Room', 'Connecting Rooms', 'Twin Room', 'King Room',
    'Queen Room', 'Studio', 'Apartment', 'Penthouse', 'Bungalow', 'Villa'
  ];
  
  // Country-specific amenities and descriptions
  private countrySpecifics: Record<string, { amenities: string[], descriptions: string[] }> = {
    'USA': {
      amenities: ['In-room Coffee Machine', 'Ice Machine', 'Vending Machine'],
      descriptions: [
        'Experience American hospitality at its finest in this centrally located hotel.',
        'A modern hotel with spacious rooms and American-style comfort.'
      ]
    },
    'France': {
      amenities: ['Gourmet Restaurant', 'Wine Bar', 'Croissant Breakfast'],
      descriptions: [
        'Elegant Parisian hotel with stunning views and French sophistication.',
        'A boutique hotel celebrating French art and culture in a historic building.'
      ]
    },
    'Italy': {
      amenities: ['Italian Restaurant', 'Espresso Machine', 'Terrace'],
      descriptions: [
        'Charming Italian hotel with traditional architecture and modern amenities.',
        'Experience the dolce vita in this stylish Italian accommodation.'
      ]
    },
    'UK': {
      amenities: ['Tea Making Facilities', 'Full English Breakfast', 'Pub On-site'],
      descriptions: [
        'Classic British hotel offering comfort and elegance in the heart of the city.',
        'A sophisticated London hotel with traditional British charm and service.'
      ]
    },
    'Japan': {
      amenities: ['Japanese Bath', 'Tatami Room Option', 'Tea Ceremony'],
      descriptions: [
        'Modern Japanese hotel blending traditional elements with contemporary design.',
        'Experience Japanese hospitality and attention to detail in this peaceful retreat.'
      ]
    },
    'Spain': {
      amenities: ['Tapas Bar', 'Outdoor Terrace', 'Late Night Service'],
      descriptions: [
        'Vibrant Spanish hotel with Mediterranean flair and warm hospitality.',
        'Located in the heart of the city, this hotel captures the essence of Spanish lifestyle.'
      ]
    }
  };

  // Hotel images from Unsplash (free to use)
  private hotelImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
    'https://images.unsplash.com/photo-1568084680786-a84f91d1153c',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
    'https://images.unsplash.com/photo-1631049421450-348ccd7f8949',
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f'
  ];

  // City information with coordinates for realistic locations
  private cities: Record<string, { country: string, lat: number, lng: number, neighborhoods: string[] }> = {
    'New York': {
      country: 'USA',
      lat: 40.7128,
      lng: -74.0060,
      neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Midtown', 'SoHo', 'Times Square', 'Upper East Side']
    },
    'London': {
      country: 'UK',
      lat: 51.5074,
      lng: -0.1278,
      neighborhoods: ['Westminster', 'Kensington', 'Chelsea', 'Soho', 'Mayfair', 'Shoreditch', 'Notting Hill']
    },
    'Paris': {
      country: 'France',
      lat: 48.8566,
      lng: 2.3522,
      neighborhoods: ['Le Marais', 'Saint-Germain-des-Prés', 'Montmartre', 'Champs-Élysées', 'Eiffel Tower', 'Latin Quarter']
    },
    'Tokyo': {
      country: 'Japan',
      lat: 35.6762,
      lng: 139.6503,
      neighborhoods: ['Shinjuku', 'Shibuya', 'Ginza', 'Roppongi', 'Asakusa', 'Akihabara', 'Ueno']
    },
    'Madrid': {
      country: 'Spain',
      lat: 40.4168,
      lng: -3.7038,
      neighborhoods: ['Sol', 'Salamanca', 'La Latina', 'Malasaña', 'Chueca', 'Retiro', 'Chamberí']
    },
    'Rome': {
      country: 'Italy',
      lat: 41.9028,
      lng: 12.4964,
      neighborhoods: ['Trastevere', 'Monti', 'Campo de\' Fiori', 'Testaccio', 'Prati', 'Esquilino', 'San Lorenzo']
    },
    'Barcelona': {
      country: 'Spain',
      lat: 41.3851,
      lng: 2.1734,
      neighborhoods: ['Gothic Quarter', 'Eixample', 'El Born', 'Barceloneta', 'Gracia', 'Poblenou', 'Sant Antoni']
    },
    'Berlin': {
      country: 'Germany',
      lat: 52.5200,
      lng: 13.4050,
      neighborhoods: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Friedrichshain', 'Charlottenburg', 'Neukölln', 'Schöneberg']
    },
    'Dubai': {
      country: 'UAE',
      lat: 25.2048,
      lng: 55.2708,
      neighborhoods: ['Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Al Barsha', 'Deira', 'Business Bay', 'Jumeirah Beach']
    },
    'Sydney': {
      country: 'Australia',
      lat: -33.8688,
      lng: 151.2093,
      neighborhoods: ['The Rocks', 'Darling Harbour', 'Bondi', 'Surry Hills', 'Paddington', 'Darlinghurst', 'Newtown']
    },
    'Miami': {
      country: 'USA',
      lat: 25.7617,
      lng: -80.1918,
      neighborhoods: ['South Beach', 'Downtown', 'Brickell', 'Wynwood', 'Coconut Grove', 'Little Havana', 'Coral Gables']
    },
    'Chicago': {
      country: 'USA',
      lat: 41.8781,
      lng: -87.6298,
      neighborhoods: ['The Loop', 'River North', 'Gold Coast', 'Lincoln Park', 'Wicker Park', 'Streeterville', 'Lakeview']
    },
    'Los Angeles': {
      country: 'USA',
      lat: 34.0522,
      lng: -118.2437,
      neighborhoods: ['Hollywood', 'Beverly Hills', 'Santa Monica', 'Venice', 'Downtown', 'Silver Lake', 'West Hollywood']
    },
    'Las Vegas': {
      country: 'USA',
      lat: 36.1699,
      lng: -115.1398,
      neighborhoods: ['The Strip', 'Downtown', 'Summerlin', 'Henderson', 'Spring Valley', 'North Las Vegas', 'Chinatown']
    },
    'San Francisco': {
      country: 'USA',
      lat: 37.7749,
      lng: -122.4194,
      neighborhoods: ['Union Square', 'Fisherman\'s Wharf', 'Mission District', 'Hayes Valley', 'Castro', 'North Beach', 'SoMa']
    },
    'Washington': {
      country: 'USA',
      lat: 38.9072,
      lng: -77.0369,
      neighborhoods: ['Georgetown', 'Dupont Circle', 'Adams Morgan', 'Capitol Hill', 'Navy Yard', 'Foggy Bottom', 'Shaw']
    },
    'Toronto': {
      country: 'Canada',
      lat: 43.6532,
      lng: -79.3832,
      neighborhoods: ['Downtown', 'Yorkville', 'Entertainment District', 'Distillery District', 'Queen West', 'Liberty Village', 'Harbourfront']
    },
    'Vancouver': {
      country: 'Canada',
      lat: 49.2827,
      lng: -123.1207,
      neighborhoods: ['Downtown', 'Gastown', 'Yaletown', 'West End', 'Kitsilano', 'Granville Island', 'Coal Harbour']
    },
    'Boston': {
      country: 'USA',
      lat: 42.3601,
      lng: -71.0589,
      neighborhoods: ['Back Bay', 'Beacon Hill', 'North End', 'South End', 'Fenway', 'Downtown', 'Seaport']
    },
    'Singapore': {
      country: 'Singapore',
      lat: 1.3521,
      lng: 103.8198,
      neighborhoods: ['Marina Bay', 'Orchard Road', 'Chinatown', 'Little India', 'Sentosa', 'Bugis', 'Clarke Quay']
    },
    'Hong Kong': {
      country: 'China',
      lat: 22.3193,
      lng: 114.1694,
      neighborhoods: ['Central', 'Tsim Sha Tsui', 'Causeway Bay', 'Wan Chai', 'Mong Kok', 'Lan Kwai Fong', 'Soho']
    }
  };

  /**
   * Find the best matching city based on the input
   */
  private findCity(location: string): string {
    const normalized = location.toLowerCase();
    
    // First, try exact match
    for (const cityName of Object.keys(this.cities)) {
      if (cityName.toLowerCase() === normalized) {
        return cityName;
      }
    }
    
    // Then, try partial match
    for (const cityName of Object.keys(this.cities)) {
      if (cityName.toLowerCase().includes(normalized) || normalized.includes(cityName.toLowerCase())) {
        return cityName;
      }
    }
    
    // Finally, try matching against countries
    for (const [cityName, cityInfo] of Object.entries(this.cities)) {
      if (cityInfo.country.toLowerCase() === normalized) {
        return cityName;
      }
    }
    
    // If all else fails, return a default major city
    return 'London';
  }

  /**
   * Generate a consistent ID based on hotel name and location
   */
  private generateHotelId(hotelName: string, cityName: string, index: number): string {
    return `hotel_${cityName.replace(/\s+/g, '_').toLowerCase()}_${index}_${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Generate a realistic price based on city and hotel quality
   */
  private generatePrice(cityName: string, rating: number): number {
    // Base prices by city tier
    const expensiveCities = ['New York', 'London', 'Paris', 'Tokyo', 'Singapore', 'Dubai', 'Hong Kong', 'Sydney'];
    const midTierCities = ['Barcelona', 'Madrid', 'Rome', 'Berlin', 'Toronto', 'San Francisco', 'Los Angeles', 'Boston'];
    
    let basePrice = 100;
    
    if (expensiveCities.includes(cityName)) {
      basePrice = 200;
    } else if (midTierCities.includes(cityName)) {
      basePrice = 150;
    }
    
    // Higher ratings mean higher prices
    const qualityMultiplier = (rating / 5) * 3;
    
    // Add some randomness
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    
    return Math.round(basePrice * qualityMultiplier * randomFactor);
  }

  /**
   * Get a realistic address for a hotel in the given city
   */
  private generateAddress(cityName: string, index: number): string {
    const cityInfo = this.cities[cityName];
    const streetTypes = ['Street', 'Avenue', 'Boulevard', 'Road', 'Lane', 'Drive', 'Way', 'Place'];
    const streetNames = ['Main', 'Park', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Grand', 'Central', 'Lake', 'Market', 'Broadway'];
    
    // Get a neighborhood if available, otherwise use the city center
    let neighborhood = '';
    if (cityInfo && cityInfo.neighborhoods && cityInfo.neighborhoods.length > 0) {
      neighborhood = cityInfo.neighborhoods[index % cityInfo.neighborhoods.length];
    }
    
    // Generate a random street number
    const streetNumber = Math.floor(Math.random() * 200) + 1;
    
    // Generate a street name
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    
    return `${streetNumber} ${streetName} ${streetType}, ${neighborhood}, ${cityName}`;
  }

  /**
   * Generate a realistic hotel name
   */
  private generateHotelName(cityName: string, index: number): string {
    // Use different patterns for hotel names to seem more realistic
    const patterns = [
      (chain: string) => `${chain} ${cityName}`,
      (chain: string) => `${chain} ${cityName} Downtown`,
      (chain: string) => `${cityName} ${chain}`,
      (chain: string) => `${chain} Grand ${cityName}`,
      (chain: string) => `${chain} Plaza ${cityName}`,
      (chain: string) => `${chain} Suites ${cityName}`,
      (chain: string) => `The ${cityName} ${chain}`,
      (chain: string) => `${chain} Resort ${cityName}`,
      (chain: string) => `${cityName} ${chain} Hotel & Spa`,
      (chain: string) => `${chain} ${cityName} Central`
    ];
    
    // Pick a hotel chain
    const hotelChain = this.hotelChains[index % this.hotelChains.length];
    
    // Pick a naming pattern
    const pattern = patterns[index % patterns.length];
    
    return pattern(hotelChain);
  }

  /**
   * Generate a realistic set of amenities for a hotel
   */
  private generateAmenities(cityName: string, rating: number): string[] {
    const cityInfo = this.cities[cityName];
    const countryCode = cityInfo ? cityInfo.country : 'USA';
    
    // Start with some basic amenities for all hotels
    let hotelAmenities = ['Free WiFi', 'Air Conditioning', '24-Hour Front Desk'];
    
    // Higher rated hotels get more amenities
    const amenityCount = Math.floor(rating * 2);
    
    // Add random amenities up to the count
    for (let i = 0; i < amenityCount && i < this.amenities.length; i++) {
      const randomIndex = Math.floor(Math.random() * this.amenities.length);
      if (!hotelAmenities.includes(this.amenities[randomIndex])) {
        hotelAmenities.push(this.amenities[randomIndex]);
      }
    }
    
    // Add country-specific amenities if available
    if (this.countrySpecifics[countryCode]) {
      const countryAmenities = this.countrySpecifics[countryCode].amenities;
      // Add 1-2 country specific amenities
      const countryAmenityCount = Math.min(1 + Math.floor(Math.random() * 2), countryAmenities.length);
      for (let i = 0; i < countryAmenityCount; i++) {
        const amenity = countryAmenities[i % countryAmenities.length];
        if (!hotelAmenities.includes(amenity)) {
          hotelAmenities.push(amenity);
        }
      }
    }
    
    return hotelAmenities;
  }

  /**
   * Generate a realistic hotel description
   */
  private generateDescription(cityName: string, rating: number, hotelName: string): string {
    const cityInfo = this.cities[cityName];
    const countryCode = cityInfo ? cityInfo.country : 'USA';
    
    // Start with a basic template
    let description = `Welcome to ${hotelName}, a ${rating}-star hotel in the heart of ${cityName}. `;
    
    // Add country-specific description if available
    if (this.countrySpecifics[countryCode] && this.countrySpecifics[countryCode].descriptions.length > 0) {
      const countryDescriptions = this.countrySpecifics[countryCode].descriptions;
      description += countryDescriptions[Math.floor(Math.random() * countryDescriptions.length)] + ' ';
    }
    
    // Add more details based on rating
    if (rating >= 4.5) {
      description += 'This luxury hotel offers exceptional service and premium amenities, ensuring an unforgettable stay. ';
    } else if (rating >= 4) {
      description += 'This upscale hotel combines comfort and style, providing a superior experience for business and leisure travelers. ';
    } else if (rating >= 3.5) {
      description += 'This comfortable hotel offers a pleasant stay with modern amenities and friendly service. ';
    } else {
      description += 'This practical hotel provides a convenient base for exploring the city, with all the essential amenities. ';
    }
    
    // Add location benefits
    description += `Located in a prime location, the hotel offers easy access to popular attractions and the vibrant culture of ${cityName}.`;
    
    return description;
  }

  /**
   * Generate a selection of room types for the hotel
   */
  private generateRoomTypes(rating: number): string[] {
    // Higher rated hotels have more room options
    const roomCount = Math.max(2, Math.floor(rating));
    
    // Start with standard rooms for all hotels
    const rooms = [this.roomTypes[0]];
    
    // Add additional room types based on rating
    for (let i = 1; i < roomCount && i < this.roomTypes.length; i++) {
      rooms.push(this.roomTypes[i]);
    }
    
    return rooms;
  }

  /**
   * Generate hotel search results for a given location
   */
  public async searchHotels(location: string): Promise<HotelResult[]> {
    try {
      // Find the best matching city for the location
      const cityName = this.findCity(location);
      const cityInfo = this.cities[cityName];
      
      if (!cityInfo) {
        return [];
      }
      
      // Generate hotel results
      const hotelCount = 8 + Math.floor(Math.random() * 8); // 8-15 hotels
      const hotels: HotelResult[] = [];
      
      for (let i = 0; i < hotelCount; i++) {
        // Generate a rating (3.0-5.0)
        const rating = (3 + (Math.random() * 2)).toFixed(1);
        
        // Generate hotel name
        const hotelName = this.generateHotelName(cityName, i);
        
        // Generate hotel ID
        const hotelId = this.generateHotelId(hotelName, cityName, i);
        
        // Generate price
        const price = this.generatePrice(cityName, parseFloat(rating));
        
        // Get room types
        const roomTypes = this.generateRoomTypes(parseFloat(rating));
        
        // Get a hotel image from our collection
        const imageUrl = this.hotelImages[i % this.hotelImages.length] + '?w=800&h=600&q=80';
        
        // Create the hotel object
        hotels.push({
          id: hotelId,
          name: hotelName,
          address: this.generateAddress(cityName, i),
          city: cityName,
          country: cityInfo.country,
          rating: parseFloat(rating),
          price: price,
          currency: 'USD',
          imageUrl,
          roomTypes
        });
      }
      
      return hotels;
    } catch (error) {
      console.error('Error generating hotel search results:', error);
      return [];
    }
  }

  /**
   * Get details for a specific hotel
   */
  public async getHotelDetails(hotelId: string): Promise<HotelDetail | null> {
    // Parse the ID to extract the city
    const parts = hotelId.split('_');
    let cityName = parts[1] || 'london';
    cityName = cityName.replace(/_/g, ' ');
    cityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    
    // Attempt to find the city in our database
    if (!this.cities[cityName]) {
      cityName = 'London'; // Default fallback
    }
    
    const cityInfo = this.cities[cityName];
    
    // Generate a random index for consistent results
    const index = parseInt(parts[2] || '0', 10);
    
    // Generate a rating (3.0-5.0)
    const rating = (3 + (Math.random() * 2)).toFixed(1);
    
    // Generate hotel name
    const hotelName = this.generateHotelName(cityName, index);
    
    // Generate price
    const price = this.generatePrice(cityName, parseFloat(rating));
    
    // Get room types
    const roomTypes = this.generateRoomTypes(parseFloat(rating));
    
    // Get amenities
    const amenities = this.generateAmenities(cityName, parseFloat(rating));
    
    // Get a hotel image from our collection
    const imageUrl = this.hotelImages[index % this.hotelImages.length] + '?w=800&h=600&q=80';
    
    // Generate a description
    const description = this.generateDescription(cityName, parseFloat(rating), hotelName);
    
    // Generate offers
    const offers = [
      {
        id: `offer_${hotelId}_1`,
        roomType: roomTypes[0],
        price: {
          total: price,
          currency: 'USD'
        },
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        boardType: 'Room only'
      },
      {
        id: `offer_${hotelId}_2`,
        roomType: roomTypes.length > 1 ? roomTypes[1] : roomTypes[0],
        price: {
          total: price * 1.2,
          currency: 'USD'
        },
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        boardType: 'Breakfast included'
      }
    ];
    
    return {
      id: hotelId,
      name: hotelName,
      address: this.generateAddress(cityName, index),
      city: cityName,
      country: cityInfo.country,
      rating: parseFloat(rating),
      price,
      currency: 'USD',
      imageUrl,
      roomTypes,
      description,
      amenities,
      offers
    };
  }
}

// Export the service instance
export const hotelsApiService = new HotelsApiService();
