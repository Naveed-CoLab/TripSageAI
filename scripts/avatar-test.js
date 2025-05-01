// Simple avatar generation function for testing
function generateDefaultAvatarUrl(name, size = 256) {
  // Clean up the name and ensure we have something to work with
  const cleanName = name.trim() || 'User';
  
  // Create a URL for ui-avatars.com
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&size=${size}&background=random&color=fff&bold=true`;
  
  return url;
}

function testAvatarGeneration() {
  console.log('Testing avatar generation function...');
  
  // Test with a simple name
  const testName = 'John Doe';
  const avatarUrl = generateDefaultAvatarUrl(testName);
  console.log(`Avatar URL for "${testName}": ${avatarUrl}`);
  
  // Test with just a username
  const testUsername = 'johndoe123';
  const usernameAvatarUrl = generateDefaultAvatarUrl(testUsername);
  console.log(`Avatar URL for username "${testUsername}": ${usernameAvatarUrl}`);
  
  // Test with empty string (should use 'User' as fallback)
  const emptyNameUrl = generateDefaultAvatarUrl('');
  console.log(`Avatar URL for empty name: ${emptyNameUrl}`);
  
  // Test with a custom size
  const customSizeUrl = generateDefaultAvatarUrl('Test User', 128);
  console.log(`Avatar URL with custom size (128px): ${customSizeUrl}`);
  
  console.log('Avatar testing complete!');
}

testAvatarGeneration();