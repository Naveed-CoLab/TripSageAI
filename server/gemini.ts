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
  activities: Array<{
    title: string;
    description?: string;
    time?: string;
    location?: string;
    type?: string;
  }>;
};

type ItineraryBooking = {
  type: string;
  title: string;
  provider?: string;
  price?: string;
  details?: any;
};

type GeneratedItinerary = {
  days: ItineraryDay[];
  bookings: ItineraryBooking[];
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set! AI features will not work properly.");
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
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
      
    case 'rome':
    case 'italy':
      tripIdea = {
        summary: "Step back in time in Rome, the Eternal City, where ancient history meets modern Italian life. With its incredible archaeological sites, Renaissance masterpieces, and vibrant streets, Rome offers an unforgettable journey through the layers of Western civilization.",
        highlights: [
          "Explore the ancient Colosseum and Roman Forum",
          "Visit Vatican City and St. Peter's Basilica",
          "Toss a coin in the Trevi Fountain",
          "Marvel at the perfect dome of the Pantheon",
          "Indulge in authentic Italian cuisine"
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
      
      Format your response as a JSON object with the following structure:
      {
        "days": [
          {
            "dayNumber": 1,
            "title": "Day 1: Arrival & Orientation",
            "activities": [
              {
                "title": "Activity name",
                "description": "Detailed description with specific information about the place, including an interesting fact",
                "time": "Specific time (e.g., '9:00 AM - 11:30 AM')",
                "location": "Full location name with address or neighborhood",
                "type": "Type of activity (e.g., 'sightseeing', 'meal', 'transportation', 'hidden gem')"
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
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
          title: "Check-in at accommodation",
          description: "Arrive at your hotel or rental and get settled in",
          time: "2:00 PM",
          location: `${trip.destination} central area`,
          type: "accommodation"
        },
        {
          title: "Local area orientation",
          description: "Take a relaxed walk around the neighborhood to get familiar with your surroundings",
          time: "4:00 PM",
          location: "Surrounding area",
          type: "exploration"
        },
        {
          title: "Welcome dinner",
          description: "Enjoy local cuisine at a nearby restaurant",
          time: "7:00 PM",
          location: "Local restaurant",
          type: "meal"
        }
      ];
    } else if (i === numDays - 1) {
      // Last day - departure activities
      activities = [
        {
          title: "Breakfast at accommodation",
          description: "Enjoy your final breakfast at your accommodation",
          time: "8:00 AM",
          location: "Accommodation",
          type: "meal"
        },
        {
          title: "Last-minute shopping",
          description: "Pick up souvenirs or any items you want to bring back",
          time: "10:00 AM",
          location: "Local shops",
          type: "shopping"
        },
        {
          title: "Check-out and departure",
          description: "Check out from your accommodation and prepare for departure",
          time: "12:00 PM",
          location: "Accommodation",
          type: "transportation"
        }
      ];
    } else {
      // Middle days - sightseeing activities
      activities = [
        {
          title: `Explore ${trip.destination} highlights - Day ${i+1}`,
          description: "Visit main attractions and landmarks",
          time: "9:00 AM",
          location: `${trip.destination} center`,
          type: "sightseeing"
        },
        {
          title: "Local lunch experience",
          description: "Taste local specialties at a popular restaurant",
          time: "1:00 PM",
          location: "Local restaurant",
          type: "meal"
        },
        {
          title: "Cultural experience",
          description: `Participate in a cultural activity unique to ${trip.destination}`,
          time: "3:00 PM",
          location: "Cultural venue",
          type: "cultural"
        },
        {
          title: "Evening relaxation",
          description: "Enjoy dinner and evening entertainment",
          time: "7:00 PM",
          location: "Entertainment district",
          type: "entertainment"
        }
      ];
    }
    
    days.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${i === 0 ? "Arrival & Orientation" : i === numDays - 1 ? "Departure" : `Exploring ${trip.destination}`}`,
      date: dayDate,
      activities: activities
    });
  }
  
  // Create basic booking suggestions
  const bookings: ItineraryBooking[] = [
    {
      type: "accommodation",
      title: `Hotel in ${trip.destination}`,
      provider: "Various hotels available",
      price: "$80-200 per night",
      details: {
        checkIn: "After 2:00 PM",
        checkOut: "Before 12:00 PM",
        amenities: ["Wi-Fi", "Breakfast", "Air conditioning"]
      }
    },
    {
      type: "transportation",
      title: `Airport transfer to ${trip.destination}`,
      provider: "Local taxi service",
      price: "$20-40",
      details: {
        type: "Taxi/Shuttle",
        duration: "30-45 minutes"
      }
    },
    {
      type: "activity",
      title: `${trip.destination} guided tour`,
      provider: "Local tour operator",
      price: "$25-50 per person",
      details: {
        duration: "3 hours",
        includes: ["Professional guide", "Entrance fees"]
      }
    }
  ];
  
  return {
    days,
    bookings
  };
}

// AI-powered chatbot function
export async function getAIChatResponse(
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  context: {
    destination?: string;
    tripDates?: {start?: string; end?: string};
    preferences?: string[];
  } = {}
): Promise<ChatbotResponse> {
  try {
    // Check if API key is missing - if so, return a simple fallback response
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Using fallback chatbot response.");
      return {
        reply: "I'm your travel assistant! I can help you plan your trip, find destinations, and answer travel questions. However, I'm operating in offline mode right now. Please try again later when the service is fully available.",
        suggestions: ["Tell me about popular destinations", "How to plan a budget trip?", "Best time to visit Europe"]
      };
    }
    
    const historyFormatted = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    
    // Build context information
    let contextInfo = "";
    if (context.destination) {
      contextInfo += `User is interested in traveling to: ${context.destination}.\n`;
    }
    if (context.tripDates?.start && context.tripDates?.end) {
      contextInfo += `Their travel dates are from ${context.tripDates.start} to ${context.tripDates.end}.\n`;
    }
    if (context.preferences && context.preferences.length > 0) {
      contextInfo += `Their travel preferences include: ${context.preferences.join(", ")}.\n`;
    }
    
    // Create system message
    const systemMessage = {
      role: "system",
      parts: [{ text: `You are an AI-powered travel companion that helps users plan their trips and answers travel-related questions.
      
      ${contextInfo}
      
      Keep your responses travel-focused, friendly, and concise (under 150 words when possible).
      Always provide helpful, accurate travel information.
      If the user asks about something unrelated to travel, politely redirect them to travel topics.
      At the end of your response, suggest 2-3 relevant follow-up questions the user might want to ask.
      
      Format your response as a JSON object with the following structure:
      {
        "reply": "Your helpful response to the user's query",
        "suggestions": ["Suggested follow-up question 1", "Suggested follow-up question 2", "Suggested follow-up question 3"]
      }
      `}]
    };
    
    // Combine everything for the API request
    let allMessages: any[] = [systemMessage];
    
    // Add history if exists
    if (historyFormatted.length > 0) {
      allMessages = [...allMessages, ...historyFormatted];
    }
    
    // Add the current user message
    allMessages.push({
      role: "user",
      parts: [{ text: userMessage }]
    });
    
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: allMessages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return {
        reply: "I'm sorry, I encountered an issue processing your request. Could you please try again?",
        suggestions: ["Tell me about popular destinations", "What should I pack for my trip?", "Best places to visit"]
      };
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    let result: ChatbotResponse;
    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      // If we couldn't parse as JSON, use the raw text as the reply
      return {
        reply: text,
        suggestions: ["Tell me more about this", "What else should I know?", "Any recommendations?"]
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    return {
      reply: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
      suggestions: ["Tell me about popular destinations", "How to plan a budget trip?", "Best time to visit Europe"]
    };
  }
}

// This second implementation of generateFallbackItinerary has been removed
// The main implementation is at line 347
