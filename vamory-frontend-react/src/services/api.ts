import axios from 'axios';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  FoldersApiResponse,
  FoldersRequest,
  FilesRequest,
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  ChangeStorageTypeRequest,
  ShareFolderRequest,
  UserSearchRequest,
  FileData,
  UploadFileResponse,
  UpdateFileRequest,
  PaginatedResponse,
  AddFromGDriveRequest,
  AddFromGDriveResponse,
  FileDownloadResponse
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'https://api.vamory.vadaevri.com';

// Debug: Log the environment variable to verify it's working
console.log('VITE_BACKEND_BASE_URL:', import.meta.env.VITE_BACKEND_BASE_URL);
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');
let isRefreshing = false;
let failedQueue: Array<{resolve: (value: unknown) => void; reject: (reason?: Error) => void;}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip redirect for public endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !(originalRequest.url && originalRequest.url.includes('/api/v1/public/'))
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api.request(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (!refreshToken) {
        console.log('No refresh token available, redirecting to login');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        accessToken = null;
        refreshToken = null;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token...');
        const response = await refreshAccessToken({ refresh_token: refreshToken });
        
        // Update tokens
        accessToken = response.access_token;
        refreshToken = response.refresh_token;
        
        // Store in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        console.log('Token refresh successful');
        
        // Process queued requests
        processQueue(null, accessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError as Error, null);
        
        // Clear all tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        accessToken = null;
        refreshToken = null;
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // API expects form-urlencoded body
    const body = new URLSearchParams();
    body.append('username', data.username);
    body.append('password', data.password);

    const response = await api.post('/api/v1/auth/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokens = response.data;
    
    // Store tokens
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    localStorage.setItem('access_token', accessToken!);
    localStorage.setItem('refresh_token', refreshToken!);
    
    return tokens;
  },

  logout: async (): Promise<void> => {
    try {
      if (refreshToken) {
        await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with cleanup even if API call fails
    }
    
    // Clear tokens
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },
  uploadProfilePic: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/auth/profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteProfilePic: async (): Promise<User> => {
    const response = await api.delete('/api/v1/auth/profile-pic');
    return response.data;
  },
};

// Helper function for token refresh
const refreshAccessToken = async (data: RefreshTokenRequest): Promise<AuthResponse> => {
  try {
    // API expects form-urlencoded body, same as login
    const body = new URLSearchParams();
    body.append('refresh_token', data.refresh_token);

    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error('Refresh token request failed:', axiosError.response?.status, axiosError.response?.statusText);
    
    // If refresh token is invalid/expired, the server typically returns 401
    if (axiosError.response?.status === 401) {
      console.log('Refresh token expired or invalid');
    }
    
    throw error;
  }
};

// Folders API calls
export const foldersAPI = {
  getRootFolders: async (params: FoldersRequest = {}): Promise<{ folders: Folder[]; has_more: boolean; total: number; meta?: import('../types').PaginationMeta }> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/folders/root', { params: filtered });
    const data: FoldersApiResponse = response.data;
    
    // Handle new paginated response format
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return {
        folders: data.data,
        has_more: data.meta.has_next,
        total: data.meta.total_count,
        meta: data.meta as import('../types').PaginationMeta,
      };
    }
    // Handle legacy array response
    else if (Array.isArray(data)) {
      return {
        folders: data,
        has_more: false,
        total: data.length,
      };
    }
    // Handle legacy object response
    else {
      return {
        folders: data.folders || [],
        has_more: data.has_more || false,
        total: data.total || 0,
      };
    }
  },

  getFolders: async (params: FoldersRequest = {}): Promise<Folder[]> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/folders/', { params: filtered });
    const data: FoldersApiResponse = response.data;

    // Handle new paginated response format
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return data.data;
    }
    // Handle legacy formats
    return Array.isArray(data) ? data : data.folders || [];
  },

  // New method for paginated folders search
  getFoldersPaginated: async (params: FoldersRequest = {}): Promise<{ folders: Folder[]; has_more: boolean; total: number; meta?: import('../types').PaginationMeta }> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/folders/', { params: filtered });
    const data: FoldersApiResponse = response.data;
    
    // Handle new paginated response format
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return {
        folders: data.data,
        has_more: data.meta.has_next,
        total: data.meta.total_count,
        meta: data.meta as import('../types').PaginationMeta,
      };
    }
    // Handle legacy array response
    else if (Array.isArray(data)) {
      return {
        folders: data,
        has_more: false,
        total: data.length,
      };
    }
    // Handle legacy object response
    else {
      return {
        folders: data.folders || [],
        has_more: data.has_more || false,
        total: data.total || 0,
      };
    }
  },

  createFolder: async (data: CreateFolderRequest): Promise<Folder> => {
    const response = await api.post('/api/v1/folders/', data);
    return response.data;
  },

  getFolder: async (folderId: string): Promise<Folder> => {
    const response = await api.get(`/api/v1/folders/${folderId}`);
    return response.data;
  },

  updateFolder: async (folderId: string, data: UpdateFolderRequest): Promise<Folder> => {
    const response = await api.put(`/api/v1/folders/${folderId}`, data);
    return response.data;
  },

  deleteFolder: async (folderId: string): Promise<string> => {
    const response = await api.delete(`/api/v1/folders/${folderId}`);
    return response.data;
  },

  changeStorageType: async (folderId: string, data: ChangeStorageTypeRequest): Promise<string> => {
    // API expects form-urlencoded body
    const body = new URLSearchParams();
    body.append('new_storage_type', data.new_storage_type);
    body.append('apply_to_children', data.apply_to_children.toString());
    
    if (data.retrieval_days !== undefined) {
      body.append('retrieval_days', data.retrieval_days.toString());
    }
    if (data.retrieval_mode) {
      body.append('retrieval_mode', data.retrieval_mode);
    }

    const response = await api.post(`/api/v1/folders/${folderId}/change-storage-type`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  shareFolder: async (folderId: string, data: ShareFolderRequest): Promise<string> => {
    const response = await api.post(`/api/v1/folders/${folderId}/share`, data);
    return response.data;
  },

  revokeShareFolder: async (folderId: string, userEmail: string): Promise<string> => {
    const encodedEmail = encodeURIComponent(userEmail);
    const response = await api.delete(`/api/v1/folders/${folderId}/share/${encodedEmail}`);
    return response.data;
  },

  /**
   * Check conversion status for a folder
   */
  checkConversionStatus: async (folderId: string): Promise<import('../types').FolderConversionStatusResponse> => {
    const response = await api.post(`/api/v1/folders/${folderId}/check-conversion`);
    return response.data;
  },

  /**
   * Make a folder public (and all subfolders)
   */
  makeFolderPublic: async (folderId: string): Promise<{ message: string; public_token: string }> => {
    const response = await api.post(`/api/v1/folders/${folderId}/make-public`);
    return response.data;
  },

  /**
   * Make a folder private (and all subfolders)
   */
  makeFolderPrivate: async (folderId: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/v1/folders/${folderId}/make-private`);
    return response.data;
  },
};

// Files API calls
export const filesAPI = {
  uploadFile: async (folderId: string, file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/v1/files/upload?folder_id=${folderId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFolderFiles: async (folderId: string, params: FilesRequest = {}): Promise<FileData[]> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get(`/api/v1/files/folder/${folderId}`, { params: filtered });
    const data = response.data;

    // Handle new paginated response format
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return data.data;
    }
    // Handle legacy array response
    return Array.isArray(data) ? data : [];
  },

  getFile: async (fileId: string): Promise<FileData> => {
    const response = await api.get(`/api/v1/files/${fileId}`);
    return response.data;
  },

  updateFile: async (fileId: string, data: UpdateFileRequest): Promise<FileData> => {
    const response = await api.put(`/api/v1/files/${fileId}`, data);
    return response.data;
  },

  deleteFile: async (fileId: string): Promise<string> => {
    const response = await api.delete(`/api/v1/files/${fileId}`);
    return response.data;
  },

  downloadFile: async (fileId: string): Promise<FileDownloadResponse> => {
    const response = await api.get(`/api/v1/files/${fileId}/download`);
    return response.data;
  },

  addFromGDrive: async (data: AddFromGDriveRequest): Promise<AddFromGDriveResponse> => {
    const response = await api.post('/api/v1/files/add-from-gdrive', data);
    return response.data;
  },

  // Bulk download multiple files
  bulkDownloadFiles: async (fileIds: string[]): Promise<{ [fileId: string]: FileDownloadResponse }> => {
    const response = await api.post('/api/v1/files/bulk-download', { file_ids: fileIds });
    return response.data;
  },

  // Get first file from folder for thumbnail display
  getFirstFolderFile: async (folderId: string): Promise<FileData | null> => {
    try {
      const response = await api.get(`/api/v1/files/folder/${folderId}`, { 
        params: { limit: 1, file_type: 'image' } 
      });
      const data = response.data;
      
      // Handle new paginated response format
      if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
        const files = data.data;
        return files.length > 0 ? files[0] : null;
      }
      // Handle legacy array response
      const files = Array.isArray(data) ? data : [];
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Failed to fetch first folder file:', error);
      return null;
    }
  },
};

// Auth helper functions
export const initializeTokens = (): void => {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
  console.log('Tokens initialized:', !!accessToken && !!refreshToken ? 'Found' : 'Missing');
};

export const isAuthenticated = (): boolean => {
  const storedAccessToken = localStorage.getItem('access_token');
  const storedRefreshToken = localStorage.getItem('refresh_token');
  
  // Sync memory variables with localStorage
  if (storedAccessToken !== accessToken || storedRefreshToken !== refreshToken) {
    accessToken = storedAccessToken;
    refreshToken = storedRefreshToken;
  }
  
  return !!accessToken && !!refreshToken;
};

export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
};

export const clearTokens = (): void => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  console.log('All tokens cleared');
};

// Initialize tokens when the module loads
initializeTokens();

// Users API calls
export const usersAPI = {
  searchUsers: async (params: UserSearchRequest = {}): Promise<{ users: User[]; has_more: boolean; total: number; meta?: import('../types').PaginationMeta }> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/auth/users', { params: filtered });
    const data: PaginatedResponse<User> = response.data;
    
    // Handle paginated response format
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return {
        users: data.data,
        has_more: data.meta.has_next,
        total: data.meta.total_count,
        meta: data.meta as import('../types').PaginationMeta,
      };
    }
    // Fallback for unexpected format
    return {
      users: [],
      has_more: false,
      total: 0,
    };
  },
};

// AI Search API
export const aiSearchAPI = {
  /**
   * Search files using AI with optional folder_id filter
   */
  search: async (query: string, folderId?: string): Promise<{ categories: Record<string, FileData[]> }> => {
    const params: any = { query };
    if (folderId) {
      params.folder_id = folderId;
    }
    const response = await api.get('/api/v1/ai-search/', { params });
    return response.data;
  },

  /**
   * Reload AI search index
   */
  reload: async (): Promise<void> => {
    await api.post('/api/v1/ai-search/reload');
  },
};

// Public folder API (no auth required)
export const publicFoldersAPI = {
  /**
   * Get public folder info by token and folder_id
   */
  getPublicFolder: async (publicToken: string, folderId: string): Promise<Folder> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/folders/public/folders/`, {
      params: { token: publicToken, folder_id: folderId },
    });
    return response.data;
  },

  /**
   * Get files in a public folder by token and folder_id
   */
  getPublicFolderFiles: async (
    publicToken: string,
    folderId: string,
    params: FilesRequest = {}
  ): Promise<PaginatedResponse<FileData>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/`, {
      params: { token: publicToken, folder_id: folderId, ...filteredParams },
    });
    return response.data;
  },

  /**
   * Get a public file by ID and token
   */
  getPublicFileById: async (fileId: string, publicToken: string): Promise<FileData> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/file`, {
      params: { token: publicToken, file_id: fileId },
    });
    return response.data;
  },
};

export default api; 