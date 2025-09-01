import axios from 'axios';
import { SignJWT } from 'jose';
import type {
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
  FileDownloadResponse,
  ExchangeRateResponse,
  NotificationsResponse,
  MarkReadResponse,
  UnknownFacesResponse,
  FaceListResponse,
  FaceDetail,
  FaceNameSuggestionResponse,
  MergeFaceRequest,
  NameFaceRequest,
  CostResponse,
  PublicTokenPayload
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'https://api.vamory.vadaevri.com';

const PUBLIC_SECRET_KEY = '3bc71e4b3b8e89bdd234f4839dd6ada1';

// Debug: Log the environment variable to verify it's working
console.log('VITE_BACKEND_BASE_URL:', import.meta.env.VITE_BACKEND_BASE_URL);
console.log('API_BASE_URL:', API_BASE_URL);

/**
 * Generate a public JWT token for API requests
 * @returns JWT token string
 */
export const generatePublicToken = async (): Promise<string> => {
  // Create timestamp in format that Python's datetime.fromisoformat() can parse
  const now = new Date();
  const timestamp = now.toISOString().replace('Z', '+00:00');
  
  const payload: PublicTokenPayload = {
    origin: 'vamory.vadaevri.com',
    created_at: timestamp
  };
  
  const secret = new TextEncoder().encode(PUBLIC_SECRET_KEY);
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
  
  return jwt;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // For 401 errors on non-public endpoints, redirect to login
    if (
      error.response?.status === 401 &&
      !(error.config.url && error.config.url.includes('/api/v1/public/'))
    ) {
      console.log('Unauthorized, redirecting to login');
      localStorage.removeItem('access_token');
      window.location.href = '/';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls (simplified for Auth0)
export const authAPI = {
  getProfile: async (): Promise<any> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },
  
  uploadProfilePic: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/auth/profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteProfilePic: async (): Promise<any> => {
    const response = await api.delete('/api/v1/auth/profile-pic');
    return response.data;
  },
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

  /**
   * Make a file public
   */
  makeFilePublic: async (fileId: string): Promise<{ message: string; public_token: string }> => {
    const response = await api.post(`/api/v1/files/${fileId}/make-public`);
    return response.data;
  },

  /**
   * Make a file private
   */
  makeFilePrivate: async (fileId: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/v1/files/${fileId}/make-private`);
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

  // Get deleted files (trash)
  getTrashFiles: async (params: { page?: number; per_page?: number; sort_by?: string; sort_order?: 'asc' | 'desc' } = {}): Promise<PaginatedResponse<FileData>> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/files/trash', { params: filtered });
    return response.data;
  },

  // Restore a deleted file
  restoreFile: async (fileId: string): Promise<{ message: string; file_id: string }> => {
    const response = await api.post(`/api/v1/files/${fileId}/restore`);
    return response.data;
  },

  // Permanently delete a file
  permanentDeleteFile: async (fileId: string): Promise<{ message: string; file_id: string }> => {
    const response = await api.delete(`/api/v1/files/${fileId}/permanent`);
    return response.data;
  },
};

// Auth helper functions (simplified for Auth0)
export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  console.log('Access token cleared');
};

// Users API calls
export const usersAPI = {
  searchUsers: async (params: UserSearchRequest = {}): Promise<{ users: any[]; has_more: boolean; total: number; meta?: import('../types').PaginationMeta }> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/auth/users', { params: filtered });
    const data: PaginatedResponse<any> = response.data;
    
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

// Public AI Search API (no auth required)
export const publicAiSearchAPI = {
  /**
   * Search files in public folders using AI
   */
  search: async (query: string, publicToken: string, folderId: string): Promise<{ categories: Record<string, FileData[]> }> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/ai-search/public/ai-search/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query, token: publicToken, folder_id: folderId },
    });
    return response.data;
  },
};

// Public folder API (no auth required)
export const publicFoldersAPI = {
  /**
   * Get public folder info by token and folder_id
   */
  getPublicFolder: async (publicToken: string, folderId: string): Promise<Folder> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/folders/public/folders/${publicToken}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { folder_id: folderId },
    });
    return response.data;
  },

  /**
   * Get public folder by path
   */
  getPublicFolderByPath: async (publicToken: string, folderPath: string): Promise<Folder> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/folders/public/folders/${publicToken}/path/${folderPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get all public folders
   */
  getAllPublicFolders: async (): Promise<Folder[]> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/folders/public/folders/`, {
      headers: { Authorization: `Bearer ${token}` },
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
    const token = await generatePublicToken();
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { token: publicToken, folder_id: folderId, ...filteredParams },
    });
    return response.data;
  },

  /**
   * Get a public file by ID and token
   */
  getPublicFileById: async (fileId: string, publicToken: string): Promise<FileData> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/file`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { token: publicToken, file_id: fileId },
    });
    return response.data;
  },

  /**
   * Get a public file by public token
   */
  getPublicFileByToken: async (publicToken: string): Promise<FileData> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/${publicToken}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Download a public file by public token
   */
  downloadPublicFile: async (publicToken: string): Promise<FileDownloadResponse> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/${publicToken}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get thumbnail for a public file by public token
   */
  getPublicFileThumbnail: async (publicToken: string): Promise<string> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/files/public/files/${publicToken}/thumbnail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Currency conversion API
export const currencyAPI = {
  /**
   * Get exchange rate for currency conversion
   */
  getExchangeRate: async (base: string, target: string, amount: number): Promise<ExchangeRateResponse> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/credit/exchange-rate`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { base, target, amount }
    });
    return response.data;
  },
};

