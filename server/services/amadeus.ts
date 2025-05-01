
import Amadeus from 'amadeus';

// Initialize the Amadeus client
let amadeus: any;
try {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY || '',
    clientSecret: process.env.AMADEUS_API_SECRET || ''
  });
  console.log('Amadeus client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Amadeus client:', error);
  amadeus = null;
}

// Track if we are in test mode (no API keys, invalid keys, or initialization failed)
const isTestMode = !process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET || !amadeus;

export interface FlightOffer {
  id: string;
  source: string;
  itineraries: {
    segments: {
      departure: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO date string
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string; // ISO date string
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      operating?: {
        carrierCode: string;
      };
      duration: string;
      id: string;
    }[];
    duration?: string;
  }[];
  price: {
    currency: string;
    total: string;
    base: string;
    fees: {
      amount: string;
      type: string;
    }[];
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: {
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: {
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      class: string;
      includedCheckedBags: {
        quantity: number;
      };
    }[];
  }[];
  numberOfBookableSeats?: number;
}

export interface LocationSearchResult {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  address?: {
    cityName: string;
    countryName: string;
  };
}

export async function searchFlights(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string; // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}): Promise<FlightOffer[]> {
  try {
    // Prepare parameters for the API call, removing undefined values
    const searchParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    );

    // Make the API call
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
    
    // Return the flight offers
    return response.data;
  } catch (error) {
    console.error('Error searching flights with Amadeus API:', error);
    throw error;
  }
}

export async function searchAirports(keyword: string): Promise<LocationSearchResult[]> {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: Amadeus.location.any,
      page: {
        limit: 10
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching airports with Amadeus API:', error);
    throw error;
  }
}

export async function searchLocations(keyword: string): Promise<LocationSearchResult[]> {
  try {
    // If we're in test mode or Amadeus client failed to initialize, return an empty array
    if (isTestMode) {
      console.log('Using test mode for location search - real API keys not available');
      return [];
    }
    
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: Amadeus.location.city, // Only look for cities
      page: {
        limit: 5
      }
    });
    
    console.log(`Found ${response.data.length} locations for keyword: ${keyword}`);
    return response.data;
  } catch (error) {
    console.error('Error searching locations with Amadeus API:', error);
    // Return empty array on error to allow fallback to work
    return [];
  }
}

export async function getAirlineInfo(airlineCode: string): Promise<any> {
  try {
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: airlineCode
    });
    
    return response.data[0];
  } catch (error) {
    console.error('Error getting airline info with Amadeus API:', error);
    throw error;
  }
}

