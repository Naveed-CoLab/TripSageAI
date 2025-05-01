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
      1. Follow EXACTLY the format shown in the examples below, including proper spacing and layout.
      2. Be VERY specific with actual place names, EXACT addresses with postal/zip codes, and real local attractions.
      3. For EACH activity, include precise time slots (e.g., "2:00 PM - 4:00 PM") with realistic time durations.
      4. For EACH activity, include a specific location with complete street address, city, and postal/zip code that actually exists in the city.
      5. For EACH activity, add a detailed interesting fact prefaced with "Interesting fact:" - focus on historical or cultural significance that most tourists wouldn't know.
      6. For EACH activity, assign ONE of these specific activity types: "transportation", "hotel", "sightseeing", "meal", "relaxation", "shopping", "cultural", "adventure", "entertainment", "nightlife", "nature".
      7. For EACH activity, include realistic ratings (between 3.5-4.9 out of 5 stars) and specific review counts (e.g., 1234 reviews).
      8. Include one main hotel booking with complete address details, nearby landmarks, and amenities.
      9. Each day should have a clear theme reflected in its title (e.g., "Day 1: Arrival & Historic Exploration").
      10. Include exact street addresses and postal/zip codes for ALL locations - never use generic addresses.
      11. For restaurant activities, include what cuisine is served and 1-2 recommended dishes.
      12. For sightseeing activities, mention how busy it typically is and best times to avoid crowds.
      13. When suggesting transportation, be specific about which bus/train number, route, or taxi service to use.
      
      IMPORTANT: Follow this EXACT formatting for each activity:
      - Start with a descriptive title that clearly explains the activity (e.g., "Check-in at Hotel Manoir Victoria")
      - Include exact time range (e.g., "1:00 PM - 2:00 PM")
      - Include full address with postal/zip code (e.g., "44 Côte du Palais, Quebec City, QC G1R 4H8")
      - Include activity type as a single word (e.g., "hotel", "sightseeing", "meal", "transportation")
      - Add 2-3 sentences with detailed information about the location/activity including an interesting fact
      - Include realistic rating (e.g., 4.7) and specific review count (e.g., 1234)
      
      IMPORTANT: Do NOT include any image URLs in your response. Leave the "image" fields empty, and we'll generate them separately.
      
      IMPORTANT: Create a balanced and realistic itinerary with:
      - Morning activities starting after 8:00 AM
      - Adequate lunch and dinner breaks
      - Reasonable travel times between locations
      - Sufficient free time for relaxation
      - Some evening activities when appropriate
      - At least 5-6 activities per day
      
      Format your response as a JSON object with the following structure:
      {
        "days": [
          {
            "dayNumber": 1,
            "title": "Day 1: Arrival & Exploring the Historic Center",
            "city": "Specific City Name",
            "image": "",
            "activities": [
              {
                "title": "Arrival at City International Airport & Transfer to Hotel",
                "description": "Arrive at the airport and take the #78 bus to the city center. Interesting fact: This airport was originally a military base during WWII.",
                "time": "12:00 PM - 1:00 PM",
                "location": "City International Airport, 123 Airport Road, City, ABC 123",
                "type": "transportation",
                "rating": 4.3,
                "reviewCount": 1234,
                "city": "City Name",
                "image": ""
              },
              {
                "title": "Check-in at Grand Hotel Downtown",
                "description": "Settle into your charming hotel in the heart of the historic district. Interesting fact: Parts of the hotel are built on the foundations of 17th-century buildings.",
                "time": "1:00 PM - 2:00 PM",
                "location": "44 Main Street, Historic District, City, DEF 456",
                "type": "hotel",
                "rating": 4.7,
                "reviewCount": 2345,
                "city": "City Name",
                "image": ""
              },
              {
                "title": "Explore Historic District",
                "description": "Wander through the oldest neighborhood in North America with cobblestone streets and historic architecture. Interesting fact: This area was once the commercial hub for fur trading in the 17th century.",
                "time": "2:00 PM - 5:00 PM",
                "location": "Historic District, City Name",
                "type": "sightseeing",
                "rating": 4.9,
                "reviewCount": 3456,
                "city": "City Name",
                "image": ""
              },
              {
                "title": "Dinner at Local Traditional Restaurant",
                "description": "Enjoy authentic local cuisine at this family-owned restaurant that's been operating for over 50 years. Interesting fact: The signature dish uses a recipe that dates back to the early settlers.",
                "time": "6:30 PM - 8:30 PM",
                "location": "78 Cuisine Street, Historic District, City, GHI 789",
                "type": "meal",
                "rating": 4.6,
                "reviewCount": 1876,
                "city": "City Name",
                "image": ""
              }
            ]
          }
        ],
        "bookings": [
          {
            "type": "hotel",
            "title": "Grand Hotel Downtown",
            "provider": "Grand Hotels Group",
            "price": "$180-250 per night",
            "rating": 4.7,
            "reviewCount": 2345,
            "image": "",
            "details": { 
              "address": "44 Main Street, Historic District, City, DEF 456",
              "website": "www.grandhoteldowntown.com",
              "contactInfo": "+1-555-123-4567",
              "notes": "Includes free breakfast, WiFi, and access to fitness center. Historic building with modern amenities."
            }
          }
        ]
      }
      
      Include exactly 4 activities per day, with the following pattern:
      - First activity of Day 1: Airport arrival or transportation to destination
      - Second activity of Day 1: Hotel check-in
      - Last activity of the final day: Departure transportation
      
      For each day, include:
      - One morning activity (8:00 AM - 12:00 PM time slot)
      - One lunch activity (12:00 PM - 2:00 PM time slot)
      - One afternoon activity (2:00 PM - 6:00 PM time slot)
      - One dinner or evening activity (6:00 PM - 10:00 PM time slot)
      
      For bookings, include at least:
      - The main accommodation with EXACT address and contact details
      - Any pre-booked tours or special activities
      - Transportation arrangements if applicable
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
            maxOutputTokens: 16384,
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
  
  // Create an array of days with detailed activities
  const days: ItineraryDay[] = [];
  for (let i = 0; i < numDays; i++) {
    let dayDate: Date | undefined = undefined;
    if (trip.startDate) {
      dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + i);
    }
    
    // Different activities based on the day number
    let activities = [];
    
    // First day - arrival activities
    if (i === 0) {
      activities = [
        {
          title: "Arrival at " + trip.destination + " International Airport & Transfer to Hotel",
          description: "Arrive at the airport and take the Airport Express shuttle bus #A1 to the city center, departing every 15 minutes from Terminal 1. Interesting fact: This airport was originally built as a military airbase in 1942 before being converted to civilian use in 1960, and now serves over 15 million passengers annually.",
          time: "12:00 PM - 1:30 PM",
          location: trip.destination + " International Airport, 200 Airport Boulevard, " + trip.destination + ", AX1 2ZY",
          type: "transportation",
          rating: 4.3,
          reviewCount: 1678,
          city: trip.destination
        },
        {
          title: "Check-in at Grand " + trip.destination + " Hotel",
          description: "Settle into your 4-star hotel in the heart of downtown, featuring an indoor pool, spa services, and complimentary high-speed WiFi. Interesting fact: The hotel building dates back to 1930 and was originally the headquarters of National Trust Bank, with the original vault now serving as a unique conference room in the basement level.",
          time: "1:30 PM - 2:30 PM",
          location: "123 Main Avenue, Downtown, " + trip.destination + ", DW1 7HG",
          type: "hotel",
          rating: 4.7,
          reviewCount: 2345,
          city: trip.destination
        },
        {
          title: "Orientation Walk Around Downtown " + trip.destination,
          description: "Take a leisurely stroll around the central district to get oriented and discover nearby landmarks. Best to visit in the afternoon when crowds are smaller. Interesting fact: The downtown area features architecture spanning three distinct periods: Georgian, Victorian, and Art Deco, with many buildings surviving the major fire of 1887 that destroyed nearly 30% of the city center.",
          time: "3:00 PM - 5:30 PM",
          location: "Central Plaza, 45 Heritage Boulevard, Downtown, " + trip.destination + ", DW2 8JK",
          type: "sightseeing",
          rating: 4.8,
          reviewCount: 1876,
          city: trip.destination
        },
        {
          title: "Welcome Dinner at Local Cuisine Restaurant",
          description: "Enjoy your first meal in " + trip.destination + " at an authentic restaurant serving traditional specialties. Interesting fact: This restaurant has been family-owned for over 50 years and uses recipes passed down through generations.",
          time: "7:00 PM - 9:00 PM",
          location: "45 Culinary Street, Historic District, " + trip.destination + ", JKL 012",
          type: "meal",
          rating: 4.6,
          reviewCount: 1543,
          city: trip.destination
        }
      ];
    } 
    // Last day - departure activities
    else if (i === numDays - 1) {
      activities = [
        {
          title: "Breakfast at Café Morning Glory",
          description: "Enjoy a relaxed breakfast at this popular local café with outdoor seating. Interesting fact: This café sources all ingredients from within a 50-mile radius and works directly with local farmers.",
          time: "8:30 AM - 10:00 AM",
          location: "78 Sunrise Road, Downtown, " + trip.destination + ", MNO 345",
          type: "meal",
          rating: 4.5,
          reviewCount: 1654,
          city: trip.destination
        },
        {
          title: "Souvenir Shopping at Central Market",
          description: "Pick up souvenirs and local crafts at the famous market. Interesting fact: This market has been operating continuously since 1875 and features over 200 independent vendors.",
          time: "10:30 AM - 12:30 PM",
          location: "Central Market, 234 Market Street, " + trip.destination + ", PQR 678",
          type: "shopping",
          rating: 4.4,
          reviewCount: 2145,
          city: trip.destination
        },
        {
          title: "Farewell Lunch at Panorama Restaurant",
          description: "Have a final meal at this restaurant known for spectacular views of the city. Interesting fact: The restaurant rotates 360 degrees every 90 minutes, offering diners a complete panoramic view.",
          time: "1:00 PM - 2:30 PM",
          location: "Panorama Tower, 56 View Street, " + trip.destination + ", STU 901",
          type: "meal",
          rating: 4.7,
          reviewCount: 1935,
          city: trip.destination
        },
        {
          title: "Departure from " + trip.destination + " International Airport",
          description: "Check out of your hotel and take the Airport Express shuttle bus #A1 from Central Plaza, departing every 20 minutes. Arrive at the airport at least 2 hours before your flight. Interesting fact: The airport recently completed a $450 million eco-friendly renovation, installing one of the largest solar panel arrays in the country that now generates 35% of its electricity needs.",
          time: "3:30 PM - 5:30 PM",
          location: trip.destination + " International Airport, 200 Airport Boulevard, " + trip.destination + ", AX1 2ZY",
          type: "transportation",
          rating: 4.3,
          reviewCount: 1582,
          city: trip.destination
        }
      ];
    } 
    // Middle days - exploration activities with specific names and details
    else {
      activities = [
        {
          title: "Visit to " + trip.destination + " National Museum",
          description: "Explore the renowned museum with artifacts dating back centuries. Weekday mornings are the least crowded times to visit. Interesting fact: The museum houses over 100,000 items, including a collection of ancient manuscripts found in a nearby cave system in 1943 that changed historians' understanding of the region's early writing systems.",
          time: "9:30 AM - 12:00 PM",
          location: "67 Museum Boulevard, Cultural District, " + trip.destination + ", VWX 234",
          type: "cultural",
          rating: 4.8,
          reviewCount: 3210,
          city: trip.destination
        },
        {
          title: "Lunch at Riverside Grill",
          description: "Enjoy lunch at this popular restaurant with waterfront views, specializing in fresh seafood and local specialties. Try their signature fish chowder or grilled local catch of the day. Interesting fact: The building was once a 19th-century customs house, and some of the original architectural elements remain intact, including the harbormaster's office which is now a private dining room.",
          time: "12:30 PM - 2:00 PM",
          location: "12 River Walk, Waterfront District, " + trip.destination + ", YZA 567",
          type: "meal",
          rating: 4.5,
          reviewCount: 2456,
          city: trip.destination
        },
        {
          title: "Explore " + trip.destination + " Botanical Gardens",
          description: "Wander through the spectacular gardens featuring over 3,000 native and exotic plant species. The tropical pavilion is particularly impressive and worth at least 30 minutes. Interesting fact: The gardens contain a 300-year-old oak tree that survived a major fire in 1879 that destroyed much of the surrounding area, and is now considered a living monument with its own dedicated conservation program.",
          time: "2:30 PM - 5:00 PM",
          location: "89 Garden Path, Green District, " + trip.destination + ", BCD 890",
          type: "nature",
          rating: 4.9,
          reviewCount: 1987,
          city: trip.destination
        },
        {
          title: "Evening at Historic Theater District",
          description: "Experience the vibrant nightlife and entertainment options in the historic theater area. The Royal Theater offers evening performances starting at 7:30 PM, with tickets starting at $45. Interesting fact: This district has been the center of entertainment for the city since the 1920s and played a key role in the development of jazz music in the region, with famous musicians like Louis Armstrong and Duke Ellington having performed in several venues here.",
          time: "7:00 PM - 10:00 PM",
          location: "Theater District, 45 Entertainment Avenue, " + trip.destination + ", EFG 123",
          type: "entertainment",
          rating: 4.7,
          reviewCount: 2134,
          city: trip.destination
        }
      ];
    }
    
    // Create day with sophisticated title based on day number
    let dayTitle = "";
    if (i === 0) {
      dayTitle = `Day ${i + 1}: Arrival & First Impressions of ${trip.destination}`;
    } else if (i === numDays - 1) {
      dayTitle = `Day ${i + 1}: Farewell to ${trip.destination}`;
    } else if (i === 1) {
      dayTitle = `Day ${i + 1}: Discovering Cultural Highlights`;
    } else if (i === 2) {
      dayTitle = `Day ${i + 1}: Natural Beauty & Local Experiences`;
    } else {
      dayTitle = `Day ${i + 1}: Hidden Gems & Neighborhood Exploration`;
    }
    
    days.push({
      dayNumber: i + 1,
      title: dayTitle,
      date: dayDate,
      city: trip.destination,
      activities: activities
    });
  }
  
  // Create detailed bookings with realistic information
  const bookings: ItineraryBooking[] = [
    {
      type: "hotel",
      title: "Grand " + trip.destination + " Hotel",
      provider: "Grand Hotels International",
      price: "$180-250 per night",
      rating: 4.7,
      reviewCount: 2345,
      details: {
        address: "123 Main Avenue, Downtown, " + trip.destination + ", DW1 7HG",
        website: "www.grand" + trip.destination.toLowerCase().replace(/\s/g, "") + "hotel.com",
        contactInfo: "+1-555-123-4567",
        checkIn: "3:00 PM",
        checkOut: "11:00 AM",
        amenities: ["Free Wi-Fi", "Indoor Pool", "Fitness Center", "Restaurant", "Bar/Lounge", "Room Service", "Business Center", "Concierge", "Parking ($25/day)", "Spa Services"],
        roomTypes: ["Standard Queen", "Deluxe King", "Junior Suite", "Executive Suite"],
        nearbyAttractions: ["Central Museum (0.3 miles)", "Historic District (0.5 miles)", "Shopping District (0.7 miles)", "Conference Center (0.4 miles)"],
        notes: "Includes full breakfast buffet 6:30 AM - 10:30 AM daily. Located in the heart of downtown with easy access to major attractions and public transportation. Early check-in available based on availability for an additional $50 fee."
      }
    },
    {
      type: "tour",
      title: trip.destination + " Highlights Walking Tour",
      provider: "Local Expert Tours",
      price: "$45 per person",
      rating: 4.8,
      reviewCount: 1865,
      details: {
        address: "Meeting point: Visitor Center, 78 Tourist Plaza, " + trip.destination + ", DW3 9TU",
        website: "www.localexperttours.com/" + trip.destination.toLowerCase().replace(/\s/g, ""),
        contactInfo: "+1-555-234-5678",
        schedule: "Daily at 9:30 AM and 2:00 PM",
        duration: "3 hours (approximately 2 miles of walking)",
        groupSize: "Maximum 12 people",
        languages: ["English", "Spanish", "French", "German"],
        highlights: ["Historic District", "Cultural Quarter", "Famous Landmarks", "Local Stories and Legends", "Hidden Gems"],
        accessibility: "Moderate walking required, some steps and uneven surfaces. Not suitable for wheelchairs.",
        cancellation: "Free cancellation up to 24 hours before the tour starts",
        notes: "Wear comfortable walking shoes and weather-appropriate clothing. Includes bottled water, small snack, and a local guidebook. Tours operate rain or shine - umbrellas provided if needed."
      }
    },
    {
      type: "transportation",
      title: "Airport Transfer Service",
      provider: "City Express Transportation",
      price: "$35-50 each way",
      rating: 4.6,
      reviewCount: 2156,
      details: {
        address: trip.destination + " International Airport, Ground Transportation Level, Terminal 1, Exit 4",
        website: "www.cityexpresstransport.com",
        contactInfo: "+1-555-345-6789",
        operatingHours: "24/7, 365 days a year",
        vehicleTypes: ["Standard Sedan (1-3 passengers)", "Executive Car (1-3 passengers)", "Minivan (4-6 passengers)", "Shuttle Van (7-10 passengers)"],
        serviceLevels: ["Standard", "Premium (includes Wi-Fi, bottled water, newspapers)", "VIP (includes priority service, refreshments)"],
        bookingDeadline: "At least 6 hours in advance for guaranteed service",
        pickupProcess: "Driver will meet you at the arrival hall with a name sign. Flight monitoring included - no extra charge for delayed flights.",
        paymentOptions: ["Credit Card", "PayPal", "Cash (to driver)"],
        notes: "Pre-booking required. Free waiting time (60 minutes for international flights, 30 minutes for domestic). Child seats available upon request. Luggage allowance: 1 large suitcase and 1 carry-on per passenger."
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