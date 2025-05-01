/**
 * Utility for generating profile image URLs
 */

/**
 * Generates a UI-Avatars URL for a default profile image based on user's initials
 * UI Avatars is a free service that generates avatar images from user initials
 * @param name - User's name or username to extract initials from
 * @param size - Size of the avatar in pixels (default: 256)
 * @returns URL string for the generated avatar
 */
export function generateDefaultAvatarUrl(name: string, size: number = 256): string {
  // Clean up the name and ensure we have something to work with
  const cleanName = name.trim() || 'User';
  
  // Create a URL for ui-avatars.com
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&size=${size}&background=random&color=fff&bold=true`;
  
  return url;
}

/**
 * Gets avatar URL for a user, falling back to a generated avatar if no profile image exists
 * @param user - User object with optional profileImage and username/firstName properties
 * @returns URL for avatar image
 */
export function getUserAvatarUrl(user: { 
  profileImage?: string | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  // If user has a profile image, use it
  if (user.profileImage) {
    return user.profileImage;
  }
  
  // Otherwise generate a default avatar based on name
  const displayName = user.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user.username;
    
  return generateDefaultAvatarUrl(displayName);
}