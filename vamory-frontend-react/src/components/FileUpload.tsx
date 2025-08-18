import { useState, useRef} from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import api, {  API_BASE_URL } from '../services/api';
import { useAuth0Custom } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ErrorModal } from './ErrorModal';

// Allowed file extensions
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Helper function to check if file is allowed
const isFileAllowed = (file: File): boolean => {
  const extension = getFileExtension(file.name);
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension) || ALLOWED_VIDEO_EXTENSIONS.includes(extension);
};

interface FileUploadProps {
  folderId: string;
  onSuccess: () => void;
  onClose: () => void;
  isOpen?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Calculate file hash matching backend logic
async function calculateFileHash(file: File): Promise<string> {
  // const filenameBytes = new TextEncoder().encode(file.name); // REMOVE filename from hash
  const contentTypeBytes = new TextEncoder().encode(file.type);
  const fileSizeBytes = new TextEncoder().encode(String(file.size));
  const fileBuffer = await file.arrayBuffer();
  let hashInput: Uint8Array;
  if (file.size > 20000) {
    const first10k = new Uint8Array(fileBuffer, 0, 10000);
    const last10k = new Uint8Array(fileBuffer, file.size - 10000, 10000);
    hashInput = new Uint8Array(
      contentTypeBytes.length + fileSizeBytes.length + first10k.length + last10k.length
    );
    let offset = 0;
    hashInput.set(contentTypeBytes, offset); offset += contentTypeBytes.length;
    hashInput.set(fileSizeBytes, offset); offset += fileSizeBytes.length;
    hashInput.set(first10k, offset); offset += first10k.length;
    hashInput.set(last10k, offset);
  } else {
    const allBytes = new Uint8Array(fileBuffer);
    hashInput = new Uint8Array(
      contentTypeBytes.length + fileSizeBytes.length + allBytes.length
    );
    let offset = 0;
    hashInput.set(contentTypeBytes, offset); offset += contentTypeBytes.length;
    hashInput.set(fileSizeBytes, offset); offset += fileSizeBytes.length;
    hashInput.set(allBytes, offset);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashInput);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: complete upload
interface CompleteUploadParams {
  s3_key: string;
  filename: string;
  folder_id: string;
  content_type: string;
  file_size: number;
  file_hash: string;
}
async function completeUpload(
  { s3_key, filename, folder_id, content_type, file_size, file_hash }: CompleteUploadParams,
  _token: string // token is no longer needed, kept for signature compatibility
): Promise<any> {
  const response = await api.post(
    `/api/v1/files/upload-complete?folder_id=${folder_id}`,
    { s3_key, filename, folder_id, content_type, file_size, file_hash }
  );
  return response.data;
}

// Helper: upload to S3 with progress
function uploadToS3WithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
  storageClass?: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    if (storageClass) {
      xhr.setRequestHeader('x-amz-storage-class', storageClass);
    }
    xhr.setRequestHeader('x-amz-acl', 'private');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error('S3 upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('S3 upload failed'));
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload aborted'));
      });
    }
    xhr.send(file);
  });
}

  // Helper: get presigned upload URL
