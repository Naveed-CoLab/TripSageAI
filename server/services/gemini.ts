
// Import the unified Gemini service implementation
import { generateImageWithGemini } from "../gemini-service";

// Use Gemini to generate an image for a travel destination or activity
export async function generateTravelImage(
  prompt: string,
  fallbackImageUrl?: string
): Promise<string> {
  try {
    // Generate image with Gemini 2.5 Pro Preview model
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
  landmarks: string[];
  tags: string[];
}> {
  try {
    // This is a placeholder implementation
    // Actual implementation would use the Gemini API for image analysis
    return {
      description: "Image analysis functionality not available without Gemini API key.",
      landmarks: ["Unknown landmark"],
      tags: ["travel", "destination"]
    };
  } catch (error) {
    console.error("Failed to analyze image:", error);
    return {
      description: "Failed to analyze image.",
      landmarks: [],
      tags: []
    };
  }
}

// Function to enhance descriptions with AI
export async function enhanceActivityDescription(
  description: string,
  location: string
): Promise<string> {
  try {
    // This is a placeholder implementation
    // Actual implementation would use the Gemini API
    return description;
  } catch (error) {
    console.error("Failed to enhance description:", error);
    return description;
  }
}
