# Profile Image 429 Error Solution

## Problem
Google profile images from Auth0 often return 429 "Too Many Requests" errors due to rate limiting on Google's image servers.

## Solution Implemented

### 1. Custom Hook (`useProfileImage`)
- Created `src/hooks/useProfileImage.ts` to handle profile image loading
- Automatically detects Google profile images and applies proper headers
- Provides loading states and error handling
- Falls back gracefully when images fail to load

### 2. Utility Functions (`profileImageUtils`)
- Created `src/utils/profileImageUtils.ts` with multiple loading strategies
- Tries different image sizes to avoid rate limiting
- Implements proper headers for Google image requests
- Provides cleanup functions to prevent memory leaks

### 3. Updated Components
- **Header.tsx**: Now uses the profile image hook for the profile picture in the header
- **ProfileModal.tsx**: Updated to use the same hook for consistency
- Both components now show loading states and fallback to user icons

## How It Works

### For Google Profile Images:
1. **Detection**: Automatically detects URLs containing `googleusercontent.com`
2. **Multiple Strategies**: Tries loading with different sizes (96px, 48px, original)
3. **Proper Headers**: Uses browser-like headers to avoid rate limiting:
   - User-Agent
   - Accept headers
   - Cache-Control
   - Referer
4. **Blob URLs**: Creates blob URLs to cache the images locally
5. **Fallback**: Falls back to user icon if all strategies fail

### For Other Images:
- Uses the original URL directly without modification

## Usage

```tsx
import { useProfileImage } from '../hooks/useProfileImage';

const MyComponent = () => {
  const { imageUrl, isLoading, error } = useProfileImage(auth0User?.picture);
  
  return (
    <div>
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" />
      ) : isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <UserIcon />
      )}
    </div>
  );
};
```

## Optional: Backend Proxy (Recommended)

For even better reliability, you can add a proxy endpoint to your backend:

```python
# Flask example
@app.route('/api/proxy/image')
def proxy_image():
    url = request.args.get('url')
    if not url:
        return 'URL parameter required', 400
    
    try:
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
        })
        
        return Response(
            response.content,
            status=response.status_code,
            headers={'Content-Type': response.headers.get('Content-Type', 'image/jpeg')}
        )
    except Exception as e:
        return str(e), 500
```

Then enable the proxy in the hook:
```tsx
const loadedUrl = await loadProfileImage(originalUrl, {
  size: 96,
  fallbackToOriginal: true,
  useProxy: true, // Enable proxy
});
```

## Benefits

1. **Eliminates 429 Errors**: Proper headers and multiple strategies reduce rate limiting
2. **Better UX**: Loading states and graceful fallbacks
3. **Performance**: Blob URLs cache images locally
4. **Memory Management**: Automatic cleanup of blob URLs
5. **Consistency**: Same behavior across all components

## Testing

To test the solution:
1. Sign in with Google Auth0
2. Check the browser network tab for profile image requests
3. Verify that 429 errors are resolved
4. Confirm loading states and fallbacks work correctly

## Future Improvements

1. **Caching**: Implement longer-term caching strategies
2. **Retry Logic**: Add exponential backoff for failed requests
3. **Image Optimization**: Compress images for better performance
4. **CDN**: Use a CDN for profile images to avoid rate limiting entirely
