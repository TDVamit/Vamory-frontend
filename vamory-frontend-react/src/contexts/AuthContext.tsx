import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../services/api';
import type { User, Auth0User } from '../hooks/useAuth0';

interface AuthContextType {
  user: User | null;
  auth0User: Auth0User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<string>;
  getAccessTokenSilently: () => Promise<string>;
  refreshUserData: () => Promise<void>;
  updateAuth0UserPicture: (pictureUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { 
    isAuthenticated, 
    isLoading: auth0Loading, 
    user: originalAuth0User, 
    loginWithRedirect, 
    logout: auth0Logout, 
    getAccessTokenSilently 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [auth0User, setAuth0User] = useState<Auth0User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update local auth0User state when originalAuth0User changes
  useEffect(() => {
    setAuth0User(originalAuth0User as Auth0User);
  }, [originalAuth0User]);

  // Fetch user data from our backend when authenticated
  const fetchUserData = async () => {
    if (!isAuthenticated || !originalAuth0User) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get access token from Auth0
      const accessToken = await getAccessTokenSilently();
      
      // Set the token in localStorage for API calls
      localStorage.setItem('access_token', accessToken);
      
      // Fetch user data from our backend
      const response = await api.get('/api/v1/auth/me');
      setUser(response.data);
    } catch (err: any) {
      console.error('Failed to fetch user data:', err);
      setError(err?.response?.data?.detail || 'Failed to fetch user data');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when authentication state changes
    if (!hasInitialized && !auth0Loading) {
      setHasInitialized(true);
      fetchUserData();
    }
  }, [isAuthenticated, originalAuth0User, auth0Loading, hasInitialized]);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setHasInitialized(false);
    auth0Logout({ 
      logoutParams: {
        returnTo: import.meta.env.VITE_REDIRECT_URL || 'https://vamory.vadaevri.com'
      }
    });
  };

  const refreshToken = async () => {
    try {
      const accessToken = await getAccessTokenSilently();
      localStorage.setItem('access_token', accessToken);
      return accessToken;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      throw err;
    }
  };

  const refreshUserData = async () => {
    await fetchUserData();
  };

  const updateAuth0UserPicture = (pictureUrl: string) => {
    if (auth0User) {
      setAuth0User({
        ...auth0User,
        picture: pictureUrl
      });
    }
  };

  const contextValue: AuthContextType = {
    user,
    auth0User,
    isAuthenticated,
    isLoading: isLoading || auth0Loading,
    error,
    login,
    logout,
    refreshToken,
    getAccessTokenSilently,
    refreshUserData,
    updateAuth0UserPicture
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth0Custom = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth0Custom must be used within an AuthProvider');
  }
  return context;
};
