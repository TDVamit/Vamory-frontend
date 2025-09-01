import { useState, useEffect } from 'react';
import { loadProfileImage, cleanupBlobUrl } from '../utils/profileImageUtils';

interface UseProfileImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useProfileImage = (originalUrl: string | null | undefined): UseProfileImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originalUrl) {
      setImageUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        const loadedUrl = await loadProfileImage(originalUrl, {
          size: 96,
          fallbackToOriginal: true,
          useProxy: false, // Set to true if you have a proxy endpoint
        });
        
        setImageUrl(loadedUrl);
        setError(null);
      } catch (err) {
        console.warn('Failed to load profile image:', err);
        setError('Failed to load profile image');
        setImageUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke blob URL (only if it's a blob URL)
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        cleanupBlobUrl(imageUrl);
      }
    };
  }, [originalUrl]);

  return { imageUrl, isLoading, error };
};
