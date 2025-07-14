// API Response Types
export interface User {
  email: string;
  full_name: string;
  is_active: boolean;
  _id: string;
  created_at: string;
  updated_at: string;
  profile_pic?: string; // base64 profile picture
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  is_active: boolean;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Pagination metadata
export interface PaginationMeta {
  total_count: number;
  page_count: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Folder {
  _id: string;
  name: string;
  parent_folder_id?: string;
  storage_type: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  file_count?: number;
  subfolder_count?: number;
  total_size?: number;
  access_level?: string;
  shared_with?: any[];
  thumbnail_url?: string;
  status: 'active' | 'inactive' | 'converting';
  conversion_estimated_completion?: string;
  retrieval_days?: number;
  shared_by_name?: string;
}

export interface CreateFolderRequest {
  name: string;
  parent_folder_id?: string;
  storage_type: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
}

export interface UpdateFolderRequest {
  name?: string;
}

export interface ChangeStorageTypeRequest {
  new_storage_type: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
  apply_to_children: boolean;
  retrieval_days?: number;
  retrieval_mode?: 'Standard' | 'Bulk';
}

export interface FileData {
  _id: string;
  filename: string;
  original_filename?: string;
  file_type: 'image' | 'video' | 'document' | 'other';
  content_type?: string;
  file_size: number;
  folder_id: string;
  owner_id: string;
  s3_key?: string;
  s3_url?: string;
  thumbnail_s3_key?: string;
  thumbnail_s3_url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
  storage_type: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
  archival_status?: string;
  archived_at?: string;
  upload_status?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadFileResponse {
  file_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  s3_url: string;
  thumbnail_url?: string;
  upload_status: string;
  storage_type: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
}

export interface UpdateFileRequest {
  filename?: string;
  folder_id?: string;
}

// Legacy support - API might return just an array of folders or a paginated response
export interface FoldersResponse {
  folders?: Folder[];
  total?: number;
  skip?: number;
  limit?: number;
  has_more?: boolean;
}

// Updated to support new paginated format or legacy format
export type FoldersApiResponse = Folder[] | FoldersResponse | PaginatedResponse<Folder>;

export interface FoldersRequest {
  parent_folder_id?: string;
  only_true_roots?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'file_count' | 'subfolder_count' | 'total_size';
  sort_order?: 'asc' | 'desc';
  storage_type?: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
  include_size?: boolean;
}

export interface FilesRequest {
  search?: string;
  skip?: number;
  limit?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'filename' | 'file_size' | 'created_at' | 'updated_at' | 'file_type';
  sort_order?: 'asc' | 'desc';
  file_type?: 'image' | 'video' | 'document' | 'other';
  storage_type?: 'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE';
  min_size?: number;
  max_size?: number;
}

export interface ShareFolderRequest {
  user_email: string;
  access_level: 'read' | 'write' | 'admin';
}

export interface UserSearchRequest {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: 'full_name' | 'email' | 'created_at';
  sort_order?: 'asc' | 'desc';
} 