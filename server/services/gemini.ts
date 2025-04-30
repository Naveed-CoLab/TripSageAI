// Import the improved Gemini implementation
import { generateImageWithGemini } from "../gemini-updated";

// Use Gemini to generate an image for a travel destination or activity
export async function generateTravelImage(
  prompt: string,
  fallbackImageUrl?: string
): Promise<string> {
  try {
    // Generate image with Gemini 2.5 Pro
    const generatedImage = await generateImageWithGemini(prompt);
    
    // Return the generated image or fallback
    return generatedImage || fallbackImageUrl || getDefaultImage(prompt);
  } catch (error) {
    console.error("Failed to generate image with Gemini:", error);
    // Return fallback image on error
    return fallbackImageUrl || getDefaultImage(prompt);
  }
}

// Function to get a default image based on the prompt content
export function getDefaultImage(prompt: string): string {
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

// Function to analyze images using Gemini
export async function analyzeImage(base64Image: string): Promise<{
  description: string;
  relevanceScore: number;
  quality: string;
}> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    // If no API key, return a fallback analysis
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Using fallback image analysis.");
      return {
        description: "Unable to analyze image: No API key provided",
        relevanceScore: 0,
        quality: "unknown"
      };
    }

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
              parts: [
                {
                  text: "Analyze this travel image and provide a brief description, an estimated relevance score for travel content (0-10), and quality assessment (poor, fair, good, excellent)."
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                  }
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 300,
          },
          responseMimeType: "application/json"
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return {
        description: "Error analyzing image",
        relevanceScore: 0,
        quality: "unknown"
      };
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    try {
      const result = JSON.parse(jsonString);
      return {
        description: result.description || "No description available",
        relevanceScore: result.relevanceScore || 0,
        quality: result.quality || "unknown"
      };
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      console.error("Raw response:", text);
      return {
        description: text || "No description available",
        relevanceScore: 0,
        quality: "unknown"
      };
    }
  } catch (error) {
    console.error("Failed to analyze image with Gemini:", error);
    return {
      description: "Error analyzing image",
      relevanceScore: 0,
      quality: "unknown"
    };
  }
}

// Function to enhance descriptions with Gemini
export async function enhanceActivityDescription(
  activity: string,
  location: string,
  type: string
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    // If no API key, return the original activity description
    if (!GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY provided. Unable to enhance activity description.");
      return `${activity} in ${location}`;
    }

    const prompt = `Write a brief, engaging description (max 100 words) for the following travel activity: "${activity}" in ${location}. This is a ${type} activity. Include one interesting fact that most tourists wouldn't know.`;
    
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
              parts: [
                {
                  text: prompt
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.statusText}`);
      return `${activity} in ${location}`;
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return text || `${activity} in ${location}`;
  } catch (error) {
    console.error("Failed to enhance activity description with Gemini:", error);
    return `${activity} in ${location}`;
  }
}