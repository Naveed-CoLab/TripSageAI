import OpenAI from "openai";

// Initialize OpenAI with API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Check if the OpenAI API key is present
const hasApiKey = !!process.env.OPENAI_API_KEY;

// Use DALL-E to generate an image for a travel destination or activity
export async function generateTravelImage(
  prompt: string,
  fallbackImageUrl?: string
): Promise<string> {
  try {
    // If no API key, return fallback image immediately
    if (!hasApiKey) {
      console.warn("No OPENAI_API_KEY provided. Using fallback image URL.");
      return fallbackImageUrl || getDefaultImage(prompt);
    }

    // Enhance the prompt to optimize for travel images
    const enhancedPrompt = enhanceImagePrompt(prompt);

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    // Return the generated image URL
    return response.data[0].url || fallbackImageUrl || getDefaultImage(prompt);
  } catch (error) {
    console.error("Failed to generate image with OpenAI:", error);
    // Return fallback image on error
    return fallbackImageUrl || getDefaultImage(prompt);
  }
}

// Function to enhance image prompts for better results
function enhanceImagePrompt(basePrompt: string): string {
  return `High-quality travel photography of ${basePrompt}. Realistic, detailed, beautiful lighting, professional travel photo in 4K resolution. No text or watermarks.`;
}

// Function to get a default image based on the prompt content
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

// To analyze an image for quality/relevance assessment
export async function analyzeImage(base64Image: string): Promise<{
  description: string;
  relevanceScore: number;
  quality: string;
}> {
  try {
    // If no API key, return a fallback analysis
    if (!hasApiKey) {
      console.warn("No OPENAI_API_KEY provided. Using fallback image analysis.");
      return {
        description: "Unable to analyze image: No API key provided",
        relevanceScore: 0,
        quality: "unknown"
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this travel image and provide a brief description, an estimated relevance score for travel content (0-10), and quality assessment (poor, fair, good, excellent)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      description: result.description || "No description available",
      relevanceScore: result.relevanceScore || 0,
      quality: result.quality || "unknown"
    };
  } catch (error) {
    console.error("Failed to analyze image with OpenAI:", error);
    return {
      description: "Error analyzing image",
      relevanceScore: 0,
      quality: "unknown"
    };
  }
}

// For text-to-text requests (to get better activity descriptions, etc.)
export async function enhanceActivityDescription(
  activity: string,
  location: string,
  type: string
): Promise<string> {
  try {
    // If no API key, return the original activity description
    if (!hasApiKey) {
      console.warn("No OPENAI_API_KEY provided. Unable to enhance activity description.");
      return `${activity} in ${location}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a travel expert that provides engaging, detailed, and helpful descriptions of travel activities."
        },
        {
          role: "user",
          content: `Write a brief, engaging description (max 100 words) for the following travel activity: "${activity}" in ${location}. This is a ${type} activity. Include one interesting fact that most tourists wouldn't know.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || `${activity} in ${location}`;
  } catch (error) {
    console.error("Failed to enhance activity description with OpenAI:", error);
    return `${activity} in ${location}`;
  }
}