async function getPresignedUploadUrl(
  folderId: string,
  filename: string,
  contentType: string,
  token: string,
  file_hash: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/files/presign-upload?folder_id=${folderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ folder_id: folderId, filename, content_type: contentType, file_hash }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${res.status}: Failed to get presigned upload URL`);
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(`Failed to get presigned upload URL: ${error.message}`);
  }
}

export const FileUpload = ({ folderId, onSuccess, onClose, isOpen = true }: FileUploadProps) => {
  const { user } = useAuth0Custom();
  const hasZeroCredits = user && user.credits === 0;
  // Only allow admin, user, editor and check credits
  // Allow super_admin to upload files, just like admin and user
  const canUpload = (user?.user_role === UserRole.super_admin || user?.user_role === UserRole.admin || user?.user_role === UserRole.user || user?.user_role === UserRole.editor) && !hasZeroCredits;
  // State for file selection, upload, and error
  const [selectedFiles, setSelectedFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [info, setInfo] = useState<string>('');
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: 'Error',
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Helper function to show error modal
  const showErrorModal = (title: string, message: string, details?: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      details,
    });
  };

  // Helper function to close error modal
  const closeErrorModal = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    // Check for allowed file extensions
    const allowed = files.filter(isFileAllowed);
    if (allowed.length !== files.length) {
      const rejectedFiles = files.filter(f => !isFileAllowed(f));
      const rejectedExtensions = [...new Set(rejectedFiles.map(f => getFileExtension(f.name)))];
      setError(`Only specific file types are allowed. Rejected extensions: ${rejectedExtensions.join(', ')}. Allowed: ${[...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS].join(', ')}`);
    }
    
    // Filter out duplicates
    const existingNames = new Set(selectedFiles.map(f => f.file.name + f.file.size));
    const newFiles = allowed.filter(f => !existingNames.has(f.name + f.size));
    if (newFiles.length === 0) {
      setError('All selected files are already added or not allowed.');
      return;
    }
    setSelectedFiles(prev => [
      ...prev,
      ...newFiles.map(file => ({ file, progress: 0, status: 'pending' as const }))
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Select all files (no-op for now, could be used for future selection logic)
  const handleSelectAll = () => {
    // No-op: all files are already selected on add
  };

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Status color for file row
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-900/10';
      case 'error': return 'border-red-500 bg-red-900/10';
      case 'uploading': return 'border-blue-500 bg-blue-900/10';
      default: return 'border-gray-700 bg-black/20';
    }
  };
  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!folderId) {
      showErrorModal('Upload Error', 'No folder selected. Please refresh and try again.');
      return;
    }
    setError('');
    setInfo('');
    setIsUploading(true);
    const token = localStorage.getItem('access_token') || '';
    const updatedFiles = [...selectedFiles];
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'completed') continue;
      updatedFiles[i].status = 'uploading';
      setSelectedFiles([...updatedFiles]);
      try {
        const file = updatedFiles[i].file;
        const file_hash = await calculateFileHash(file);
        const presign = await getPresignedUploadUrl(folderId, file.name, file.type, token, file_hash);
        if (!presign.url && !presign.already_uploaded) {
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = 'Failed to get upload URL from server.';
          setSelectedFiles([...updatedFiles]);
          showErrorModal('Upload Error', 'Failed to get upload URL from server.', 'The server could not generate a secure upload URL for this file.');
          continue;
        }
        let skipS3 = false;
        if (presign.already_uploaded) {
          setInfo(`File "${file.name}" was already uploaded.`);
          skipS3 = true;
        }
        if (!skipS3) {
          const controller = new AbortController();
          abortControllersRef.current.add(controller);
          await uploadToS3WithProgress(
            presign.url,
            file,
            (progress) => {
              updatedFiles[i].progress = progress;
              setSelectedFiles([...updatedFiles]);
            },
            controller.signal,
            presign.storage_class
          );
          abortControllersRef.current.delete(controller);
        }
        const completeResp = await completeUpload({
          s3_key: presign.s3_key,
          filename: file.name,
          folder_id: folderId,
          content_type: file.type,
          file_size: file.size,
          file_hash,
        }, token);
        if (completeResp?.already_uploaded) {
          setInfo(`File "${file.name}" was already uploaded.`);
        }
        updatedFiles[i].status = 'completed';
        updatedFiles[i].progress = 100;
        setSelectedFiles([...updatedFiles]);
      } catch (err: any) {
        updatedFiles[i].status = 'error';
        updatedFiles[i].error = err?.message || 'Upload failed';
        setSelectedFiles([...updatedFiles]);
        
        // Show detailed error in modal
        const errorMessage = err?.message || 'Upload failed';
        const errorDetails = err?.response?.data?.detail || err?.stack || 'No additional details available';
        showErrorModal(
          'Upload Failed', 
          `Failed to upload "${updatedFiles[i].file.name}". ${errorMessage}`,
          errorDetails
        );
      }
    }
    setIsUploading(false);
    // If all files completed, call onSuccess and close
    if (updatedFiles.every(f => f.status === 'completed')) {
      setTimeout(() => {
        onSuccess();
        setSelectedFiles([]);
        setError('');
        setInfo('');
        onClose();
      }, 800);
    }
  };

  if (!isOpen || !canUpload) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="glass bg-black/40 rounded-xl p-8 w-full max-w-2xl mx-4 border border-gray-700/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/30 rounded-lg border border-gray-700/30">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Upload Files</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              // Abort all ongoing uploads
              abortControllersRef.current.forEach(controller => controller.abort());
              abortControllersRef.current.clear();
              onClose();
              setSelectedFiles([]);
              setError('');
            }}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/30 backdrop-blur-sm border border-red-700/40 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {info && (
          <div className="mb-4 bg-blue-900/30 backdrop-blur-sm border border-blue-700/40 rounded-lg p-3">
            <p className="text-blue-300 text-sm">{info}</p>
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-600/30 rounded-xl p-8 text-center hover:border-gray-500/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v"
          />
          {selectedFiles.length === 0 ? (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-white font-medium">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-sm mt-1">Multiple files supported</p>
                <p className="text-gray-500 text-xs mt-2">
                  Allowed: {[...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS].join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-gray-300 hover:text-white transition-colors text-sm underline"
              >
                Select All Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-left space-y-3 max-h-64 overflow-y-auto">
                {selectedFiles.map((uploadingFile, index) => (
                  <div
                    key={`${uploadingFile.file.name}-${index}`}
                    className={`relative p-3 rounded-lg border ${getStatusColor(uploadingFile.status)} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{uploadingFile.file.name}</p>
                        <p className="text-gray-400 text-sm">{formatFileSize(uploadingFile.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadingFile.status)}
                      {uploadingFile.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {uploadingFile.status === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              // Abort all ongoing uploads
              abortControllersRef.current.forEach(controller => controller.abort());
              abortControllersRef.current.clear();
              onClose();
              setSelectedFiles([]);
              setError('');
            }}
            className="flex-1 px-4 py-3 surface-alt border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 text-gray-300 hover:text-white transition-colors bg-gray-700/50 backdrop-blur-sm rounded-lg font-semibold flex items-center justify-center gap-2 border border-gray-600/20 hover:bg-gray-600/50"
          >
            <Plus size={16} />
            Add More
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex-1 text-gray-300 hover:text-white transition-colors bg-gray-800/30 backdrop-blur-sm py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/20 hover:bg-gray-700/40"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
                 </div>
       </div>
     </div>
     
     {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </>
  );
};