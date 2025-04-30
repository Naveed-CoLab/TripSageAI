import { db } from "../server/db";
import { destinations } from "../shared/schema";

async function seedDestinations() {
  console.log("Starting destination seeding...");
  
  // Define some popular destinations
  const destinationsList = [
    {
      name: "Rome",
      country: "Italy",
      description: "Experience the ancient history and modern charm of the Eternal City. From the Colosseum to the Vatican, Rome offers a journey through time.",
      rating: "4.8",
      reviewCount: 12586,
      imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$150-300 per day",
    },
    {
      name: "Paris",
      country: "France",
      description: "Discover the romance and elegance of the City of Light, home to iconic landmarks like the Eiffel Tower, Louvre Museum, and charming neighborhoods.",
      rating: "4.7",
      reviewCount: 18942,
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$180-350 per day",
    },
    {
      name: "Las Vegas",
      country: "United States",
      description: "Experience the excitement and glamour of the Entertainment Capital of the World, with world-class casinos, shows, and dining.",
      rating: "4.6",
      reviewCount: 15783,
      imageUrl: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$200-400 per day",
    },
    {
      name: "Reykjavik",
      country: "Iceland",
      description: "Discover the unique blend of Nordic culture and stunning natural landscapes in Iceland's capital, gateway to extraordinary natural wonders.",
      rating: "4.9",
      reviewCount: 8673,
      imageUrl: "https://images.unsplash.com/photo-1504233529578-6d46baba6d34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$250-450 per day",
    },
    {
      name: "Tokyo",
      country: "Japan",
      description: "Immerse yourself in the perfect blend of ultramodern and traditional in Japan's bustling capital, known for technology, cuisine, and culture.",
      rating: "4.8",
      reviewCount: 14567,
      imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$150-300 per day",
    },
    {
      name: "Bali",
      country: "Indonesia",
      description: "Experience the perfect blend of spiritual tranquility and vibrant beach culture on this Indonesian paradise island.",
      rating: "4.7",
      reviewCount: 13298,
      imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$80-200 per day",
    },
    {
      name: "Miami Beach",
      country: "United States",
      description: "Enjoy the perfect blend of beautiful beaches, vibrant nightlife, and diverse culture in this iconic coastal city.",
      rating: "4.6",
      reviewCount: 9875,
      imageUrl: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$200-400 per day",
    },
    {
      name: "Barcelona",
      country: "Spain",
      description: "Discover the unique blend of Catalan culture, stunning architecture by Gaudí, beautiful beaches, and vibrant street life.",
      rating: "4.8",
      reviewCount: 11764,
      imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      priceEstimate: "$120-250 per day",
    }
  ];

  try {
    // Check if destinations already exist
    const existingDestinations = await db.select().from(destinations);
    
    if (existingDestinations.length > 0) {
      console.log(`Found ${existingDestinations.length} existing destinations, skipping seeding.`);
      return;
    }
    
    // Insert destinations
    const result = await db.insert(destinations).values(destinationsList);
    console.log(`Successfully seeded ${destinationsList.length} destinations`);
    
  } catch (error) {
    console.error("Error seeding destinations:", error);
  } finally {
    process.exit(0);
  }
}

seedDestinations();