import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import api, { filesAPI, API_BASE_URL } from '../services/api';

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
  const res = await fetch(`${API_BASE_URL}/api/v1/files/presign-upload?folder_id=${folderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ folder_id: folderId, filename, content_type: contentType, file_hash }),
  });
  if (!res.ok) throw new Error('Failed to get presigned upload URL');
  return await res.json();
}

export const FileUpload = ({ folderId, onSuccess, onClose, isOpen = true }: FileUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Reset state when modal is opened or closed
  useEffect(() => {
    setSelectedFiles([]);
    setIsUploading(false);
    setError('');
    abortControllersRef.current.clear();
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newUploadingFiles: UploadingFile[] = files.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }));
      setSelectedFiles(prev => [...prev, ...newUploadingFiles]);
      setError('');
    }
  };

  const handleSelectAll = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const file = selectedFiles[index];
    if (file.status === 'uploading') {
      const controller = abortControllersRef.current.get(file.file.name);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(file.file.name);
      }
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (uploadingFile: UploadingFile, index: number): Promise<void> => {
    const { file } = uploadingFile;
    
    // Update status to uploading
    setSelectedFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    // Get auth token
    const token = localStorage.getItem('access_token');
    if (!token) {
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: 'Not authenticated' } : f
      ));
      return;
    }

    try {
      // Calculate file hash
      const file_hash = await calculateFileHash(file);
      
      if (file.size <= 30 * 1024 * 1024) {
        // Small file: use old logic
        const progressInterval = setInterval(() => {
          setSelectedFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ));
        }, 200);
        
        await filesAPI.uploadFile(folderId, file);
        clearInterval(progressInterval);
        
        setSelectedFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'completed', progress: 100 } : f
        ));
      } else {
        // Large file: use presigned S3 upload
        setSelectedFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, progress: 1 } : f
        ));

        const controller = new AbortController();
        abortControllersRef.current.set(file.name, controller);

        // Get presigned URL
        const presignRes = await getPresignedUploadUrl(
          folderId,
          file.name,
          file.type,
          token,
          file_hash
        );

        if (presignRes.already_uploaded) {
          // File already uploaded, call upload-complete immediately
          await completeUpload({
            s3_key: presignRes.s3_key,
            filename: file.name,
            folder_id: folderId,
            content_type: file.type,
            file_size: file.size,
            file_hash,
          }, token);
          
          setSelectedFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, status: 'completed', progress: 100 } : f
          ));
        } else {
          // Not uploaded, upload to S3 then call upload-complete
          const { url, s3_key, storage_class } = presignRes;
          await uploadToS3WithProgress(
            url,
            file,
            (progress: number) => {
              setSelectedFiles(prev => prev.map((f, i) => 
                i === index ? { ...f, progress } : f
              ));
            },
            controller.signal,
            storage_class
          );
          
          setSelectedFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 100 } : f
          ));
          
          await completeUpload({
            s3_key,
            filename: file.name,
            folder_id: folderId,
            content_type: file.type,
            file_size: file.size,
            file_hash,
          }, token);
          
          setSelectedFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, status: 'completed' } : f
          ));
        }
        
        abortControllersRef.current.delete(file.name);
      }
    } catch (err) {
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Upload failed' 
        } : f
      ));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      // Upload all files in parallel
      await Promise.all(
        selectedFiles.map((file, index) => uploadSingleFile(file, index))
      );

      // Check if all files completed successfully
      const allCompleted = selectedFiles.every(file => file.status === 'completed');
      if (allCompleted) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newUploadingFiles: UploadingFile[] = files.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }));
      setSelectedFiles(prev => [...prev, ...newUploadingFiles]);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/40 bg-green-500/10';
      case 'error':
        return 'border-red-500/40 bg-red-500/10';
      case 'uploading':
        return 'border-blue-500/40 bg-blue-500/10';
      default:
        return 'border-gray-600/40 bg-gray-600/10';
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-600/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700/30 backdrop-blur-sm rounded-lg border border-gray-600/20">
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Upload Files</h3>
        </div>
        <button
          onClick={onClose}
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
        />
        
        {selectedFiles.length === 0 ? (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white font-medium">Click to upload or drag and drop</p>
              <p className="text-gray-400 text-sm mt-1">Multiple files supported</p>
            </div>
            <button
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
                  className={`p-3 rounded-lg border ${getStatusColor(uploadingFile.status)} flex items-center justify-between`}
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
                      onClick={(e) => {
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
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3 text-gray-300 hover:text-white transition-colors bg-gray-700/50 backdrop-blur-sm rounded-lg font-semibold flex items-center justify-center gap-2 border border-gray-600/20 hover:bg-gray-600/50"
        >
          <Plus size={16} />
          Add More
        </button>
        <button
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
  );
}; 