// Cost API
export const costAPI = {
  /**
   * Get storage and retrieval costs
   */
  getCosts: async (): Promise<CostResponse> => {
    const token = await generatePublicToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/credit/costs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  /**
   * Get notifications with optional filters
   */
  getNotifications: async (params: {
    status_filter?: 'all' | 'read' | 'unread';
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: 'created_at' | 'message' | 'notification_read';
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<NotificationsResponse> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/notifications/', { params: filtered });
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<MarkReadResponse> => {
    const response = await api.post(`/api/v1/notifications/${notificationId}/mark-read`);
    return response.data;
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/api/v1/notifications/', {
      params: { status_filter: 'unread', per_page: 1 }
    });
    return response.data.total_count;
  },
};

// Unknown faces API
export const unknownFacesAPI = {
  /**
   * Get unknown faces
   */
  getUnknownFaces: async (params: {
    page?: number;
    per_page?: number;
  } = {}): Promise<UnknownFacesResponse> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const response = await api.get('/api/v1/faces/unknown', { params: filtered });
    return response.data;
  },

  /**
   * Get unknown faces count
   */
  getUnknownFacesCount: async (): Promise<number> => {
    const response = await api.get('/api/v1/faces/unknown', {
      params: { per_page: 1 }
    });
    return response.data.meta.total_count;
  },
};

// Face detection API
export const faceDetectionAPI = {
  /**
   * Get all faces with pagination
   */
  getAllFaces: async (params: { page?: number; per_page?: number; named_only?: boolean }): Promise<FaceListResponse> => {
    const response = await api.get('/api/v1/faces/', { params });
    return response.data;
  },

  /**
   * Get face details by face ID
   */
  getFaceDetail: async (faceId: string): Promise<FaceDetail> => {
    const response = await api.get(`/api/v1/faces/${faceId}`);
    return response.data;
  },

  /**
   * Get name suggestions for face naming
   */
  getNameSuggestions: async (namePattern: string, page?: number, per_page?: number): Promise<FaceNameSuggestionResponse> => {
    const response = await api.get('/api/v1/faces/name-suggestion', {
      params: { name_pattern: namePattern, page, per_page }
    });
    return response.data;
  },

  /**
   * Merge faces (when selecting a suggested name)
   */
  mergeFaces: async (data: MergeFaceRequest): Promise<any> => {
    const response = await api.post('/api/v1/faces/merge', data);
    return response.data;
  },

  /**
   * Name a face with a custom name
   */
  nameFace: async (data: NameFaceRequest): Promise<any> => {
    const response = await api.put('/api/v1/faces/name', data);
    return response.data;
  },
};

export default api; 