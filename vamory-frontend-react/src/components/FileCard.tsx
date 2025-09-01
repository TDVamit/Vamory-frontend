import { useState, useEffect } from 'react';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileData>(file);
  const { downloadFile, deleteFile } = useFileManager();

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file);
  }, [file]);



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
      let downloadUrl = currentFile.s3_url;
      let filenameToUse = currentFile.filename || currentFile.original_filename;
      const response = await downloadFile(currentFile._id);
      if (response && response.download_url) {
        downloadUrl = response.download_url;
        filenameToUse = response.filename || currentFile.original_filename || currentFile.filename;
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

 

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const success = await deleteFile(currentFile._id);
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
    if (currentFile.file_type !== 'image' && currentFile.file_type !== 'video') {
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
      <div className={`w-full h-full bg-gradient-to-br ${colors[currentFile.file_type] || colors.other} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getFileTypeColor(currentFile.file_type).replace('bg-', 'text-').replace('/90', '')}`}>
            {currentFile.filename.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {currentFile.file_type === 'video' ? '' : currentFile.file_type.toUpperCase()}
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
        {(currentFile.file_type === 'image' || currentFile.file_type === 'video') && (currentFile.thumbnail_s3_url || currentFile.thumbnail_url) ? (
          <div className="relative w-full h-full">
            <img
              src={currentFile.thumbnail_s3_url || currentFile.thumbnail_url}
              alt={currentFile.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {currentFile.file_type === 'video' && (
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




      </div>
      {/* Delete Confirmation Dialog */}
      {!isPublic && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete File"
          message={`Are you sure you want to delete ${currentFile.filename}? This action cannot be undone.`}
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