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
const GEMINI_MODEL = "gemini-1.5-pro"; // Using 1.5 Pro for better compatibility

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set! AI features will not work properly.");
}

// Import necessary modules for Unsplash
import { createApi } from 'unsplash-js';

// Setup Unsplash API client
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || '';
const unsplash = unsplashAccessKey ? createApi({ accessKey: unsplashAccessKey }) : null;

/**
 * Enhanced function to get images for travel destinations and activities
 * Uses multiple sources with fallback strategy:
 * 1. Unsplash API (if access key is available)
 * 2. Unsplash source URL (direct access that doesn't require API key)
 * 3. Gemini AI image generation
 */
export async function generateImageWithGemini(prompt: string): Promise<string | undefined> {
  // Try Unsplash API first if available
  if (unsplash) {
    try {
      console.log(`Fetching image from Unsplash API for: ${prompt}`);
      
      const searchQuery = `travel ${prompt}`;
      const result = await unsplash.search.getPhotos({
        query: searchQuery,
        orientation: 'landscape',
        perPage: 5,
        orderBy: 'relevant'
      });
      
      const photos = result.response?.results || [];
      if (photos.length > 0) {
        // Randomly select one of the top images for variety
        const randomIndex = Math.floor(Math.random() * Math.min(5, photos.length));
        const selectedPhoto = photos[randomIndex];
        
        console.log(`Found Unsplash image for: ${prompt}`);
        
        // Return image URL with attribution
        return selectedPhoto.urls.regular;
      }
    } catch (error) {
      console.error("Error fetching from Unsplash API:", error);
      // Continue to fallback methods
    }
  }
  
  // Try Unsplash source URL as fallback (doesn't require API key)
  try {
    console.log(`Trying Unsplash source URL for: ${prompt}`);
    
    // Clean and format the prompt for URL
    const cleanPrompt = encodeURIComponent(prompt.replace(/[^\w\s]/gi, '').replace(/\s+/g, ','));
    
    // Check if the URL is accessible
    const checkUrl = `https://source.unsplash.com/1200x800/?${cleanPrompt},travel`;
    const response = await fetch(checkUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`Found Unsplash direct image for: ${prompt}`);
      return checkUrl;
    }
  } catch (error) {
    console.error("Error with Unsplash source URL:", error);
    // Continue to AI generation
  }
  
  // Fallback to Gemini image generation as last resort
  try {
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Cannot generate image.");
      throw new Error("Gemini API key is missing. Unable to generate image.");
    }

    console.log(`Generating image with Gemini AI for: ${prompt}`);
    const enhancedPrompt = `High-quality travel photograph of ${prompt}. Clear lighting, detailed, professional travel photography style. 4K resolution.`;
    
    // Define the fetch function to be retried
    const fetchWithRetry = async () => {
      // For image generation, use gemini-1.5-flash which has better image generation capabilities
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
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
          }),
        }
      );

      if (!response.ok) {
        console.error(`Gemini image generation API error: ${response.statusText}`);
        throw new Error(`Image generation failed: ${response.statusText}`);
      }
      
      return response;
    };
    
    // Execute with retry logic - use shorter retry count for images to not block the main itinerary
    const response = await retryWithBackoff(fetchWithRetry, 2, 1500);
    const data = await response.json();
    
    // Extract image data from response
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts) {
      
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Return the base64 image data
          console.log(`Successfully generated AI image for: ${prompt}`);
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.error("No image found in Gemini response");
    throw new Error("No image found in Gemini response");
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    // Return undefined if all methods fail
    return undefined;
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
    
    // Check if API key is missing - if so, throw an error
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Cannot generate trip idea.");
      throw new Error("Gemini API key is missing. Please check your environment configuration.");
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
    
    // Define the fetch function to be retried
    const fetchWithRetry = async () => {
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
        throw new Error(`Failed to generate trip idea: ${response.statusText}`);
      }
      
      return response;
    };
    
    // Execute fetch with retry logic
    const response = await retryWithBackoff(fetchWithRetry, 3, 2000);
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
      throw new Error("Failed to parse AI-generated trip idea. Please try again.");
    }
    
    return result;
  } catch (error) {
    console.error("Error generating trip idea:", error);
    throw new Error("An error occurred while generating your trip idea. Please try again later.");
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

// Helper function to add delay with exponential backoff
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function for API calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const errorString = error.toString();
      const isRetryableError = 
        errorString.includes("Too Many Requests") || 
        errorString.includes("429") ||
        errorString.includes("network error") ||
        errorString.includes("timeout") ||
        errorString.includes("ECONNRESET") ||
        errorString.includes("ETIMEDOUT");
      
      if (retries >= maxRetries || !isRetryableError) {
        throw error; // Rethrow the error if maximum retries reached or it's not a retryable error
      }
      
      // Calculate delay with exponential backoff
      const waitTime = initialDelay * Math.pow(2, retries);
      console.log(`API error encountered. Retrying in ${waitTime}ms (retry ${retries + 1}/${maxRetries})...`);
      
      await delay(waitTime);
      retries++;
    }
  }
}

