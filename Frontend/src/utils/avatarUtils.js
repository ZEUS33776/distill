/**
 * Generate a consistent avatar URL for a user based on their username and email
 * Uses DiceBear API for beautiful avatars
 */
export function generateAvatarUrl(username, email) {
  // Create a seed based on username and email for consistency
  const seedString = `${username.toLowerCase()}${email.toLowerCase()}`;
  const seed = hashString(seedString);
  
  // Available DiceBear styles (curated for good-looking avatars)
  const styles = [
    'adventurer',
    'avataaars',
    'big-smile',
    'croodles',
    'fun-emoji',
    'lorelei',
    'micah',
    'open-peeps',
    'personas',
    'pixel-art'
  ];
  
  // Use seed to select a consistent style for this user
  const styleIndex = seed % styles.length;
  const style = styles[styleIndex];
  
  // Generate a short hash for the seed parameter
  const shortSeed = Math.abs(seed).toString(36).substring(0, 8);
  
  // Generate avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${shortSeed}&size=150&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  
  return avatarUrl;
}

/**
 * Generate a completely random avatar URL for temporary use
 */
export function generateRandomAvatarUrl() {
  const styles = [
    'adventurer',
    'avataaars', 
    'big-smile',
    'croodles',
    'fun-emoji',
    'lorelei',
    'micah',
    'open-peeps',
    'personas',
    'pixel-art'
  ];
  
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(2, 10);
  
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&size=150&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Get user avatar with optional fallback
 */
export function getUserAvatar(user) {
  if (!user) return generateRandomAvatarUrl();
  
  // Generate consistent avatar based on user data
  return generateAvatarUrl(user.username || 'user', user.email || 'user@example.com');
}

/**
 * Simple hash function to convert string to number
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Avatar component helper - returns avatar with loading fallback
 */
export function getAvatarProps(user, size = 150) {
  return {
    src: getUserAvatar(user),
    alt: user?.username || 'User Avatar',
    style: { 
      width: size, 
      height: size, 
      borderRadius: '50%',
      objectFit: 'cover'
    },
    loading: 'lazy'
  };
} 