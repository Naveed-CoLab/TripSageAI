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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set! AI features will not work properly.");
}

// Function to generate images with Gemini 2.5 Pro
export async function generateImageWithGemini(prompt: string): Promise<string | undefined> {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Cannot generate image.");
      return getDefaultImage(prompt);
    }

    const enhancedPrompt = `High-quality travel photograph of ${prompt}. Clear lighting, detailed, professional travel photography style. 4K resolution.`;
    
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
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
    
    // Assign date to each day if start date is provided
    if (trip.startDate) {
      const startDateObj = new Date(trip.startDate);
      result.days.forEach((day, index) => {
        const dayDate = new Date(startDateObj);
        dayDate.setDate(dayDate.getDate() + index);
        day.date = dayDate;
      });
    }
    
    // Generate images for each day and activity using Gemini
    try {
      console.log("Generating images with Gemini for a more relevant visual experience...");
      
      // Generate city images for each day - in parallel
      const dayImagePromises = result.days.map(day => {
        const prompt = `${day.city || day.title.split(':')[1] || trip.destination}, travel destination, landscape photography`;
        return generateImageWithGemini(prompt);
      });
      
      // Wait for all day images and update the itinerary
      const dayImages = await Promise.all(dayImagePromises);
      result.days.forEach((day, index) => {
        day.image = dayImages[index];
      });
      
      // Generate images for activities in batches to avoid rate limiting
      for (const day of result.days) {
        const activityImagePromises = day.activities.map(activity => {
          const location = activity.location || activity.city || day.city || trip.destination;
          const prompt = `${activity.title} in ${location}, ${activity.type || 'travel'} photography`;
          return generateImageWithGemini(prompt);
        });
        
        // Update activities with generated images
        const activityImages = await Promise.all(activityImagePromises);
        day.activities.forEach((activity, index) => {
          activity.image = activityImages[index] || getDefaultImage(`${activity.type} ${activity.title}`);
        });
      }
      
      // Generate images for bookings
      const bookingImagePromises = result.bookings.map(booking => {
        const prompt = `${booking.title}, ${booking.type} in ${trip.destination}, professional photography`;
        return generateImageWithGemini(prompt);
      });
      
      // Update bookings with generated images
      const bookingImages = await Promise.all(bookingImagePromises);
      result.bookings.forEach((booking, index) => {
        booking.image = bookingImages[index] || getDefaultImage(`${booking.type} ${booking.title}`);
      });
    } catch (imageError) {
      console.error("Error generating images with Gemini:", imageError);
      // Continue with the itinerary even if image generation fails
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
    
    // Determine city from destination
    const city = trip.destination?.split(",")[0] || "City";
    
    // Add city info and enhance activities with ratings, review counts, and images
    const enhancedActivities = activities.map(activity => ({
      ...activity,
      rating: 4 + Math.random(), // Generate a rating between 4.0 and 5.0
      reviewCount: Math.floor(100 + Math.random() * 500), // Generate between 100-600 reviews
      city: city,
      image: "" // Will be populated with images later
    }));
    
    days.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${i === 0 ? "Arrival & Orientation" : i === numDays - 1 ? "Departure" : `Exploring ${trip.destination}`}`,
      date: dayDate,
      city: city,
      image: "", // Will be populated with images later
      activities: enhancedActivities
    });
  }
  
  // Create basic booking suggestions with ratings and review counts
  const bookings: ItineraryBooking[] = [
    {
      type: "accommodation",
      title: `Luxury Hotel in ${trip.destination}`,
      provider: "Premier Hotels & Resorts",
      price: "$120-250 per night",
      rating: 4.7,
      reviewCount: 432,
      image: "", // Will be populated with images later
      details: {
        checkIn: "After 2:00 PM",
        checkOut: "Before 12:00 PM",
        amenities: ["Free Wi-Fi", "Breakfast included", "Swimming pool", "Spa", "Fitness center"],
        location: "Central district"
      }
    },
    {
      type: "accommodation",
      title: `Budget-friendly Stay in ${trip.destination}`,
      provider: "Comfort Inn Express",
      price: "$60-120 per night",
      rating: 4.3,
      reviewCount: 287,
      image: "", // Will be populated with images later
      details: {
        checkIn: "After 3:00 PM",
        checkOut: "Before 11:00 AM",
        amenities: ["Free Wi-Fi", "Continental breakfast", "Air conditioning"],
        location: "Near public transportation"
      }
    },
    {
      type: "transportation",
      title: `Airport transfer to ${trip.destination}`,
      provider: "City Express Shuttle",
      price: "$25-45",
      rating: 4.5,
      reviewCount: 189,
      image: "", // Will be populated with images later
      details: {
        type: "Shared Shuttle/Private Taxi",
        duration: "30-45 minutes",
        booking: "Available online or at airport kiosks"
      }
    },
    {
      type: "activity",
      title: `${trip.destination} Walking Tour`,
      provider: "Local Discoveries Tours",
      price: "$30-55 per person",
      rating: 4.8,
      reviewCount: 356,
      image: "", // Will be populated with images later
      details: {
        duration: "3 hours",
        includes: ["Professional guide", "Small group", "Historical insights"],
        meetingPoint: "Central Plaza",
        recommendation: "Book at least 2 days in advance"
      }
    },
    {
      type: "activity",
      title: `${trip.destination} Food Tasting Experience`,
      provider: "Culinary Adventures",
      price: "$45-70 per person",
      rating: 4.9,
      reviewCount: 214,
      image: "", // Will be populated with images later
      details: {
        duration: "4 hours",
        includes: ["5-7 food tastings", "Local guide", "Drink pairings"],
        dietary: "Vegetarian options available",
        groupSize: "Maximum 8 people"
      }
    }
  ];
  
  // Create the itinerary result
  const result = {
    days,
    bookings
  };
  
  // Add default images for all activities and bookings
  // We'll use basic categorization to select relevant default images
  for (const day of result.days) {
    day.image = getDefaultImage(`${day.city || trip.destination} city`);
    
    for (const activity of day.activities) {
      activity.image = getDefaultImage(`${activity.type} ${activity.title}`);
    }
  }
  
  for (const booking of result.bookings) {
    booking.image = getDefaultImage(`${booking.type} ${booking.title}`);
  }
  
  return result;
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
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