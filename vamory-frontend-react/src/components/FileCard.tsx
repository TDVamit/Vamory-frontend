import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { useFileManager } from '../hooks/useFileManager';
import { ConfirmDialog } from './ConfirmDialog';
import type { FileData } from '../types';

interface FileCardProps {
  file: FileData;
  onRefresh?: () => void;
  isPublic?: boolean;
  publicToken?: string;
  onDownload?: () => void;
}

export const FileCard = ({ file, onRefresh, isPublic, onDownload }: FileCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { downloadFile, deleteFile } = useFileManager();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'bg-gray-600/90 text-white';
      case 'video':
        return 'bg-gray-600/90 text-white';
      case 'document':
        return 'bg-gray-600/90 text-white';
      default:
        return 'bg-gray-600/90 text-white';
    }
  };

  const handleDownload = async () => {
    if (isPublic && onDownload) {
      onDownload();
      return;
    }
    if (isPublic) {
      // If public but no onDownload, do nothing
      return;
    }
    // Only use private logic if not public
    try {
      let downloadUrl = file.s3_url;
      let filenameToUse = file.filename || file.original_filename;
      const response = await downloadFile(file._id);
      if (response && response.download_url) {
        downloadUrl = response.download_url;
        filenameToUse = response.filename || file.original_filename || file.filename;
      }
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filenameToUse || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Download URL not found.');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    requestAnimationFrame(() => {
      setShowDeleteDialog(true);
    });
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const success = await deleteFile(file._id);
      if (success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleCardClick = () => {
    if (file.file_type !== 'image' && file.file_type !== 'video') {
      if (isPublic && onDownload) {
        onDownload();
      } else if (!isPublic) {
        handleDownload();
      }
    }
  };

  const getDefaultThumbnail = () => {
    const colors = {
      image: 'from-gray-700/20 to-gray-800/10',
      video: 'from-gray-700/20 to-gray-800/10',
      document: 'from-gray-700/20 to-gray-800/10',
      other: 'from-gray-700/20 to-gray-800/10'
    };
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${colors[file.file_type] || colors.other} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getFileTypeColor(file.file_type).replace('bg-', 'text-').replace('/90', '')}`}>
            {file.filename.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {file.file_type === 'video' ? '' : file.file_type.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div 
        className="relative aspect-square rounded-xl overflow-hidden card-hover group cursor-pointer bg-gray-900"
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        {(file.file_type === 'image' || file.file_type === 'video') && (file.thumbnail_s3_url || file.thumbnail_url) ? (
          <div className="relative w-full h-full">
            <img
              src={file.thumbnail_s3_url || file.thumbnail_url}
              alt={file.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {file.file_type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-12 h-12 text-white/90 drop-shadow-lg" fill="currentColor" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="24" fill="black" fillOpacity="0.4"/>
                  <polygon points="20,16 36,24 20,32" fill="white"/>
                </svg>
              </span>
            )}
          </div>
        ) : (
          getDefaultThumbnail()
        )}

        {/* Actions Menu */}
        {/* Removed the options (MoreVertical) icon button as requested */}

        {showActions && (
          <div className="absolute right-0 top-8 glass rounded-lg shadow-lg border border-gray-700/30 z-20 py-1 min-w-[140px] backdrop-blur-md bg-black/40">
            {file.file_type === 'image' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // setShowPreview(true); // Removed as per previous instruction
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Image
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPublic && onDownload) {
                  onDownload();
                } else if (!isPublic) {
                  handleDownload();
                }
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {/* Only show delete if not public */}
            {!isPublic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(e);
                }}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      {!isPublic && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete File"
          message={`Are you sure you want to delete ${file.filename}? This action cannot be undone.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};