export async function flightOffersToPricing(flightOffers: FlightOffer[]): Promise<any> {
  try {
    const response = await amadeus.shopping.flightOffersSearch.pricing.post(
      JSON.stringify({
        data: {
          type: 'flight-offers-pricing',
          flightOffers: flightOffers
        }
      })
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting pricing with Amadeus API:', error);
    throw error;
  }
}

// Hotel Interfaces
export interface HotelSearchResult {
  hotelId: string;
  name: string;
  rating?: string;
  description?: {
    text: string;
  };
  address?: {
    cityName: string;
    countryCode: string;
    lines: string[];
    postalCode: string;
  };
  contact?: {
    phone: string;
    email?: string;
  };
  amenities?: string[];
  media?: Array<{
    uri: string;
    category: string;
  }>;
  price?: {
    total: string;
    currency: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface HotelOffer {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity: number;
  rateCode: string;
  rateFamilyEstimated?: {
    code: string;
    type: string;
  };
  category: string;
  description?: {
    text: string;
  };
  commission?: {
    percentage: string;
  };
  boardType?: string;
  room: {
    type: string;
    typeEstimated?: {
      category: string;
      beds: number;
      bedType: string;
    };
    description?: {
      text: string;
    };
  };
  guests: {
    adults: number;
    childAges: number[];
  };
  price: {
    currency: string;
    base: string;
    total: string;
    taxes?: Array<{
      code: string;
      amount: string;
      currency: string;
      included: boolean;
    }>;
    variations?: {
      changes?: Array<{
        startDate: string;
        endDate: string;
        total: string;
      }>;
      average?: {
        base: string;
        total: string;
      };
    };
  };
  policies?: {
    paymentType: string;
    cancellations: Array<{
      type: string;
      amount: string;
      deadline: string;
    }>;
  };
}

export interface HotelDetail {
  hotelId: string;
  name: string;
  rating?: string;
  description?: {
    text: string;
  };
  address?: {
    cityName: string;
    countryCode: string;
    lines: string[];
    postalCode: string;
  };
  contact?: {
    phone: string;
    email?: string;
  };
  amenities: string[];
  media: Array<{
    uri: string;
    category: string;
  }>;
  offers?: HotelOffer[];
}

/**
 * Search for hotels using Amadeus Hotel Search API
 */
export async function searchHotels(params: {
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  radiusUnit?: string; // KM, MILE
  hotelIds?: string[];
  amenities?: string[];
  ratings?: string[];
  priceRange?: string;
  currency?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number;
  childAges?: number[];
  roomQuantity?: number;
  bestRateOnly?: boolean;
  view?: string;
  sort?: string;
  page?: {
    limit?: number;
    offset?: number;
  };
}): Promise<HotelSearchResult[]> {
  try {
    // If we're in test mode, return a safe response
    if (isTestMode) {
      console.log('Using test mode for hotel search - real API keys not available');
      return getFallbackHotels(params.cityCode || '');
    }

    // According to the migration guide, we should use hotelOffers directly
    // without first using hotelListings, as the structure has changed
    const searchParams: any = {
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults || 2,
      roomQuantity: params.roomQuantity || 1,
      currency: params.currency || 'USD',
      bestRateOnly: params.bestRateOnly !== false,
      ratings: params.ratings,
      amenities: params.amenities,
      radius: params.radius || 20,
      radiusUnit: params.radiusUnit || 'KM',
      includeClosed: false
    };

    // Clean parameters by removing undefined values
    const cleanSearchParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, v]) => v !== undefined)
    );
    
    // Make the API call directly to the hotelOffers endpoint as per migration guide
    const hotelResponse = await amadeus.shopping.hotelOffers.get(cleanSearchParams);
    
    // If no hotels found, return empty result
    if (!hotelResponse.data || hotelResponse.data.length === 0) {
      console.log('No hotels found in the specified location');
      return [];
    }
    
    // Map the hotel offers directly to our HotelSearchResult format
    const hotels = hotelResponse.data.map((hotelOffer: any) => {
      const hotel = hotelOffer.hotel;
      
      return {
        hotelId: hotel.hotelId,
        name: hotel.name,
        rating: hotel.rating,
        description: hotel.description || { text: hotel.name },
        address: {
          cityName: hotel.cityCode || params.cityCode || '',
          countryCode: hotel.countryCode || '',
          lines: [hotel.address?.lines?.[0] || ''],
          postalCode: hotel.postalCode || ''
        },
        contact: hotel.contact || { phone: '' },
        amenities: hotel.amenities || [],
        media: hotel.media || [],
        price: hotelOffer.offers?.[0] ? {
          total: hotelOffer.offers[0].price.total,
          currency: hotelOffer.offers[0].price.currency
        } : undefined,
        location: {
          latitude: hotel.latitude || 0,
          longitude: hotel.longitude || 0
        }
      };
    });
    
    return hotels;
  } catch (error) {
    console.error('Error searching hotels with Amadeus API:', error);
    // Return fallback hotels in case of API error
    return getFallbackHotels(params.cityCode || '');
  }
}

/**
 * Get detailed information about a specific hotel
 */