export async function generateItinerary(trip: Trip): Promise<GeneratedItinerary> {
  try {
    const startDate = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "unspecified start date";
    const endDate = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "unspecified end date";
    const preferencesString = trip.preferences ? trip.preferences.join(", ") : "general tourism";
    
    // Check if API key is missing - if so, throw an error
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is missing. Please check your environment configuration.");
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
    
    // Use the retry function to handle rate limiting
    const fetchWithRetry = async () => {
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
        throw new Error(`Failed to generate itinerary: ${response.statusText}`);
      }
      
      return response;
    };
    
    // Execute the fetch with retry logic
    const response = await retryWithBackoff(fetchWithRetry, 3, 2000);

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
      throw new Error("Failed to parse AI-generated itinerary. Please try again.");
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
    throw new Error("An error occurred while generating your itinerary. Please try again later.");
  }
}

// Generate a basic itinerary structure when Gemini API is unavailable
function generateFallbackItinerary(trip: Trip): GeneratedItinerary {
  console.warn("Using minimalistic fallback itinerary template - Gemini API is unavailable.");
  
  // Calculate the number of days for the trip
  let numDays = 3; // Default to 3 days if no dates provided
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day
  }
  
  // Create a simple array of days with placeholder information
  const days: ItineraryDay[] = [];
  
  for (let i = 0; i < numDays; i++) {
    let dayDate: Date | undefined = undefined;
    if (trip.startDate) {
      dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + i);
    }
    
    // Create a simple day title based on the day number
    let dayTitle = "";
    if (i === 0) {
      dayTitle = `Day ${i + 1}: Arrival in ${trip.destination}`;
    } else if (i === numDays - 1) {
      dayTitle = `Day ${i + 1}: Departure from ${trip.destination}`;
    } else {
      dayTitle = `Day ${i + 1}: Exploring ${trip.destination}`;
    }
    
    // Add a basic placeholder activity structure that's minimally descriptive but not hardcoded with fictional details
    days.push({
      dayNumber: i + 1,
      title: dayTitle,
      date: dayDate,
      city: trip.destination,
      activities: [
        {
          title: i === 0 ? `Arrival in ${trip.destination}` : 
                (i === numDays - 1 ? `Departure from ${trip.destination}` : 
                `Day ${i + 1} in ${trip.destination}`),
          description: "Unable to generate detailed itinerary at this time. Please try again later when our AI service is available.",
          time: "All Day",
          location: trip.destination,
          type: "general",
          city: trip.destination
        }
      ]
    });
  }
  
  // Create a basic booking placeholder
  const bookings: ItineraryBooking[] = [
    {
      type: "general",
      title: `Trip to ${trip.destination}`,
      details: {
        note: "Unable to generate detailed booking information at this time. Please try again later when our AI service is available."
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
      throw new Error("Gemini API key is missing. Please check your environment configuration.");
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
    
    // Define the fetch function to be retried
    const fetchWithRetry = async () => {
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
        throw new Error(`Failed to generate chat response: ${response.statusText}`);
      }
      
      return response;
    };
    
    // Execute the fetch with retry logic
    const response = await retryWithBackoff(fetchWithRetry, 3, 2000);
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
      
      // Define suggestions fetch with retry
      const fetchSuggestionsWithRetry = async () => {
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
        
        if (!suggestionsResponse.ok) {
          throw new Error(`Failed to generate suggestions: ${suggestionsResponse.statusText}`);
        }
        
        return suggestionsResponse;
      };
      
      // Only use a short retry window for suggestions since they're optional
      const suggestionsResponse = await retryWithBackoff(fetchSuggestionsWithRetry, 1, 1000);
      const suggestionsData = await suggestionsResponse.json();
      const suggestionsText = suggestionsData.candidates[0].content.parts[0].text;
      
      // Extract JSON array from response
      const jsonMatch = suggestionsText.match(/\[.*\]/s);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
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