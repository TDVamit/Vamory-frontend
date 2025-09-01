/**
 * Utility functions for handling profile images, especially Google profile images
 * that often return 429 errors due to rate limiting
 */

export interface ProfileImageOptions {
  size?: number;
  fallbackToOriginal?: boolean;
  useProxy?: boolean;
}

/**
 * Get a properly formatted Google profile image URL with size parameter
 * This can help avoid some rate limiting issues
 */
export const getGoogleProfileImageUrl = (originalUrl: string, size: number = 96): string => {
  if (!originalUrl.includes('googleusercontent.com')) {
    return originalUrl;
  }

  // Google profile images support size parameters
  // Replace the size parameter in the URL
  const url = new URL(originalUrl);
  
  // Google uses different size parameters depending on the URL format
  if (url.pathname.includes('s96-c')) {
    return originalUrl.replace('s96-c', `s${size}-c`);
  } else if (url.pathname.includes('s96')) {
    return originalUrl.replace('s96', `s${size}`);
  }
  
  // If no size parameter found, add one
  if (!url.pathname.includes('s')) {
    url.pathname = url.pathname.replace(/\/a\/([^\/]+)/, `/a/$1=s${size}-c`);
    return url.toString();
  }
  
  return originalUrl;
};

/**
 * Create a blob URL from an image with proper headers
 * Note: This function will fail for Google profile images due to CORS restrictions
 * For Google images, we should use the URL directly in img tags instead
 */
export const createImageBlobUrl = async (imageUrl: string): Promise<string> => {
  // For Google profile images, we can't fetch them due to CORS restrictions
  // Return the original URL instead of trying to create a blob
  if (imageUrl.includes('googleusercontent.com')) {
    return imageUrl;
  }

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
      'Referer': window.location.origin,
    },
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Try multiple strategies to load a profile image
 */
export const loadProfileImage = async (
  originalUrl: string | null | undefined,
  options: ProfileImageOptions = {}
): Promise<string | null> => {
  if (!originalUrl) {
    return null;
  }

  const { size = 96, fallbackToOriginal = true } = options;

  // For Google profile images, we can't fetch them due to CORS restrictions
  // Instead, we'll optimize the URL and return it directly
  if (originalUrl.includes('googleusercontent.com')) {
    // Try to optimize the size parameter to avoid rate limiting
    const optimizedUrl = getGoogleProfileImageUrl(originalUrl, size);
    return optimizedUrl;
  }

  // For non-Google images, try to create a blob URL
  try {
    const blobUrl = await createImageBlobUrl(originalUrl);
    return blobUrl;
  } catch (error) {
    console.warn('Failed to create blob URL for profile image:', error);
    
    // If blob creation fails and fallback is enabled, return original URL
    if (fallbackToOriginal) {
      return originalUrl;
    }
  }

  return null;
};

/**
 * Clean up blob URLs to prevent memory leaks
 */
export const cleanupBlobUrl = (blobUrl: string | null): void => {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn('Failed to revoke blob URL:', error);
    }
  }
};

/**
 * Get the appropriate profile picture URL from user data
 * Handles both legacy base64 format and new S3 URL format
 */
export const getProfilePictureUrl = (user: { profile_pic_url?: string; profile_pic?: string }): string | null => {
  // Prefer S3 URL if available
  if (user.profile_pic_url) {
    return user.profile_pic_url;
  }
  
  // Fallback to base64 if available
  if (user.profile_pic) {
    return user.profile_pic.startsWith('data:') 
      ? user.profile_pic 
      : `data:image/webp;base64,${user.profile_pic}`;
  }
  
  return null;
};
