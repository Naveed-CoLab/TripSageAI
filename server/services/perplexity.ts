import { Trip } from "@shared/schema";
import axios from "axios";

// Type for chat messages
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Type for trip idea
type TripIdea = {
  summary: string;
  highlights: string[];
  bestTimeToVisit: string;
  estimatedBudget: string;
  recommendedDuration: string;
};

// Type for itinerary day
type ItineraryDay = {
  dayNumber: number;
  title: string;
  date?: string;
  city?: string;
  image?: string;
  activities: Array<{
    title: string;
    description?: string;
    time?: string;
    location?: string;
    type?: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
    city?: string;
  }>;
};

// Type for itinerary booking
type ItineraryBooking = {
  type: string;
  title: string;
  provider?: string;
  price?: string;
  details?: any;
  image?: string;
  rating?: number;
  reviewCount?: number;
};

// Type for generated itinerary
type GeneratedItinerary = {
  days: ItineraryDay[];
  bookings: ItineraryBooking[];
};

// Perplexity API service
export class PerplexityService {
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || "";
    this.apiHost = "perplexity-ai.p.rapidapi.com";
    this.model = "llama-3.1-sonar-large-128k-online"; // Best model for detailed content

    if (!this.apiKey) {
      console.warn("RAPIDAPI_KEY is not set! AI features will not work properly.");
    }
  }
  
  /**
   * Generate a trip idea with highlights, best time to visit, etc.
   * @param destination The destination for the trip
   * @param preferences Optional array of preferences
   * @param duration Optional trip duration
   * @returns Trip idea object with summary, highlights, etc.
   */
  async generateTripIdea(
    destination: string,
    preferences?: string[],
    duration?: string
  ): Promise<TripIdea> {
    try {
      const preferencesString = preferences ? preferences.join(", ") : "general tourism";
      const durationString = duration || "a week";
      
      // Check if API key is missing
      if (!this.apiKey) {
        console.warn("No RAPIDAPI_KEY provided. Using fallback trip idea data.");
        return this.generateFallbackTripIdea(destination, preferencesString, durationString);
      }
      
      // System prompt to set the context and requirements
      const systemPrompt = `
        You are an expert travel advisor specializing in providing detailed, specific, and accurate travel recommendations.
        For each trip idea request, you will provide informative, structured recommendations with specific details.
      `;
      
      // User prompt requesting trip idea
      const userPrompt = `
        Create a travel plan idea for a trip to ${destination}.
        The traveler is interested in: ${preferencesString}.
        The trip duration is approximately ${durationString}.
        
        Format your response as a JSON object with the following structure:
        {
          "summary": "Brief overview of the destination and trip (2-3 sentences)",
          "highlights": ["Specific attraction 1 with exact name", "Specific attraction 2 with exact name", "Specific attraction 3 with exact name", "Specific attraction 4 with exact name", "Specific attraction 5 with exact name"],
          "bestTimeToVisit": "Season or months that are ideal for this destination",
          "estimatedBudget": "Specific price range in USD for this trip",
          "recommendedDuration": "Ideal length of stay in days"
        }
        
        Important: Your JSON response MUST be valid and parseable. Use specific, real place names for attractions.
      `;
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const options = {
        method: 'POST',
        url: 'https://perplexity-ai.p.rapidapi.com/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        },
        data: {
          model: this.model,
          messages: messages,
          temperature: 0.3,  // Lower temperature for more factual responses
          max_tokens: 1000,
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          response_format: { type: "json_object" }  // Request JSON response format
        }
      };
      
      // Make request to Perplexity API
      const response = await axios.request(options);
      
      // Extract the content from response
      const content = response.data.choices[0].message.content;
      
      // Parse the JSON response
      let result: TripIdea;
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse Perplexity API response as JSON:", e);
        console.error("Raw response:", content);
        
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            result = JSON.parse(jsonMatch[1]);
          } catch (e2) {
            console.error("Failed to parse extracted JSON:", e2);
            return this.generateFallbackTripIdea(destination, preferencesString, durationString);
          }
        } else {
          return this.generateFallbackTripIdea(destination, preferencesString, durationString);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error generating trip idea:", error);
      return this.generateFallbackTripIdea(destination, preferences?.join(", ") || "general tourism", duration || "a week");
    }
  }
  
  /**
   * Generate fallback trip idea when API call fails
   * @param destination The destination
   * @param preferences User preferences
   * @param duration Trip duration
   * @returns Fallback trip idea
   */
  private generateFallbackTripIdea(destination: string, preferences: string, duration: string): TripIdea {
    // Create destination-specific trip ideas based on common tourist destinations
    let tripIdea: TripIdea;
    
    // Customize trip idea based on destination
    switch(destination.toLowerCase()) {
      case 'tokyo':
      case 'japan':
        tripIdea = {
          summary: "Experience the perfect blend of ancient traditions and futuristic innovation in Japan. From serene temples and gardens to bustling city streets and technological wonders, Japan offers a unique cultural experience that will captivate any traveler.",
          highlights: [
            "Visit the historic Senso-ji Temple in Asakusa",
            "Experience the organized chaos of Shibuya Crossing",
            "Take in breathtaking views of Mt. Fuji",
            "Explore the pop culture district of Akihabara",
            "Enjoy authentic Japanese cuisine from sushi to ramen"
          ],
          bestTimeToVisit: "Late March to May for cherry blossoms, or October to November for autumn foliage",
          estimatedBudget: "$150-300 per day including accommodations, food, and activities",
          recommendedDuration: "10-14 days to explore Tokyo and surrounding areas"
        };
        break;
        
      case 'paris':
      case 'france':
        tripIdea = {
          summary: "Discover the romance and charm of Paris, the City of Light. Known for its iconic landmarks, world-class museums, and exquisite cuisine, Paris offers a perfect blend of history, culture, and beauty.",
          highlights: [
            "Marvel at the iconic Eiffel Tower",
            "Explore the vast art collections at the Louvre Museum",
            "Visit the Gothic masterpiece Notre-Dame Cathedral",
            "Stroll along the elegant Champs-Élysées",
            "Experience Parisian café culture at Les Deux Magots"
          ],
          bestTimeToVisit: "April to June or September to October for mild weather and fewer crowds",
          estimatedBudget: "$150-250 per day including accommodations, food, and activities",
          recommendedDuration: "5-7 days to experience the main attractions of Paris"
        };
        break;
        
      case 'rome':
      case 'italy':
        tripIdea = {
          summary: "Step back in time in Rome, the Eternal City, where ancient history meets modern Italian life. With its incredible archaeological sites, Renaissance masterpieces, and vibrant streets, Rome offers an unforgettable journey through the layers of Western civilization.",
          highlights: [
            "Explore the ancient Colosseum and Roman Forum",
            "Visit Vatican City and St. Peter's Basilica",
            "Toss a coin in the Trevi Fountain",
            "Marvel at the perfect dome of the Pantheon",
            "Indulge in authentic Italian cuisine at Trastevere"
          ],
          bestTimeToVisit: "April to May or September to October for pleasant weather and thinner crowds",
          estimatedBudget: "$120-200 per day including accommodations, food, and activities",
          recommendedDuration: "4-6 days to see Rome's major attractions"
        };
        break;
        
      case 'new york':
      case 'new york city':
      case 'usa':
        tripIdea = {
          summary: "Experience the energy and diversity of New York City, the city that never sleeps. From iconic skyscrapers and world-class museums to diverse neighborhoods and Broadway shows, NYC offers endless possibilities for exploration and entertainment.",
          highlights: [
            "Take in the views from the Empire State Building or One World Observatory",
            "Stroll through the urban oasis of Central Park",
            "Visit the Metropolitan Museum of Art",
            "Experience the bright lights of Times Square",
            "Explore diverse neighborhoods like Greenwich Village and Brooklyn"
          ],
          bestTimeToVisit: "April to June or September to November for mild weather and fewer tourists",
          estimatedBudget: "$200-350 per day including accommodations, food, and activities",
          recommendedDuration: "5-7 days to experience the highlights of NYC"
        };
        break;
        
      // Default fallback for any other destination
      default:
        tripIdea = {
          summary: `A journey to ${destination} focusing on ${preferences}. This trip offers a perfect balance of exploration, relaxation, and cultural immersion.`,
          highlights: [
            "Explore the main attractions and historical sites",
            "Sample local cuisine and culinary specialties",
            "Immerse yourself in the local culture and traditions",
            "Visit museums and cultural institutions",
            "Discover hidden gems off the typical tourist path"
          ],
          bestTimeToVisit: "Spring or fall for the most pleasant weather conditions",
          estimatedBudget: "$100-200 per day depending on accommodation choices and activities",
          recommendedDuration: duration
        };
    }
    
    return tripIdea;
  }

  /**
   * Generate high-quality images from Unsplash based on a detailed prompt
   * @param prompt The search prompt for the image
   * @returns URL to the image
   */
  async generateImageFromUnsplash(prompt: string): Promise<string> {
    try {
      // Create a more specific search query for Unsplash
      const enhancedPrompt = `${prompt},travel,professional,high-quality`;
      
      // Use Unsplash source API for a reliable, high-quality image
      // Force random by appending a cache buster (current timestamp)
      const timestamp = new Date().getTime();
      return `https://source.unsplash.com/1200x800/?${encodeURIComponent(enhancedPrompt)}&t=${timestamp}`;
    } catch (error) {
      console.error("Error generating image:", error);
      return this.getFallbackImage(prompt);
    }
  }

  /**
   * Get fallback image for when image generation fails
   * @param prompt The original image prompt
   * @returns URL to a fallback image
   */
  private getFallbackImage(prompt: string): string {
    const lowercasePrompt = prompt.toLowerCase();
    
    // Detect if it's a specific location type and return a relevant image
    if (lowercasePrompt.includes("beach") || lowercasePrompt.includes("ocean") || lowercasePrompt.includes("sea")) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("mountain") || lowercasePrompt.includes("hiking") || lowercasePrompt.includes("trek")) {
      return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("city") || lowercasePrompt.includes("skyline") || lowercasePrompt.includes("urban")) {
      return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("food") || lowercasePrompt.includes("restaurant") || lowercasePrompt.includes("dining")) {
      return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("hotel") || lowercasePrompt.includes("resort") || lowercasePrompt.includes("accommodation")) {
      return "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("museum") || lowercasePrompt.includes("art") || lowercasePrompt.includes("gallery")) {
      return "https://images.unsplash.com/photo-1566054757965-8c4085344d96?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("park") || lowercasePrompt.includes("garden") || lowercasePrompt.includes("nature")) {
      return "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&h=800&fit=crop";
    }
    
    if (lowercasePrompt.includes("landmark") || lowercasePrompt.includes("monument") || lowercasePrompt.includes("historic")) {
      return "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=800&fit=crop";
    }
    
    // Default travel image
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop";
  }

  /**
   * Generate a detailed travel itinerary using Perplexity API
   * @param trip The trip data
   * @returns A detailed itinerary
   */
  async generateItinerary(trip: Trip): Promise<GeneratedItinerary> {
    try {
      const startDate = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "unspecified start date";
      const endDate = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "unspecified end date";
      const preferencesString = trip.preferences ? trip.preferences.join(", ") : "general tourism";
      
      // Create the days between start and end date (or default to 3 days)
      let numberOfDays = 3; // Default
      if (trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      // Check if API key is missing
      if (!this.apiKey) {
        console.warn("No RAPIDAPI_KEY provided. Using fallback itinerary data.");
        return this.generateFallbackItinerary(trip, numberOfDays);
      }
      
      // System prompt to set the context and requirements
      const systemPrompt = `
        You are an expert travel planner specializing in creating detailed, specific itineraries.
        EXTREMELY IMPORTANT:
        1. Be hyper-specific with REAL place names, actual hotel names, and specific attractions - never be generic
        2. For each activity or place, include its exact name, address, and a short interesting description
        3. For restaurants, include actual restaurant names in the destination with cuisine type
        4. For hotels, recommend specific actual hotels with approximate prices
        5. For each day, recommend a specific notable landmark/attraction that is a must-visit
        6. Include at least one off-the-beaten-path location for authentic local experience
        7. Include specific transportation options where relevant (subway line names, bus routes, etc.)
        8. Add interesting facts about locations that most tourists wouldn't know
      `;
      
      // User prompt to request the itinerary
      const userPrompt = `
        Create a detailed day-by-day travel itinerary for a trip to ${trip.destination}.
        Trip details:
        - Destination: ${trip.destination}
        - Dates: ${startDate} to ${endDate} (${numberOfDays} days)
        - Preferences: ${preferencesString}
        - Title: ${trip.title}
        - Budget: ${trip.budget || "moderate"}
        
        Please structure your response as a valid JSON object with this exact format:
        {
          "days": [
            {
              "dayNumber": 1,
              "title": "Day 1: Arrival & Orientation",
              "city": "Main city for the day",
              "activities": [
                {
                  "title": "SPECIFIC PLACE/ACTIVITY NAME",
                  "description": "Detailed description with interesting facts about this specific place",
                  "time": "Specific time window (e.g., '9:00 AM - 11:30 AM')",
                  "location": "Full address or neighborhood",
                  "type": "sightseeing|food|accommodation|transportation|shopping|entertainment"
                },
                {...more activities...}
              ]
            },
            {...more days...}
          ],
          "bookings": [
            {
              "type": "hotel",
              "title": "SPECIFIC HOTEL NAME",
              "provider": "Website or booking platform",
              "price": "Price range per night",
              "details": {
                "address": "Full hotel address",
                "description": "Brief description of the hotel and its amenities",
                "checkIn": "Standard check-in time",
                "checkOut": "Standard check-out time"
              }
            },
            {...more bookings...}
          ]
        }
        
        YOUR RESPONSE MUST BE VALID JSON THAT CAN BE PARSED WITH JSON.parse() AND MATCH THE EXACT STRUCTURE ABOVE.
      `;
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const options = {
        method: 'POST',
        url: 'https://perplexity-ai.p.rapidapi.com/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        },
        data: {
          model: this.model,
          messages: messages,
          temperature: 0.2,  // Lower temperature for more factual responses
          max_tokens: 4000,  // Allow longer responses
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        }
      };
      
      // Make request to Perplexity API
      const response = await axios.request(options);
      
      // Extract the content from response
      const content = response.data.choices[0].message.content;
      
      // Parse the JSON response
      let parsedResult: GeneratedItinerary;
      try {
        parsedResult = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse Perplexity API response as JSON:", e);
        console.error("Raw response:", content);
        
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedResult = JSON.parse(jsonMatch[1]);
          } catch (e2) {
            console.error("Failed to parse extracted JSON:", e2);
            return this.generateFallbackItinerary(trip, numberOfDays);
          }
        } else {
          return this.generateFallbackItinerary(trip, numberOfDays);
        }
      }
      
      // Process the result to add images
      const processedResult = await this.processItineraryWithImages(parsedResult, trip.destination);
      return processedResult;
      
    } catch (error) {
      console.error("Error generating itinerary with Perplexity API:", error);
      
      // Calculate days
      let numberOfDays = 3;
      if (trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      return this.generateFallbackItinerary(trip, numberOfDays);
    }
  }
  
  /**
   * Process the itinerary by adding images to each activity and day
   * @param itinerary The raw itinerary without images
   * @param destination The destination for image context
   * @returns Processed itinerary with images
   */
  private async processItineraryWithImages(itinerary: GeneratedItinerary, destination: string): Promise<GeneratedItinerary> {
    // Process each day to add images
    for (const day of itinerary.days) {
      // Add an image for the day
      const dayImagePrompt = `${day.title} in ${destination}, ${day.city || destination}, travel photography`;
      day.image = await this.generateImageFromUnsplash(dayImagePrompt);
      
      // Add images for each activity
      for (const activity of day.activities) {
        // Skip if activity already has an image
        if (!activity.image) {
          const activityImagePrompt = `${activity.title} in ${day.city || destination}, ${activity.type || 'travel'} photography`;
          activity.image = await this.generateImageFromUnsplash(activityImagePrompt);
        }
      }
    }
    
    // Process bookings to add images
    for (const booking of itinerary.bookings) {
      if (!booking.image) {
        let bookingImagePrompt = `${booking.title} in ${destination}`;
        if (booking.type === 'hotel') {
          bookingImagePrompt += ', luxury hotel, professional photography';
        } else if (booking.type === 'flight') {
          bookingImagePrompt += ', airplane, airport, travel';
        } else if (booking.type === 'transportation') {
          bookingImagePrompt += ', transportation, travel';
        }
        booking.image = await this.generateImageFromUnsplash(bookingImagePrompt);
      }
    }
    
    return itinerary;
  }
  
  /**
   * Generate fallback itinerary when the API fails
   * @param trip Trip details
   * @param numberOfDays Number of days in the itinerary
   * @returns Fallback itinerary
   */
  private async generateFallbackItinerary(trip: Trip, numberOfDays: number): Promise<GeneratedItinerary> {
    const destination = trip.destination;
    const fallbackItinerary: GeneratedItinerary = {
      days: [],
      bookings: []
    };
    
    // Generate days
    for (let i = 1; i <= numberOfDays; i++) {
      // Determine day title and activities based on common travel patterns
      let dayTitle = "";
      let activities = [];
      
      if (i === 1) {
        dayTitle = `Day ${i}: Arrival & Orientation`;
        activities = [
          {
            title: `Check-in at accommodation`,
            description: `Arrive at your hotel and settle in. Take time to relax after your journey.`,
            time: "2:00 PM",
            location: `Central ${destination}`,
            type: "accommodation",
            image: await this.generateImageFromUnsplash(`luxury hotel in ${destination}`)
          },
          {
            title: `Local area orientation`,
            description: `Take a relaxed walk around the neighborhood to get your bearings and familiarize yourself with the surroundings.`,
            time: "4:00 PM",
            location: `Around your accommodation`,
            type: "sightseeing",
            image: await this.generateImageFromUnsplash(`${destination} streets walking tour`)
          },
          {
            title: `Welcome dinner`,
            description: `Enjoy your first taste of local cuisine at a popular restaurant.`,
            time: "7:00 PM",
            location: `Local restaurant`,
            type: "food",
            image: await this.generateImageFromUnsplash(`traditional restaurant in ${destination}`)
          }
        ];
      } else if (i === numberOfDays) {
        dayTitle = `Day ${i}: Final Explorations & Departure`;
        activities = [
          {
            title: `Morning visit to ${destination}'s famous landmark`,
            description: `Make time for one last visit to a must-see attraction before departing.`,
            time: "9:00 AM",
            location: `${destination} city center`,
            type: "sightseeing",
            image: await this.generateImageFromUnsplash(`famous landmark in ${destination}`)
          },
          {
            title: `Souvenir shopping`,
            description: `Pick up some mementos and gifts to remember your trip.`,
            time: "11:30 AM",
            location: `Shopping district`,
            type: "shopping",
            image: await this.generateImageFromUnsplash(`shopping district in ${destination}`)
          },
          {
            title: `Check-out and departure`,
            description: `Prepare for your journey home. Make sure to leave enough time to reach the airport or station.`,
            time: "2:00 PM",
            location: `Accommodation to transport hub`,
            type: "transportation",
            image: await this.generateImageFromUnsplash(`airport in ${destination}`)
          }
        ];
      } else {
        // For middle days, create varied activities based on day number
        if (i % 2 === 0) {
          dayTitle = `Day ${i}: Cultural Immersion`;
          activities = [
            {
              title: `Visit to ${destination} Museum`,
              description: `Explore the rich history and culture of the region through fascinating exhibits and artifacts.`,
              time: "10:00 AM",
              location: `Cultural district`,
              type: "sightseeing",
              image: await this.generateImageFromUnsplash(`museum in ${destination}`)
            },
            {
              title: `Local craft workshop`,
              description: `Try your hand at a traditional craft and learn from local artisans.`,
              time: "2:00 PM",
              location: `Old town district`,
              type: "entertainment",
              image: await this.generateImageFromUnsplash(`crafts workshop in ${destination}`)
            },
            {
              title: `Evening cultural performance`,
              description: `Experience traditional music, dance, or theater performances.`,
              time: "7:00 PM",
              location: `Theater district`,
              type: "entertainment",
              image: await this.generateImageFromUnsplash(`cultural performance in ${destination}`)
            }
          ];
        } else {
          dayTitle = `Day ${i}: Natural Wonders Exploration`;
          activities = [
            {
              title: `Day trip to nearby natural attraction`,
              description: `Venture outside the city to experience the stunning natural landscape of the region.`,
              time: "9:00 AM",
              location: `Outskirts of ${destination}`,
              type: "sightseeing",
              image: await this.generateImageFromUnsplash(`natural landscape near ${destination}`)
            },
            {
              title: `Picnic lunch outdoors`,
              description: `Enjoy a relaxing meal surrounded by beautiful scenery.`,
              time: "12:30 PM",
              location: `Scenic viewpoint`,
              type: "food",
              image: await this.generateImageFromUnsplash(`picnic spot in ${destination}`)
            },
            {
              title: `Adventure activity`,
              description: `Try an exciting outdoor activity like hiking, boating, or cycling.`,
              time: "2:30 PM",
              location: `Activity center`,
              type: "entertainment",
              image: await this.generateImageFromUnsplash(`outdoor adventure in ${destination}`)
            }
          ];
        }
      }
      
      // Add the day to the itinerary
      fallbackItinerary.days.push({
        dayNumber: i,
        title: dayTitle,
        city: destination,
        image: await this.generateImageFromUnsplash(`${dayTitle} in ${destination}`),
        activities: activities
      });
    }
    
    // Add hotel booking
    fallbackItinerary.bookings.push({
      type: "hotel",
      title: `Central ${destination} Hotel`,
      provider: "Booking.com",
      price: "$150-250 per night",
      details: {
        address: `Main Street, ${destination}`,
        description: `Comfortable accommodation located in the heart of ${destination} with easy access to major attractions.`,
        checkIn: "3:00 PM",
        checkOut: "11:00 AM"
      },
      image: await this.generateImageFromUnsplash(`luxury hotel in ${destination}`)
    });
    
    // Add transportation booking if applicable
    fallbackItinerary.bookings.push({
      type: "transportation",
      title: `Airport Transfer Service`,
      provider: "Local Transportation",
      price: "$30-50",
      details: {
        description: `Reliable transfer service between the airport and your accommodation.`,
        pickupLocation: `${destination} International Airport`,
        dropoffLocation: `Your hotel in ${destination}`
      },
      image: await this.generateImageFromUnsplash(`airport transfer in ${destination}`)
    });
    
    return fallbackItinerary;
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService();