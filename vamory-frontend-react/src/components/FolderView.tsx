import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Upload as UploadIcon, Home, ChevronRight, File, Download, Trash2, CheckSquare, Square } from 'lucide-react';
import { foldersAPI, filesAPI } from '../services/api';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { CreateFolderModal } from './CreateFolderModal';
import { FileUpload } from './FileUpload';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import { MediaGallery } from './MediaGallery';
import type { Folder, FileData } from '../types';

export const FolderView = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Media Gallery state
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);

  // Infinite scrolling state
  const [foldersPage, setFoldersPage] = useState(1);
  const [filesPage, setFilesPage] = useState(1);
  const [hasMoreFolders, setHasMoreFolders] = useState(true);
  const [hasMoreFiles, setHasMoreFiles] = useState(true);
  const [isLoadingMoreFolders, setIsLoadingMoreFolders] = useState(false);
  const [isLoadingMoreFiles, setIsLoadingMoreFiles] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (folderId) {
      loadFolderContent(folderId);
    }
  }, [folderId]);

  const loadFolderContent = async (id: string) => {
    setIsLoading(true);
    setError('');
    
    // Reset pagination state
    setFoldersPage(1);
    setFilesPage(1);
    setHasMoreFolders(true);
    setHasMoreFiles(true);
    
    try {
      // Load folder details, subfolders, and files in parallel
      const [folderDetails, subfoldersData, filesData] = await Promise.all([
        foldersAPI.getFolder(id),
        foldersAPI.getFolders({ parent_folder_id: id, include_size: true, page: 1, per_page: 20 }),
        filesAPI.getFolderFiles(id, { page: 1, per_page: 20 })
      ]);
      
      setCurrentFolder(folderDetails);
      setSubfolders(subfoldersData);
      setFiles(filesData);
      
      // Check if there are more items
      if (subfoldersData.length < 20) {
        setHasMoreFolders(false);
      }
      if (filesData.length < 20) {
        setHasMoreFiles(false);
      }
      
      // Build breadcrumbs
      await buildBreadcrumbs(folderDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder content');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreFolders = async () => {
    if (!folderId || isLoadingMoreFolders || !hasMoreFolders) return;
    
    setIsLoadingMoreFolders(true);
    try {
      const nextPage = foldersPage + 1;
      const newFolders = await foldersAPI.getFolders({ 
        parent_folder_id: folderId, 
        include_size: true, 
        page: nextPage, 
        per_page: 20 
      });
      
      if (newFolders.length > 0) {
        setSubfolders(prev => [...prev, ...newFolders]);
        setFoldersPage(nextPage);
        if (newFolders.length < 20) {
          setHasMoreFolders(false);
        }
      } else {
        setHasMoreFolders(false);
      }
    } catch (err) {
      console.error('Failed to load more folders:', err);
    } finally {
      setIsLoadingMoreFolders(false);
    }
  };

  const loadMoreFiles = async () => {
    if (!folderId || isLoadingMoreFiles || !hasMoreFiles) return;
    
    setIsLoadingMoreFiles(true);
    try {
      const nextPage = filesPage + 1;
      const newFiles = await filesAPI.getFolderFiles(folderId, { 
        page: nextPage, 
        per_page: 20 
      });
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        setFilesPage(nextPage);
        if (newFiles.length < 20) {
          setHasMoreFiles(false);
        }
      } else {
        setHasMoreFiles(false);
      }
    } catch (err) {
      console.error('Failed to load more files:', err);
    } finally {
      setIsLoadingMoreFiles(false);
    }
  };

  // Scroll detection for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when user scrolls to 80% of the content
    if (scrollPercentage > 0.8) {
      if (hasMoreFolders && !isLoadingMoreFolders) {
        loadMoreFolders();
      }
      if (hasMoreFiles && !isLoadingMoreFiles) {
        loadMoreFiles();
      }
    }
  }, [hasMoreFolders, hasMoreFiles, isLoadingMoreFolders, isLoadingMoreFiles]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const buildBreadcrumbs = async (folder: Folder) => {
    const crumbs: Folder[] = [];
    let current = folder;
    
    // Build breadcrumb trail by following parent folders
    while (current.parent_folder_id) {
      try {
        const parent = await foldersAPI.getFolder(current.parent_folder_id);
        crumbs.unshift(parent);
        current = parent;
      } catch (err) {
        break;
      }
    }
    
    setBreadcrumbs(crumbs);
  };

  const handleRefresh = () => {
    if (folderId) {
      loadFolderContent(folderId);
    }
  };

  const handleFolderDeleted = (deletedFolderId: string) => {
    // Remove the deleted folder from the subfolders list without refetching
    setSubfolders(prev => prev.filter(folder => folder._id !== deletedFolderId));
  };

  const handleCreateFolderSuccess = () => {
    handleRefresh();
  };

  const handleUploadSuccess = () => {
    handleRefresh();
  };

  const handleSearch = async (query: string) => {
    // Simple client-side search for now
    // In a real app, you'd want to implement server-side search
    setSearchQuery(query);
  };

  // Filter folders and files based on search query
  const filteredSubfolders = subfolders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get media files (images and videos) for gallery
  const mediaFiles = filteredFiles.filter(file => 
    file.file_type === 'image' || file.file_type === 'video'
  );

  // Media Gallery handlers
  const handleFileClick = (file: FileData) => {
    if (file.file_type === 'image' || file.file_type === 'video') {
      const mediaIndex = mediaFiles.findIndex(f => f._id === file._id);
      if (mediaIndex !== -1) {
        setGalleryCurrentIndex(mediaIndex);
        setShowMediaGallery(true);
      }
    }
  };

  const handleGalleryClose = () => {
    setShowMediaGallery(false);
  };

  const handleGalleryNavigate = (index: number) => {
    setGalleryCurrentIndex(index);
  };

  const handleBackToGallery = () => {
    navigate('/');
  };

  const handleBackNavigation = () => {
    if (currentFolder?.parent_folder_id) {
      navigate(`/folder/${currentFolder.parent_folder_id}`);
    } else {
      navigate('/');
    }
  };

  const handleFolderNavigation = (targetFolderId: string) => {
    navigate(`/folder/${targetFolderId}`);
  };

  // Multi-select handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedFolders(new Set());
      setSelectedFiles(new Set());
    }
  };

  const toggleFolderSelection = (folderId: string) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
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
    const allFolderIds = new Set(filteredSubfolders.map(f => f._id));
    const allFileIds = new Set(filteredFiles.map(f => f._id));
    setSelectedFolders(allFolderIds);
    setSelectedFiles(allFileIds);
  };

  const clearSelection = () => {
    setSelectedFolders(new Set());
    setSelectedFiles(new Set());
  };

  const getTotalSelected = () => selectedFolders.size + selectedFiles.size;

  // Bulk download
  const handleBulkDownload = async () => {
    const selectedFileData = files.filter(f => selectedFiles.has(f._id));
    
    try {
      // Try bulk download API first
      const fileIds = Array.from(selectedFiles);
      const downloadUrls = await filesAPI.bulkDownloadFiles(fileIds);
      
      // Download files using the URLs from bulk API
      for (const file of selectedFileData) {
        const downloadUrl = downloadUrls[file._id];
        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.original_filename || file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.log('Bulk download API not available, falling back to individual downloads');
      
      // Fallback to individual downloads
      for (const file of selectedFileData) {
        try {
          if (file.s3_url) {
            // Create a temporary link and click it
            const link = document.createElement('a');
            link.href = file.s3_url;
            link.download = file.original_filename || file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            // Use the API to get download URL
            const downloadUrl = await filesAPI.downloadFile(file._id);
            if (downloadUrl) {
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = file.original_filename || file.filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        } catch (downloadError) {
          console.error(`Failed to download ${file.filename}:`, downloadError);
        }
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Delete folders first
      for (const folderId of selectedFolders) {
        try {
          await foldersAPI.deleteFolder(folderId);
        } catch (error) {
          console.error(`Failed to delete folder ${folderId}:`, error);
        }
      }

      // Delete files
      for (const fileId of selectedFiles) {
        try {
          await filesAPI.deleteFile(fileId);
        } catch (error) {
          console.error(`Failed to delete file ${fileId}:`, error);
        }
      }

      // Refresh the folder content
      handleRefresh();
      
      // Clear selections
      setSelectedFolders(new Set());
      setSelectedFiles(new Set());
      setIsSelectionMode(false);
    } finally {
      setIsBulkDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Show loading state for initial load
  if (isLoading && !currentFolder) {
    return (
      <div className="min-h-screen surface-dark">
        <Header 
          onCreateFolder={() => setIsCreateModalOpen(true)} 
          showCreateButton={true}
        />
        <div className="pt-20 flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
            <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
            <span>Loading folder...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-dark">
      {/* Header */}
      <Header 
        onCreateFolder={() => setIsCreateModalOpen(true)} 
        showCreateButton={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackNavigation}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
              title={currentFolder?.parent_folder_id ? "Back to Parent Folder" : "Back to Gallery"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              <button
                onClick={handleBackToGallery}
                className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span>Gallery</span>
              </button>
              
              {breadcrumbs.map((crumb) => (
                <div key={crumb._id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <button
                    onClick={() => handleFolderNavigation(crumb._id)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
              
              {currentFolder && (
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <span className="text-white font-medium">{currentFolder.name}</span>
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isSelectionMode && getTotalSelected() > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{getTotalSelected()} selected</span>
                <button
                  onClick={handleBulkDownload}
                  className="text-gray-300 hover:text-white transition-colors bg-gray-800/20 backdrop-blur-sm py-2 px-3 rounded-lg font-semibold flex items-center gap-2 text-sm border border-gray-600/20 hover:bg-gray-700/30"
                  disabled={selectedFiles.size === 0}
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-gray-300 hover:text-red-400 transition-colors bg-red-500/10 backdrop-blur-sm py-2 px-3 rounded-lg font-semibold flex items-center gap-2 text-sm border border-red-500/20 hover:bg-red-500/20"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
            <button
              onClick={toggleSelectionMode}
              className={`text-gray-300 hover:text-white transition-colors bg-gray-800/20 backdrop-blur-sm py-2 px-4 rounded-lg font-semibold flex items-center gap-2 text-sm border border-gray-600/20 hover:bg-gray-700/30 ${
                isSelectionMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : ''
              }`}
            >
              {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
              {isSelectionMode ? 'Exit Select' : 'Select'}
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="text-gray-300 hover:text-white transition-colors bg-gray-800/20 backdrop-blur-sm py-2 px-4 rounded-lg font-semibold flex items-center gap-2 text-sm border border-gray-600/20 hover:bg-gray-700/30"
            >
              <UploadIcon size={16} />
              Upload Files
            </button>
          </div>
        </div>

        {/* Selection Mode Controls */}
        {isSelectionMode && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-600/20">
            <button
              onClick={selectAll}
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Clear Selection
            </button>
            <span className="text-gray-400 text-sm">
              {selectedFolders.size} folders, {selectedFiles.size} files selected
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search folders and files..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 pr-4 py-2 surface-alt rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 w-full transition-all"
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 backdrop-blur-sm border border-red-700/40 rounded-xl p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Content with infinite scroll */}
        <div 
          ref={scrollContainerRef}
          className="h-[calc(100vh-200px)] overflow-y-auto"
        >
          {filteredSubfolders.length === 0 && filteredFiles.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-700/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600/20">
                <Plus className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchQuery ? 'No matches found' : 'Empty folder'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'This folder is empty. Create a subfolder or upload some files to get started.'
                }
              </p>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-gray-300 hover:text-white transition-colors bg-gray-800/30 backdrop-blur-sm py-3 px-6 rounded-lg font-semibold flex items-center gap-2 border border-gray-600/20 hover:bg-gray-700/40"
                  >
                    <Plus size={20} />
                    Create Folder
                  </button>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-gray-300 hover:text-white transition-colors bg-gray-800/30 backdrop-blur-sm py-3 px-6 rounded-lg font-semibold flex items-center gap-2 border border-gray-600/20 hover:bg-gray-700/40"
                  >
                    <UploadIcon size={20} />
                    Upload Files
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Subfolders */}
              {filteredSubfolders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>Folders</span>
                    <span className="text-sm text-gray-400">({filteredSubfolders.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filteredSubfolders.map((folder) => (
                      <div key={folder._id} className="relative">
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <button
                              onClick={() => toggleFolderSelection(folder._id)}
                              className={`p-1 rounded border-2 transition-colors ${
                                selectedFolders.has(folder._id)
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'bg-gray-800/80 border-gray-600 text-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {selectedFolders.has(folder._id) ? (
                                <CheckSquare size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </div>
                        )}
                        <FolderCard
                          folder={folder}
                          onClick={() => handleFolderNavigation(folder._id)}
                          onDelete={() => handleFolderDeleted(folder._id)}
                          onUpdate={handleRefresh}
                        />
                      </div>
                    ))}
                  </div>
                  {isLoadingMoreFolders && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Files */}
              {filteredFiles.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>Files</span>
                    <span className="text-sm text-gray-400">({filteredFiles.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filteredFiles.map((file) => (
                      <div key={file._id} className="relative">
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <button
                              onClick={() => toggleFileSelection(file._id)}
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
                        <div onClick={() => handleFileClick(file)}>
                          <FileCard
                            file={file}
                            onRefresh={handleRefresh}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {isLoadingMoreFiles && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateFolderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateFolderSuccess}
          parentFolderId={folderId}
        />

        {folderId && isUploadModalOpen && (
          <div className="fixed inset-0 surface-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
            <FileUpload
              folderId={folderId}
              onSuccess={handleUploadSuccess}
              onClose={() => setIsUploadModalOpen(false)}
              isOpen={isUploadModalOpen}
            />
          </div>
        )}

        {/* Media Gallery */}
        {showMediaGallery && mediaFiles.length > 0 && (
          <MediaGallery
            files={mediaFiles}
            currentIndex={galleryCurrentIndex}
            onClose={handleGalleryClose}
            onNavigate={handleGalleryNavigate}
          />
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Selected Items"
          message={`Are you sure you want to delete ${selectedFolders.size} folder${selectedFolders.size !== 1 ? 's' : ''} and ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}? This action cannot be undone.`}
          confirmText={isBulkDeleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </div>
    </div>
  );
}; 