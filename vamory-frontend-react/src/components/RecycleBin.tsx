import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, RotateCcw, AlertTriangle, Clock, Folder, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { useTrash } from '../hooks/useTrash';
import { FileCard } from './FileCard';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import { MediaGallery } from './MediaGallery';
import { CustomDropdown } from './CustomDropdown';
import { useAuth0Custom } from '../contexts/AuthContext';
import type { FileData } from '../types';

export const RecycleBin = () => {
  const navigate = useNavigate();
  useAuth0Custom();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [sortBy, setSortBy] = useState('deleted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showMassRestoreDialog, setShowMassRestoreDialog] = useState(false);
  const [showMassDeleteDialog, setShowMassDeleteDialog] = useState(false);
  const [isMassRestoring, setIsMassRestoring] = useState(false);
  const [isMassDeleting, setIsMassDeleting] = useState(false);

  const {
    files,
    isLoading,
    error,
    totalCount,
    hasMore,
    isRestoring,
    isDeleting,
    loadMore,
    refresh,
    restoreFile,
    permanentDeleteFile,
    updateSort
  } = useTrash({
    initialSortBy: 'deleted_at',
    initialSortOrder: 'desc'
  });

  // Filter files based on search query
  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.folder_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file click
  const handleFileClick = (file: FileData, index: number) => {
    // Only allow opening standard files, not archived ones
    if (file.storage_type === 'STANDARD') {
      setGalleryCurrentIndex(index);
      setShowMediaGallery(true);
    }
  };

  // Handle restore file
  const handleRestore = async (file: FileData) => {
    setSelectedFile(file);
    setShowRestoreDialog(true);
  };

  // Confirm restore
  const confirmRestore = async () => {
    if (selectedFile) {
      const success = await restoreFile(selectedFile._id);
      if (success) {
        setShowRestoreDialog(false);
        setSelectedFile(null);
      }
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (file: FileData) => {
    setSelectedFile(file);
    setShowDeleteDialog(true);
  };

  // Confirm permanent delete
  const confirmPermanentDelete = async () => {
    if (selectedFile) {
      const success = await permanentDeleteFile(selectedFile._id);
      if (success) {
        setShowDeleteDialog(false);
        setSelectedFile(null);
      }
    }
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
    updateSort(newSortBy, newSortOrder as 'asc' | 'desc');
  };

  // Multi-select handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedFiles(new Set());
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    const allFileIds = new Set(filteredFiles.map(f => f._id));
    setSelectedFiles(allFileIds);
  };

  const getTotalSelected = () => selectedFiles.size;

  // Mass operations
  const handleMassRestore = async () => {
    setIsMassRestoring(true);
    try {
      const selectedFileIds = Array.from(selectedFiles);
      let successCount = 0;
      let failCount = 0;

      for (const fileId of selectedFileIds) {
        try {
          const success = await restoreFile(fileId);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to restore file ${fileId}:`, error);
          failCount++;
        }
      }

      // Clear selections after operation
      setSelectedFiles(new Set());
      setShowMassRestoreDialog(false);
      
      // Show result message (you could add a toast notification here)
      console.log(`Restored ${successCount} files, ${failCount} failed`);
    } catch (error) {
      console.error('Error during mass restore:', error);
    } finally {
      setIsMassRestoring(false);
    }
  };

  const handleMassDelete = async () => {
    setIsMassDeleting(true);
    try {
      const selectedFileIds = Array.from(selectedFiles);
      let successCount = 0;
      let failCount = 0;

      for (const fileId of selectedFileIds) {
        try {
          const success = await permanentDeleteFile(fileId);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete file ${fileId}:`, error);
          failCount++;
        }
      }

      // Clear selections after operation
      setSelectedFiles(new Set());
      setShowMassDeleteDialog(false);
      
      // Show result message (you could add a toast notification here)
      console.log(`Deleted ${successCount} files, ${failCount} failed`);
    } catch (error) {
      console.error('Error during mass delete:', error);
    } finally {
      setIsMassDeleting(false);
    }
  };

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get days until permanent deletion
  const getDaysUntilDeletion = (deletedAt: string | undefined): number => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const thirtyDaysLater = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = thirtyDaysLater.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen surface-dark">
      <Header />
      
      {/* Main Content */}
      <div className="pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/gallery')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Gallery</span>
              </button>
              <div className="flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-400" />
                <h1 className="text-2xl font-bold text-white">Recycle Bin</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Items deleted after 30 days</span>
              </div>
              
              {/* Selection mode toggle */}
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center w-8 h-8 rounded border border-gray-600/20 bg-gray-800/20 hover:bg-gray-700/30 transition-colors ${isSelectionMode ? 'text-blue-400 border-blue-400' : 'text-gray-300'}`}
                title={isSelectionMode ? 'Exit Selection Mode' : 'Enable Selection Mode'}
                aria-pressed={isSelectionMode}
                style={{ minWidth: 32, minHeight: 32 }}
              >
                {isSelectionMode ? <CheckSquare size={20} /> : <Square size={20} />}
              </button>

              {/* Mass action buttons */}
              {isSelectionMode && getTotalSelected() > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMassRestoreDialog(true)}
                    disabled={isMassRestoring}
                    className="flex items-center gap-2 px-3 py-2 text-green-300 bg-green-800/20 rounded-lg border border-green-600/40 hover:bg-green-700/20 hover:border-green-500/40 transition-all duration-200 disabled:opacity-50 shadow-lg backdrop-blur-sm"
                  >
                    <RotateCcw className={`w-4 h-4 ${isMassRestoring ? 'animate-spin' : ''}`} />
                    Restore ({getTotalSelected()})
                  </button>
                  <button
                    onClick={() => setShowMassDeleteDialog(true)}
                    disabled={isMassDeleting}
                    className="flex items-center gap-2 px-3 py-2 text-red-300 bg-red-800/20 rounded-lg border border-red-600/40 hover:bg-red-700/20 hover:border-red-500/40 transition-all duration-200 disabled:opacity-50 shadow-lg backdrop-blur-sm"
                  >
                    <Trash2 className={`w-4 h-4 ${isMassDeleting ? 'animate-spin' : ''}`} />
                    Delete ({getTotalSelected()})
                  </button>
                </div>
              )}

              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 bg-gray-800/40 rounded-lg border border-gray-600/40 hover:bg-gray-700/40 hover:border-gray-500/40 transition-all duration-200 disabled:opacity-50 shadow-lg backdrop-blur-sm"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search deleted files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/40 border border-gray-600/40 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-700/40 hover:border-gray-500/40 shadow-lg"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <CustomDropdown
                options={[
                  { value: 'deleted_at-desc', label: 'Deleted Date (Newest)' },
                  { value: 'deleted_at-asc', label: 'Deleted Date (Oldest)' },
                  { value: 'filename-asc', label: 'Name (A-Z)' },
                  { value: 'filename-desc', label: 'Name (Z-A)' },
                  { value: 'file_size-desc', label: 'Size (Largest)' },
                  { value: 'file_size-asc', label: 'Size (Smallest)' },
                ]}
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                placeholder="Sort by..."
                className="min-w-[200px]"
              />
            </div>
          </div>

          {/* Selection Mode Actions Row */}
          {isSelectionMode && getTotalSelected() > 0 && (
            <div className="flex items-center gap-2 py-2 mb-2 overflow-x-auto w-full">
              <button
                onClick={selectAll}
                className="text-gray-300 hover:text-white transition-colors bg-gray-800/20 backdrop-blur-sm p-2 rounded-lg flex items-center border border-gray-600/20 hover:bg-gray-700/30"
                title="Select All"
              >
                <CheckSquare size={18} />
              </button>
              <span className="flex items-center gap-2 text-gray-400 text-base ml-2">
                <span className="flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  {selectedFiles.size} selected
                </span>
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 p-6 bg-gray-800/40 rounded-lg border border-gray-600/40 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalCount}</div>
                  <div className="text-sm text-gray-400">Deleted Files</div>
                </div>
                                 <div className="text-center">
                   <div className="text-2xl font-bold text-red-400">
                     {files.filter(f => getDaysUntilDeletion(f.deleted_at) <= 7).length}
                   </div>
                   <div className="text-sm text-gray-400">Expiring Soon</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Files will be permanently deleted after 30 days</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Files Grid */}
          <div
            ref={scrollContainerRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto"
          >
            {filteredFiles.map((file, index) => (
              <div key={file._id} className="relative group">
                <div className="relative">
                  {/* Selection checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file._id);
                        }}
                        className={`p-1 rounded border-2 transition-colors ${
                          selectedFiles.has(file._id)
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-800/80 border-gray-600 text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedFiles.has(file._id) ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* File Card */}
                  <div
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleFileSelection(file._id);
                      } else {
                        handleFileClick(file, index);
                      }
                    }}
                    className={`transition-all duration-200 ${
                      isSelectionMode 
                        ? 'cursor-pointer' 
                        : file.storage_type === 'STANDARD' 
                          ? 'cursor-pointer hover:scale-105 hover:shadow-lg' 
                          : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <FileCard file={file} />
                  </div>
                  
                  {/* Storage Type Badge */}
                  {file.storage_type === 'DEEP_ARCHIVE' && (
                    <div className={`absolute top-2 bg-yellow-600/80 text-white text-xs px-2 py-1 rounded ${isSelectionMode ? 'left-10' : 'left-2'}`}>
                      Archived
                    </div>
                  )}
                  
                                     {/* Days Until Deletion */}
                   <div className="absolute top-2 right-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded">
                     {getDaysUntilDeletion(file.deleted_at)}d
                   </div>
                  
                  {/* Action Buttons - Only show when not in selection mode */}
                  {!isSelectionMode && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                    {file.storage_type === 'STANDARD' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick(file, index);
                        }}
                        className="p-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500/80 transition-colors"
                        title="View File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="p-2 bg-gray-600/80 text-white rounded-lg cursor-not-allowed"
                        title="Archived files cannot be opened"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(file);
                      }}
                      disabled={isRestoring === file._id}
                      className="p-2 bg-green-600/80 text-white rounded-lg hover:bg-green-500/80 transition-colors disabled:opacity-50"
                      title="Restore File"
                    >
                      <RotateCcw className={`w-4 h-4 ${isRestoring === file._id ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(file);
                      }}
                      disabled={isDeleting === file._id}
                      className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-500/80 transition-colors disabled:opacity-50"
                      title="Delete Permanently"
                    >
                      <Trash2 className={`w-4 h-4 ${isDeleting === file._id ? 'animate-spin' : ''}`} />
                    </button>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="mt-2 text-sm">
                  <div className="text-white font-medium truncate">{file.filename}</div>
                  <div className="text-gray-400">{formatFileSize(file.file_size)}</div>
                  {file.folder_name && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Folder className="w-3 h-3" />
                      <span className="truncate">{file.folder_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                <span>Loading deleted files...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Trash2 className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No deleted files found</h3>
              <p className="text-center">
                {searchQuery ? 'No files match your search criteria.' : 'Files you delete will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      {showMediaGallery && (
        <MediaGallery
          files={filteredFiles}
          currentIndex={galleryCurrentIndex}
          onClose={() => setShowMediaGallery(false)}
          onNavigate={setGalleryCurrentIndex}
        />
      )}

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreDialog}
        onCancel={() => setShowRestoreDialog(false)}
        onConfirm={confirmRestore}
        title="Restore File"
        message={`Are you sure you want to restore "${selectedFile?.filename}"? The file will be moved back to its original folder.`}
        confirmText="Restore"
        variant="info"
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmPermanentDelete}
        title="Permanently Delete File"
        message={`Are you sure you want to permanently delete "${selectedFile?.filename}"? This action cannot be undone.`}
        confirmText="Delete Permanently"
        variant="danger"
      />

      {/* Mass Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showMassRestoreDialog}
        onCancel={() => setShowMassRestoreDialog(false)}
        onConfirm={handleMassRestore}
        title="Restore Selected Files"
        message={`Are you sure you want to restore ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}? The files will be moved back to their original folders.`}
        confirmText={isMassRestoring ? "Restoring..." : "Restore"}
        variant="info"
      />

      {/* Mass Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showMassDeleteDialog}
        onCancel={() => setShowMassDeleteDialog(false)}
        onConfirm={handleMassDelete}
        title="Permanently Delete Selected Files"
        message={`Are you sure you want to permanently delete ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={isMassDeleting ? "Deleting..." : "Delete Permanently"}
        variant="danger"
      />
    </div>
  );
};
