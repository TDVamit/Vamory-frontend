import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  _id: string;
  email: string;
  full_name: string;
  user_role: 'super_admin' | 'admin' | 'user' | 'editor';
  credits: number;
  storage_used_standard: number;
  storage_used_archived: number;
  profile_pic_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Auth0User {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  updated_at?: string;
}

export const useAuth0Custom = () => {
  const { 
    isAuthenticated, 
    isLoading: auth0Loading, 
    user: auth0User, 
    loginWithRedirect, 
    logout, 
    getAccessTokenSilently 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from our backend when authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !auth0User) {
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

    fetchUserData();
  }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect();
  };

  const logoutUser = () => {
    localStorage.removeItem('access_token');
    logout({ 
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

  return {
    user,
    auth0User: auth0User as Auth0User,
    isAuthenticated,
    isLoading: isLoading || auth0Loading,
    error,
    login,
    logout: logoutUser,
    refreshToken,
    getAccessTokenSilently
  };
};
