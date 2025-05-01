import { Trip } from "@shared/schema";

// Type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Type for chatbot response
type ChatbotResponse = {
  reply: string;
  suggestions?: string[];
};

type TripIdea = {
  summary: string;
  highlights: string[];
  bestTimeToVisit: string;
  estimatedBudget: string;
  recommendedDuration: string;
};

type ItineraryDay = {
  dayNumber: number;
  title: string;
  date?: Date;
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

type GeneratedItinerary = {
  days: ItineraryDay[];
  bookings: ItineraryBooking[];
};

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-pro-preview-03-25"; // Unified model for all requests

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set! AI features will not work properly.");
}

// Function to generate images with Gemini 2.5 Pro Preview
export async function generateImageWithGemini(prompt: string): Promise<string | undefined> {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Cannot generate image.");
      return getDefaultImage(prompt);
    }

    const enhancedPrompt = `High-quality travel photograph of ${prompt}. Clear lighting, detailed, professional travel photography style. 4K resolution.`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: enhancedPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
          // Request image generation
          mediaOutputConfig: {
            genAllowed: true,
            genImgType: "photo",
            genImgCount: 1,
            genImgSize: "1024x1024",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini image generation API error: ${response.statusText}`);
      return getDefaultImage(prompt);
    }

    const data = await response.json();
    
    // Extract image data from response
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts) {
      
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Return the base64 image data
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.error("No image found in Gemini response");
    return getDefaultImage(prompt);
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    return getDefaultImage(prompt);
  }
}

// Function to get default images based on content type
function getDefaultImage(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Detect if it's a specific location type and return a relevant image
  if (lowercasePrompt.includes("beach") || lowercasePrompt.includes("ocean") || lowercasePrompt.includes("sea")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("mountain") || lowercasePrompt.includes("hiking") || lowercasePrompt.includes("trek")) {
    return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("city") || lowercasePrompt.includes("skyline") || lowercasePrompt.includes("urban")) {
    return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("food") || lowercasePrompt.includes("restaurant") || lowercasePrompt.includes("dining")) {
    return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("hotel") || lowercasePrompt.includes("resort") || lowercasePrompt.includes("accommodation")) {
    return "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("museum") || lowercasePrompt.includes("art") || lowercasePrompt.includes("gallery")) {
    return "https://images.unsplash.com/photo-1566054757965-8c4085344d96?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("park") || lowercasePrompt.includes("garden") || lowercasePrompt.includes("nature")) {
    return "https://images.unsplash.com/photo-1500964757637-c85e8a162699?q=80&w=1000&auto=format&fit=crop";
  }
  
  if (lowercasePrompt.includes("landmark") || lowercasePrompt.includes("monument") || lowercasePrompt.includes("historic")) {
    return "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000&auto=format&fit=crop";
  }
  
  // Default travel image
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop";
}

export async function generateTripIdea(
  destination: string,
  preferences?: string[],
  duration?: string
): Promise<TripIdea> {
  try {
    const preferencesString = preferences ? preferences.join(", ") : "general tourism";
    const durationString = duration || "a week";
    
    // Check if API key is missing - if so, immediately return fallback data
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Using fallback trip idea data.");
      return generateFallbackTripIdea(destination, preferencesString, durationString);
    }
    
    const prompt = `
      Create a travel plan idea for a trip to ${destination}.
      The traveler is interested in: ${preferencesString}.
      The trip duration is approximately ${durationString}.
      
      Format your response as a JSON object with the following structure:
      {
        "summary": "Brief overview of the destination and trip",
        "highlights": ["Must-see attraction 1", "Must-see attraction 2", "Must-see attraction 3"],
        "bestTimeToVisit": "Season or months that are ideal",
        "estimatedBudget": "Price range in USD for this trip",
        "recommendedDuration": "Ideal length of stay"
      }
    `;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return generateFallbackTripIdea(destination, preferencesString, durationString);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    let result: TripIdea;
    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      console.error("Raw response:", text);
      return generateFallbackTripIdea(destination, preferencesString, durationString);
    }
    
    return result;
  } catch (error) {
    console.error("Error generating trip idea:", error);
    return generateFallbackTripIdea(destination, preferences?.join(", ") || "general tourism", duration || "a week");
  }
}

// Helper function to generate fallback trip ideas when the API is unavailable
function generateFallbackTripIdea(destination: string, preferences: string, duration: string): TripIdea {
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
        summary: "Discover the romance and charm of Paris, the City of Light. Known for its iconic landmarks, world-class museums, and exquisite cuisine, Paris offers a perfect blend of history, culture, and beauty that makes it one of the world's most visited destinations.",
        highlights: [
          "Marvel at the iconic Eiffel Tower",
          "Explore the vast art collections at the Louvre Museum",
          "Visit the Gothic masterpiece Notre-Dame Cathedral",
          "Stroll along the elegant Champs-Élysées",
          "Experience Parisian café culture"
        ],
        bestTimeToVisit: "April to June or September to October for mild weather and fewer crowds",
        estimatedBudget: "$150-250 per day including accommodations, food, and activities",
        recommendedDuration: "5-7 days to experience the main attractions of Paris"
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

export async function generateItinerary(trip: Trip): Promise<GeneratedItinerary> {
  try {
    const startDate = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "unspecified start date";
    const endDate = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "unspecified end date";
    const preferencesString = trip.preferences ? trip.preferences.join(", ") : "general tourism";
    
    // Check if API key is missing - if so, immediately return fallback data
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Using fallback itinerary data.");
      return generateFallbackItinerary(trip);
    }
    
    const prompt = `
      Create a detailed day-by-day itinerary for a trip to ${trip.destination}.
      The trip is from ${startDate} to ${endDate}.
      The traveler's preferences include: ${preferencesString}.
      The trip title is: ${trip.title}.
      Budget range: ${trip.budget || "moderate"}.

      IMPORTANT REQUIREMENTS:
      1. Be VERY specific with actual place names, full addresses, and local attractions - avoid generic descriptions.
      2. Include SPECIFIC hotel recommendations with approximate prices and detailed neighborhood information.
      3. Include at least one local restaurant recommendation for each day with cuisine type and price range.
      4. For each activity or location, include a short interesting fact that most tourists wouldn't know.
      5. Recommend specific transportation options between major stops (exact bus/train numbers, transit options).
      6. Mention any seasonal events, festivals, or local markets happening during the travel dates.
      7. Include at least one off-the-beaten-path or hidden gem location per day.
      
      IMPORTANT: Do NOT include any image URLs in your response. Leave the "image" fields empty, and we'll generate them separately.
      
      Format your response as a JSON object with the following structure:
      {
        "days": [
          {
            "dayNumber": 1,
            "title": "Day 1: Arrival & Orientation",
            "city": "Main city being visited that day",
            "image": "",
            "activities": [
              {
                "title": "Activity name",
                "description": "Detailed description with specific information about the place, including an interesting fact",
                "time": "Specific time (e.g., '9:00 AM - 11:30 AM')",
                "location": "Full location name with address or neighborhood",
                "type": "Type of activity (e.g., 'sightseeing', 'meal', 'transportation', 'hidden gem')",
                "rating": 4.5,
                "reviewCount": 423,
                "city": "Specific city or neighborhood where this activity takes place",
                "image": ""
              }
            ]
          }
        ],
        "bookings": [
          {
            "type": "Type of booking (hotel, flight, activity)",
            "title": "Specific name of the booking (hotel name, tour company, etc.)",
            "provider": "Specific service provider name with location",
            "price": "Estimated price range in USD or local currency",
            "rating": 4.5,
            "reviewCount": 423,
            "image": "",
            "details": { 
              "address": "Full address",
              "website": "Official website if available",
              "contactInfo": "Phone number or email if available",
              "notes": "Special features, amenities, or considerations"
            }
          }
        ]
      }
      
      Include exactly 4 activities per day, ensuring a mix of morning, afternoon, and evening activities.
      For bookings, include at least two accommodation options at different price points, local transportation options with specific details, and at least three key attractions or tours that require advance booking.
    `;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return generateFallbackItinerary(trip);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    let result: GeneratedItinerary;
    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      console.error("Raw response:", text);
      return generateFallbackItinerary(trip);
    }
    
    // Add dates to the days if trip dates are specified
    if (trip.startDate) {
      const startDateObj = new Date(trip.startDate);
      result.days.forEach((day, index) => {
        const dayDate = new Date(startDateObj);
        dayDate.setDate(startDateObj.getDate() + index);
        day.date = dayDate;
      });
    }
    
    // Generate images for each day and activity using Gemini
    if (GEMINI_API_KEY) {
      // Generate images in parallel to speed up the process
      const dayImagePromises = result.days.map(async (day) => {
        const prompt = `Travel destination photo of ${day.city || trip.destination} - ${day.title.replace("Day " + day.dayNumber + ":", "").trim()}`;
        day.image = await generateImageWithGemini(prompt) || "";
        return day;
      });
      
      // Wait for all day images to be generated
      await Promise.all(dayImagePromises);
      
      // Generate activity images in parallel for each day
      const activityImagePromises = result.days.flatMap(day => 
        day.activities.map(async (activity) => {
          const prompt = `Travel photo of ${activity.title} in ${activity.city || day.city || trip.destination}`;
          activity.image = await generateImageWithGemini(prompt) || "";
          return activity;
        })
      );
      
      // Generate booking images in parallel
      const bookingImagePromises = result.bookings.map(async (booking) => {
        const prompt = `Photo of ${booking.type} - ${booking.title} in ${trip.destination}`;
        booking.image = await generateImageWithGemini(prompt) || "";
        return booking;
      });
      
      // Wait for all activity and booking images to be generated
      await Promise.all([...activityImagePromises, ...bookingImagePromises]);
    }
    
    return result;
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return generateFallbackItinerary(trip);
  }
}

// Generate a fallback itinerary when the API is unavailable
function generateFallbackItinerary(trip: Trip): GeneratedItinerary {
  // Calculate the number of days for the trip
  let numDays = 3; // Default to 3 days if no dates provided
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day
  }
  
  // Create an array of days with activities
  const days: ItineraryDay[] = [];
  for (let i = 0; i < numDays; i++) {
    let dayDate: Date | undefined = undefined;
    if (trip.startDate) {
      dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + i);
    }
    
    // Different activities based on the day number
    let activities = [];
    if (i === 0) {
      // First day - arrival activities
      activities = [
        {
          title: "Arrival and Check-in",
          description: "Arrive at your accommodation and get settled in. Take some time to rest and refresh after your journey.",
          time: "2:00 PM - 4:00 PM",
          location: "Your hotel or accommodation in " + trip.destination,
          type: "arrival",
          rating: 4.5,
          reviewCount: 120
        },
        {
          title: "Orientation Walk",
          description: "Take a leisurely stroll around the neighborhood to get oriented and discover nearby amenities.",
          time: "4:30 PM - 6:00 PM",
          location: "Area surrounding your accommodation",
          type: "exploration",
          rating: 4.7,
          reviewCount: 85
        },
        {
          title: "Welcome Dinner",
          description: "Enjoy your first meal in " + trip.destination + " at a local restaurant serving traditional cuisine.",
          time: "7:00 PM - 9:00 PM",
          location: "Local restaurant near your accommodation",
          type: "meal",
          rating: 4.6,
          reviewCount: 230
        },
        {
          title: "Evening Relaxation",
          description: "Return to your accommodation and plan the details for tomorrow's adventures.",
          time: "9:30 PM - 11:00 PM",
          location: "Your accommodation",
          type: "relaxation",
          rating: 4.4,
          reviewCount: 65
        }
      ];
    } else if (i === numDays - 1) {
      // Last day - departure activities
      activities = [
        {
          title: "Final Breakfast",
          description: "Enjoy a relaxed breakfast at a local café, savoring the flavors of " + trip.destination + " one last time.",
          time: "8:00 AM - 9:30 AM",
          location: "Local café near your accommodation",
          type: "meal",
          rating: 4.5,
          reviewCount: 185
        },
        {
          title: "Last-Minute Shopping",
          description: "Pick up any souvenirs or items you want to bring back from your trip.",
          time: "10:00 AM - 12:00 PM",
          location: "Shopping district in " + trip.destination,
          type: "shopping",
          rating: 4.3,
          reviewCount: 210
        },
        {
          title: "Lunch and Farewell",
          description: "Have a final meal in " + trip.destination + " before preparing to depart.",
          time: "12:30 PM - 2:00 PM",
          location: "Restaurant in " + trip.destination,
          type: "meal",
          rating: 4.6,
          reviewCount: 175
        },
        {
          title: "Departure",
          description: "Check out of your accommodation and head to the airport or train station for your departure.",
          time: "3:00 PM - 5:00 PM",
          location: "From your accommodation to transport hub",
          type: "departure",
          rating: 4.4,
          reviewCount: 95
        }
      ];
    } else {
      // Middle days - sightseeing activities
      activities = [
        {
          title: "Morning Sightseeing",
          description: "Visit a major attraction or landmark in " + trip.destination + ".",
          time: "9:00 AM - 12:00 PM",
          location: "Popular attraction in " + trip.destination,
          type: "sightseeing",
          rating: 4.8,
          reviewCount: 320
        },
        {
          title: "Local Lunch",
          description: "Enjoy lunch at a restaurant known for authentic local cuisine.",
          time: "12:30 PM - 2:00 PM",
          location: "Local restaurant in " + trip.destination,
          type: "meal",
          rating: 4.5,
          reviewCount: 245
        },
        {
          title: "Afternoon Activity",
          description: "Explore another interesting site or participate in a cultural activity.",
          time: "2:30 PM - 5:30 PM",
          location: "Cultural site in " + trip.destination,
          type: "activity",
          rating: 4.6,
          reviewCount: 190
        },
        {
          title: "Evening Entertainment",
          description: "Experience the nightlife or entertainment options in " + trip.destination + ".",
          time: "7:00 PM - 10:00 PM",
          location: "Entertainment venue in " + trip.destination,
          type: "entertainment",
          rating: 4.7,
          reviewCount: 215
        }
      ];
    }
    
    days.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${i === 0 ? "Arrival & Orientation" : i === numDays - 1 ? "Departure Day" : "Exploration Day"}`,
      date: dayDate,
      city: trip.destination,
      activities: activities
    });
  }
  
  // Create sample bookings
  const bookings: ItineraryBooking[] = [
    {
      type: "hotel",
      title: "Comfortable Hotel in " + trip.destination,
      provider: "Sample Accommodations Inc.",
      price: "$120-180 per night",
      rating: 4.4,
      reviewCount: 235,
      details: {
        address: trip.destination + " Central District",
        website: "https://example.com/hotel",
        contactInfo: "+1-555-0123",
        notes: "Includes breakfast and free WiFi"
      }
    },
    {
      type: "hotel",
      title: "Luxury Stay in " + trip.destination,
      provider: "Premium Lodging Group",
      price: "$250-350 per night",
      rating: 4.8,
      reviewCount: 412,
      details: {
        address: trip.destination + " Upscale Area",
        website: "https://example.com/luxury-hotel",
        contactInfo: "+1-555-0124",
        notes: "Full-service spa, pool, and multiple dining options"
      }
    },
    {
      type: "tour",
      title: "Guided City Tour of " + trip.destination,
      provider: "Local Experts Tours",
      price: "$45 per person",
      rating: 4.7,
      reviewCount: 186,
      details: {
        address: "Meeting point: Central Square",
        website: "https://example.com/city-tour",
        contactInfo: "+1-555-0125",
        notes: "3-hour tour covering major landmarks with knowledgeable local guide"
      }
    },
    {
      type: "activity",
      title: "Cultural Experience in " + trip.destination,
      provider: "Cultural Immersion Co.",
      price: "$65 per person",
      rating: 4.9,
      reviewCount: 138,
      details: {
        address: trip.destination + " Cultural District",
        website: "https://example.com/cultural-experience",
        contactInfo: "+1-555-0126",
        notes: "Hands-on workshop and demonstration of local traditions"
      }
    },
    {
      type: "transportation",
      title: "Airport Transfer",
      provider: "Reliable Transit Services",
      price: "$30-45 each way",
      rating: 4.6,
      reviewCount: 215,
      details: {
        address: trip.destination + " Airport",
        website: "https://example.com/airport-transfer",
        contactInfo: "+1-555-0127",
        notes: "Pre-booking required, 24/7 service available"
      }
    }
  ];
  
  return {
    days: days,
    bookings: bookings
  };
}