export async function getHotelDetails(hotelId: string, params: {
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number;
  childAges?: number[];
  roomQuantity?: number;
  currency?: string;
}): Promise<HotelDetail> {
  try {
    // If we're in test mode, return a safe response
    if (isTestMode) {
      console.log('Using test mode for hotel details - real API keys not available');
      const fallbackHotels = getFallbackHotels('');
      const hotel = fallbackHotels.find(h => h.hotelId === hotelId) || fallbackHotels[0];
      
      return {
        ...hotel,
        amenities: ['WIFI', 'POOL', 'SPA', 'RESTAURANT', 'PARKING', 'BUSINESS_CENTER'],
        media: [
          { uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', category: 'EXTERIOR' },
          { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', category: 'ROOM' },
          { uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa', category: 'BATHROOM' }
        ],
        offers: [{
          id: `offer-${hotelId}`,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          roomQuantity: params.roomQuantity || 1,
          rateCode: 'BAR',
          category: 'STANDARD',
          room: {
            type: 'STANDARD',
            typeEstimated: {
              category: 'STANDARD',
              beds: 1,
              bedType: 'KING'
            },
            description: {
              text: 'Comfortable room with all amenities'
            }
          },
          guests: {
            adults: params.adults || 1,
            childAges: params.childAges || []
          },
          price: {
            currency: params.currency || 'USD',
            base: '200.00',
            total: '220.00',
            taxes: [{
              code: 'TAX',
              amount: '20.00',
              currency: params.currency || 'USD',
              included: false
            }]
          },
          policies: {
            paymentType: 'GUARANTEE',
            cancellations: [{
              type: 'FREE_CANCELLATION',
              amount: '0.00',
              deadline: '2023-12-31T23:59:59+00:00'
            }]
          }
        }]
      } as HotelDetail;
    }

    // According to the migration guide, we should get hotel details directly
    // from the hotelOffers endpoint with the hotelId
    const offerParams = {
      hotelIds: hotelId,
      adults: params.adults || 2,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      roomQuantity: params.roomQuantity || 1,
      currency: params.currency || 'USD',
      bestRateOnly: true
    };
    
    // Clean offer params
    const cleanOfferParams = Object.fromEntries(
      Object.entries(offerParams).filter(([_, v]) => v !== undefined)
    );
    
    // Get hotel offers which includes hotel details
    const hotelResponse = await amadeus.shopping.hotelOffers.get(cleanOfferParams);
    
    // Check if we received hotel data
    if (hotelResponse.data && hotelResponse.data.length > 0) {
      // Find the correct hotel in the response
      const hotelData = hotelResponse.data.find((offer: any) => 
        offer.hotel?.hotelId === hotelId
      );
      
      if (!hotelData) {
        throw new Error('Hotel not found in response');
      }
      
      const hotel = hotelData.hotel;
      
      // Return the hotel details in our standardized format
      return {
        hotelId: hotel.hotelId,
        name: hotel.name,
        rating: hotel.rating,
        description: hotel.description || { text: hotel.name },
        address: {
          cityName: hotel.cityCode || '',
          countryCode: hotel.countryCode || '',
          lines: hotel.address?.lines || [],
          postalCode: hotel.postalCode || ''
        },
        contact: hotel.contact || { phone: '' },
        amenities: hotel.amenities || [],
        media: hotel.media || [],
        offers: hotelData.offers || []
      };
    } else {
      throw new Error('Hotel not found');
    }
  } catch (error) {
    console.error('Error getting hotel details with Amadeus API:', error);
    
    // Get a fallback hotel
    const fallbackHotels = getFallbackHotels('');
    const hotel = fallbackHotels.find(h => h.hotelId === hotelId) || fallbackHotels[0];
    
    return {
      ...hotel,
      amenities: ['WIFI', 'POOL', 'SPA', 'RESTAURANT', 'PARKING', 'BUSINESS_CENTER'],
      media: [
        { uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', category: 'EXTERIOR' },
        { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', category: 'ROOM' },
        { uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa', category: 'BATHROOM' }
      ],
      offers: [{
        id: `offer-${hotelId}`,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        roomQuantity: params.roomQuantity || 1,
        rateCode: 'BAR',
        category: 'STANDARD',
        room: {
          type: 'STANDARD',
          typeEstimated: {
            category: 'STANDARD',
            beds: 1,
            bedType: 'KING'
          },
          description: {
            text: 'Comfortable room with all amenities'
          }
        },
        guests: {
          adults: params.adults || 1,
          childAges: params.childAges || []
        },
        price: {
          currency: params.currency || 'USD',
          base: '200.00',
          total: '220.00',
          taxes: [{
            code: 'TAX',
            amount: '20.00',
            currency: params.currency || 'USD',
            included: false
          }]
        },
        policies: {
          paymentType: 'GUARANTEE',
          cancellations: [{
            type: 'FREE_CANCELLATION',
            amount: '0.00',
            deadline: '2023-12-31T23:59:59+00:00'
          }]
        }
      }]
    };
  }
}

/**
 * Get fallback hotels in case the API is not available or fails
 */
function getFallbackHotels(cityCode: string): HotelSearchResult[] {
  // Sample hotel data for when API is not available
  const sampleHotels = [
    {
      hotelId: 'hotel1',
      name: 'Grand Plaza Hotel',
      rating: '4',
      description: {
        text: 'Luxurious hotel in the heart of the city with premium amenities and stellar service.'
      },
      address: {
        cityName: 'New York',
        countryCode: 'US',
        lines: ['123 Main Street'],
        postalCode: '10001'
      },
      contact: {
        phone: '+12125551234'
      },
      price: {
        total: '299.00',
        currency: 'USD'
      },
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    {
      hotelId: 'hotel2',
      name: 'Oceanview Resort',
      rating: '5',
      description: {
        text: 'Beachfront resort with stunning ocean views, multiple pools, and full-service spa.'
      },
      address: {
        cityName: 'Miami',
        countryCode: 'US',
        lines: ['500 Beachfront Drive'],
        postalCode: '33139'
      },
      contact: {
        phone: '+13055556789'
      },
      price: {
        total: '349.00',
        currency: 'USD'
      },
      location: {
        latitude: 25.7617,
        longitude: -80.1918
      }
    },
    {
      hotelId: 'hotel3',
      name: 'Mountain Retreat Lodge',
      rating: '4',
      description: {
        text: 'Cozy mountain lodge surrounded by nature, offering hiking trails and adventure activities.'
      },
      address: {
        cityName: 'Aspen',
        countryCode: 'US',
        lines: ['789 Alpine Road'],
        postalCode: '81611'
      },
      contact: {
        phone: '+19705559876'
      },
      price: {
        total: '279.00',
        currency: 'USD'
      },
      location: {
        latitude: 39.1911,
        longitude: -106.8175
      }
    },
    {
      hotelId: 'hotel4',
      name: 'City Center Suites',
      rating: '4',
      description: {
        text: 'Modern all-suite hotel with spacious accommodations and business facilities.'
      },
      address: {
        cityName: 'Chicago',
        countryCode: 'US',
        lines: ['1000 Downtown Avenue'],
        postalCode: '60601'
      },
      contact: {
        phone: '+13125554321'
      },
      price: {
        total: '259.00',
        currency: 'USD'
      },
      location: {
        latitude: 41.8781,
        longitude: -87.6298
      }
    },
    {
      hotelId: 'hotel5',
      name: 'Historic Grand Hotel',
      rating: '5',
      description: {
        text: 'Iconic landmark hotel with classical architecture and historic charm.'
      },
      address: {
        cityName: 'Boston',
        countryCode: 'US',
        lines: ['300 Heritage Street'],
        postalCode: '02108'
      },
      contact: {
        phone: '+16175557890'
      },
      price: {
        total: '289.00',
        currency: 'USD'
      },
      location: {
        latitude: 42.3601,
        longitude: -71.0589
      }
    }
  ];
  
  // If cityCode is provided, filter by city
  if (cityCode) {
    const cityName = getCityNameFromCode(cityCode);
    return sampleHotels.filter(hotel => 
      hotel.address.cityName.toLowerCase().includes(cityName.toLowerCase())
    );
  }
  
  return sampleHotels;
}

/**
 * Convert city code to city name (simplified)
 */
function getCityNameFromCode(cityCode: string): string {
  const cityCodes: Record<string, string> = {
    'NYC': 'New York',
    'MIA': 'Miami',
    'ASE': 'Aspen',
    'CHI': 'Chicago',
    'BOS': 'Boston',
    'LAX': 'Los Angeles',
    'SFO': 'San Francisco'
  };
  
  return cityCodes[cityCode.toUpperCase()] || cityCode;
}
