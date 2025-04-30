// Map destinations to static images
export function getDestinationImage(destination: string): string {
  // Clean and lowercase the destination for matching
  const cleanDestination = destination.toLowerCase().trim();
  
  // Map of destination keywords to image paths
  const destinationMap: Record<string, string> = {
    'spain': '/images/destinations/spain.jpg',
    'barcelona': '/images/destinations/barcelona.jpg',
    'madrid': '/images/destinations/madrid.jpg',
    'park guell': '/images/destinations/park_guell.jpg',
  };
  
  // Check if any key in the map is included in the destination string
  for (const [keyword, imagePath] of Object.entries(destinationMap)) {
    if (cleanDestination.includes(keyword)) {
      return imagePath;
    }
  }
  
  // Default image if no match is found
  return '/images/destinations/spain.jpg';
}