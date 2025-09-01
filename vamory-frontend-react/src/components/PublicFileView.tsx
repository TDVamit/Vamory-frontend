import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle, Eye } from 'lucide-react';
import { publicFoldersAPI } from '../services/api';
import { Header } from './Header';
import { MediaGallery } from './MediaGallery';

import type { FileData } from '../types';

// Unauthorized UI
const UnauthorizedPage = ({ onGoHome }: { onGoHome: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-4">
    <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-md w-full">
      <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2 text-red-200">Unauthorized</h1>
      <p className="text-gray-300 mb-4 text-center">You do not have permission to view this file.<br/>Please ask the owner to grant you access.</p>
      <button
        onClick={onGoHome}
        className="mt-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow"
      >
        Go to Home
      </button>
    </div>
  </div>
);

export const PublicFileView = () => {
  const [searchParams] = useSearchParams();
  const publicToken = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  // Fetch file details
  const loadFileContent = async () => {
    if (!publicToken) {
      setError('No token provided');
      return;
    }

    setIsLoading(true);
    setError('');
    setUnauthorized(false);
    
    try {
      const fileData = await publicFoldersAPI.getPublicFileByToken(publicToken);
      setFile(fileData);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUnauthorized(true);
        setFile(null);
        setError('');
      } else {
        setError(err?.response?.data?.detail || 'File not found or access denied.');
        setFile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicToken) {
      loadFileContent();
    }
  }, [publicToken]);

  const handleDownload = async () => {
    if (!file || !publicToken) return;
    
    try {
      const response = await publicFoldersAPI.downloadPublicFile(publicToken);
      const downloadUrl = response.download_url;
      const filename = response.filename || file.filename || file.original_filename || file._id;
      
      if (!downloadUrl) {
        console.error(`No download_url for file ${file.filename}`);
        return;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (downloadError) {
      console.error(`Failed to download ${file.filename}:`, downloadError);
    }
  };

  const handleFileClick = () => {
    if (file && (file.file_type === 'image' || file.file_type === 'video')) {
      setShowMediaGallery(true);
    }
  };

  const handleGalleryClose = () => setShowMediaGallery(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show loading state for initial load
  if (unauthorized) {
    return <UnauthorizedPage onGoHome={() => navigate('/home')} />;
  }
  
  if (isLoading && !file) {
    return (
      <div className="min-h-screen surface-dark">
        <div className="pt-20 flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
            <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
            <span>Loading file...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen surface-dark">
        <Header />
        <div className="pt-20 flex items-center justify-center py-16">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-200">File Not Found</h1>
            <p className="text-gray-300 mb-4">{error || 'The requested file could not be found.'}</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-dark">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/home')}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/40 text-white hover:bg-gray-600/50 transition-colors rounded-lg border border-gray-500/30"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        {/* File Content */}
        <div className="bg-black/40 backdrop-blur-md border border-gray-700/30 rounded-xl p-6">
          {/* File Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-2">{file.filename}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{file.file_type.toUpperCase()}</span>
              <span>•</span>
              <span>{formatFileSize(file.file_size)}</span>
              {file.metadata?.width && file.metadata?.height && (
                <>
                  <span>•</span>
                  <span>{file.metadata.width} × {file.metadata.height}</span>
                </>
              )}
            </div>
          </div>

          {/* File Preview */}
          <div className="mb-6">
            {(file.file_type === 'image' || file.file_type === 'video') ? (
              <div 
                className="relative cursor-pointer group"
                onClick={handleFileClick}
              >
                <img
                  src={file.s3_url || file.thumbnail_s3_url}
                  alt={file.filename}
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-700/30"
                />
                {file.file_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <polygon points="8,5 19,12 8,19" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Click to view
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-800/50 rounded-lg border border-gray-700/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl text-gray-400 mb-4">
                    {file.file_type === 'document' ? '📄' : '📁'}
                  </div>
                  <p className="text-gray-400">Preview not available</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-gray-700/40 text-white hover:bg-gray-600/50 transition-colors rounded-lg border border-gray-500/30"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download to view
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* File Description */}
          {file.image_description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">{file.image_description}</p>
            </div>
          )}

          {/* File Metadata */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">File Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Original filename:</span>
                <span className="text-white ml-2">{file.original_filename}</span>
              </div>
              <div>
                <span className="text-gray-400">Content type:</span>
                <span className="text-white ml-2">{file.content_type}</span>
              </div>
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="text-white ml-2">
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">File hash:</span>
                <span className="text-white ml-2 font-mono text-xs">
                  {file.file_hash?.substring(0, 16)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      {showMediaGallery && file && (file.file_type === 'image' || file.file_type === 'video') && (
        <MediaGallery
          files={[file]}
          currentIndex={0}
          onClose={handleGalleryClose}
          onNavigate={() => {}}
          isPublic={true}
          publicToken={publicToken}
        />
      )}
    </div>
  );
};