// Function to handle chatbot-style interactions
export async function chatWithAI(
  messages: ChatMessage[],
  tripContext?: Trip
): Promise<ChatbotResponse> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        reply: "I'm sorry, but I'm currently unable to access my AI capabilities. Please try again later or contact support."
      };
    }
    
    // Prepare trip context if available
    let tripContextString = "";
    if (tripContext) {
      const startDate = tripContext.startDate 
        ? new Date(tripContext.startDate).toISOString().split('T')[0] 
        : "not specified";
      const endDate = tripContext.endDate 
        ? new Date(tripContext.endDate).toISOString().split('T')[0] 
        : "not specified";
      
      tripContextString = `
        Current trip context:
        - Destination: ${tripContext.destination}
        - Trip title: ${tripContext.title}
        - Date range: ${startDate} to ${endDate}
        - Budget: ${tripContext.budget || "not specified"}
        - Preferences: ${tripContext.preferences?.join(", ") || "not specified"}
      `;
    }
    
    // Prepare system instruction with trip context
    const systemInstruction = `
      You are a helpful travel assistant. Provide accurate, concise, and helpful information about travel destinations, 
      planning trips, and travel-related questions. Be conversational and friendly. When answering questions, 
      consider the user's current trip context if available.
      
      ${tripContextString}
      
      When providing suggestions related to activities, accommodation, or transportation, 
      be specific with names, approximate prices, and helpful tips. If you don't know something, 
      acknowledge it and suggest alternative information that might be helpful.
      
      Keep responses concise and focused, ideally under 3-4 paragraphs.
    `;
    
    // Format messages for Gemini
    const formattedMessages = [
      { role: "user", parts: [{ text: systemInstruction }] },
      ...messages.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }))
    ];
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return {
        reply: "I'm having trouble connecting to my knowledge base right now. Could you please try again in a moment?"
      };
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract some follow-up suggestions
    let suggestions: string[] = [];
    try {
      // Generate some follow-up questions in a separate request
      const suggestionsPrompt = `
        Based on this conversation and response, suggest 3 brief follow-up questions the user might ask next.
        Format as a JSON array of strings like ["Question 1?", "Question 2?", "Question 3?"]
        
        Previous messages: ${JSON.stringify(messages)}
        Your response: ${text}
      `;
      
      const suggestionsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: suggestionsPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 256,
            },
          }),
        }
      );
      
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        const suggestionsText = suggestionsData.candidates[0].content.parts[0].text;
        
        // Extract JSON array from response
        const jsonMatch = suggestionsText.match(/\[.*\]/s);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Continue without suggestions
    }
    
    return {
      reply: text,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  } catch (error) {
    console.error("Error in chat:", error);
    return {
      reply: "I'm experiencing some technical difficulties. Please try again in a moment."
    };
  }
}