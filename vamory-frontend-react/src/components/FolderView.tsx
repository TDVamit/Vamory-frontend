import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Upload as UploadIcon, Home, ChevronRight, File, Download, Trash2, CheckSquare, Square, Folder as FolderIcon, Sparkles } from 'lucide-react';
import { foldersAPI, filesAPI, aiSearchAPI } from '../services/api';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { CreateFolderModal } from './CreateFolderModal';
import { FileUpload } from './FileUpload';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import { MediaGallery } from './MediaGallery';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import type { Folder as FolderType, FileData } from '../types';
import { ActionDropdown } from './ActionDropdown';
import { AISearchToggle } from './AISearchToggle';

export const FolderView = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [subfolders, setSubfolders] = useState<FolderType[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderType[]>([]);
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
  const [isAISearchEnabled, setIsAISearchEnabled] = useState(true); // Default to enabled
  const [aiSearchResults, setAiSearchResults] = useState<{ categories: Record<string, FileData[]> } | null>(null);
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  const [showAISearchGallery, setShowAISearchGallery] = useState(false);
  const [aiSearchGalleryIndex, setAiSearchGalleryIndex] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Long-press logic for mobile selection
  const longPressTimeout = useRef<number | null>(null);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Long-press handlers for mobile selection
  const handleFolderTouchStart = (folderId: string) => {
    if (!isTouchDevice) return;
    longPressTimeout.current = window.setTimeout(() => {
      if (!isSelectionMode) setIsSelectionMode(true);
      toggleFolderSelection(folderId);
    }, 500);
  };
  const handleFolderTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleFileTouchStart = (fileId: string) => {
    if (!isTouchDevice) return;
    longPressTimeout.current = window.setTimeout(() => {
      if (!isSelectionMode) setIsSelectionMode(true);
      toggleFileSelection(fileId);
    }, 500);
  };
  const handleFileTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const { user } = useAuth();
  const userRole = user?.user_role;
  const canCreateFolder = userRole === UserRole.super_admin || userRole === UserRole.admin || userRole === UserRole.user;
  const canUpload = userRole === UserRole.super_admin || userRole === UserRole.admin || userRole === UserRole.user || userRole === UserRole.editor;

  useEffect(() => {
    if (folderId) {
      loadFolderContent(folderId);
    }
    // Reset selection state and exit selection mode on folder change
    setIsSelectionMode(false);
    setSelectedFolders(new Set());
    setSelectedFiles(new Set());
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

  const buildBreadcrumbs = async (folder: FolderType) => {
    const crumbs: FolderType[] = [];
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

  const handleFileDeleted = (deletedFileId: string) => {
    setFiles(prev => prev.filter(file => file._id !== deletedFileId));
  };

  const handleCreateFolderSuccess = () => {
    handleRefresh();
  };

  const handleUploadSuccess = async () => {
    handleRefresh();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Only search when user finishes typing (after 1 second of no input)
    const newTimeout = window.setTimeout(async () => {
      if (query.trim()) {
        if (isAISearchEnabled && folderId) {
          // Use AI search within the current folder
          setIsAISearchLoading(true);
          try {
            const results = await aiSearchAPI.search(query, folderId);
            setAiSearchResults(results);
          } catch (error) {
            console.error('AI search failed:', error);
            // Fallback to regular search - just filter existing files
            setAiSearchResults(null);
          } finally {
            setIsAISearchLoading(false);
          }
        } else {
          // Use regular search - filter existing files
          setAiSearchResults(null);
        }
      } else {
        // Clear search
        setAiSearchResults(null);
      }
    }, 1000); // Wait 1 second for user to finish typing
    
    setSearchTimeout(newTimeout);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear the timeout and search immediately
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      const query = searchQuery.trim();
      if (query) {
        if (isAISearchEnabled && folderId) {
          // Use AI search within the current folder
          setIsAISearchLoading(true);
          aiSearchAPI.search(query, folderId)
            .then(results => {
              setAiSearchResults(results);
            })
            .catch(error => {
              console.error('AI search failed:', error);
              // Fallback to regular search - just filter existing files
              setAiSearchResults(null);
            })
            .finally(() => {
              setIsAISearchLoading(false);
            });
        } else {
          // Use regular search - filter existing files
          setAiSearchResults(null);
        }
      } else {
        // Clear search
        setAiSearchResults(null);
      }
    }
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

  // AI Search Gallery handlers
  const handleAISearchFileClick = (file: FileData) => {
    if (file.file_type === 'image' || file.file_type === 'video') {
      // Flatten all AI search results into a single array
      const allAIFiles = Object.values(aiSearchResults?.categories || {}).flat();
      const mediaFiles = allAIFiles.filter(f => f.file_type === 'image' || f.file_type === 'video');
      const mediaIndex = mediaFiles.findIndex(f => f._id === file._id);
      if (mediaIndex !== -1) {
        setAiSearchGalleryIndex(mediaIndex);
        setShowAISearchGallery(true);
      }
    }
  };

  const handleAISearchGalleryClose = () => {
    setShowAISearchGallery(false);
  };

  const handleAISearchGalleryNavigate = (index: number) => {
    setAiSearchGalleryIndex(index);
  };



  const handleBackToGallery = () => {
    navigate('/');
  };

  // Replace handleBackNavigation with logic to go to previous breadcrumb or gallery
  const handleBackNavigation = () => {
    if (breadcrumbs.length > 0) {
      // Go to the last breadcrumb (previous folder)
      const prev = breadcrumbs[breadcrumbs.length - 1];
      navigate(`/folder/${prev._id}`);
    } else {
      // No parent, go to gallery
      navigate('/');
    }
  };

  const handleFolderNavigation = (targetFolderId: string) => {
    if (targetFolderId) {
      navigate(`/folder/${targetFolderId}`);
    } else {
      console.error('Tried to navigate to undefined targetFolderId');
    }
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


  const getTotalSelected = () => selectedFolders.size + selectedFiles.size;

  // Bulk download
  const handleBulkDownload = async () => {
    const selectedFileData = files.filter(f => selectedFiles.has(f._id));
    for (const file of selectedFileData) {
      try {
        const response = await filesAPI.downloadFile(file._id);
        if (response && response.download_url) {
          const link = document.createElement('a');
          link.href = response.download_url;
          link.download = response.filename || file.original_filename || file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        // Add a delay between downloads to avoid browser blocking
        await new Promise(res => setTimeout(res, 700));
      } catch (downloadError) {
        console.error(`Failed to download ${file.filename}:`, downloadError);
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Filter out shared folders and files
      const nonSharedFolders = Array.from(selectedFolders).filter(folderId => {
        const folder = subfolders.find(f => f._id === folderId);
        return folder && !folder.shared_by_name; // Only delete if not shared by others
      });
      
      const nonSharedFiles = Array.from(selectedFiles).filter(fileId => {
        const file = files.find(f => f._id === fileId);
        return file && !currentFolder?.shared_by_name; // Only delete if current folder is not shared by others
      });

      // Delete non-shared folders first
      for (const folderId of nonSharedFolders) {
        try {
          await foldersAPI.deleteFolder(folderId);
        } catch (error) {
          console.error(`Failed to delete folder ${folderId}:`, error);
        }
      }

      // Delete non-shared files
      for (const fileId of nonSharedFiles) {
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

  // Helper function to truncate folder names
  const truncateName = (name: string, maxLength = 12) =>
    name.length > maxLength ? name.slice(0, maxLength - 1) + '…' : name;

  // Show loading state for initial load
  if (isLoading && !currentFolder) {
    return (
      <div className="min-h-screen surface-dark">
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
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-2 w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={handleBackNavigation}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
              title={currentFolder?.parent_folder_id ? "Back to Parent Folder" : "Back to Gallery"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm min-w-0 overflow-x-auto">
              <button
                onClick={handleBackToGallery}
                className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span>Gallery</span>
              </button>
              {breadcrumbs.map((crumb) => (
                <>
                  <ChevronRight key={`chevron-${crumb._id}`} className="w-4 h-4 text-gray-500" />
                  <button
                    key={crumb._id}
                    onClick={() => handleFolderNavigation(crumb._id)}
                    className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors px-1 truncate max-w-[100px]"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                </>
              ))}
              {currentFolder && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-white font-medium overflow-hidden whitespace-nowrap truncate max-w-[100px] inline-block" title={currentFolder.name}>
                    {truncateName(currentFolder.name)}
                  </span>
                </>
              )}
            </nav>
          </div>
          {/* Selection mode toggle checkbox and ActionDropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center justify-center w-8 h-8 rounded border border-gray-600/20 bg-gray-800/20 hover:bg-gray-700/30 transition-colors ${isSelectionMode ? 'text-blue-400 border-blue-400' : 'text-gray-300'}`}
              title={isSelectionMode ? 'Exit Selection Mode' : 'Enable Selection Mode'}
              aria-pressed={isSelectionMode}
              style={{ minWidth: 32, minHeight: 32 }}
            >
              {isSelectionMode ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <ActionDropdown
              options={[
                ...(isSelectionMode && getTotalSelected() > 0 ? [
                  ...(selectedFiles.size > 0 ? [{
                    label: 'Download Selected',
                    onClick: handleBulkDownload,
                    icon: <Download size={16} />,
                  }] : []),
                  // Only show delete option if there are non-shared items selected
                  ...(Array.from(selectedFolders).some(folderId => {
                    const folder = subfolders.find(f => f._id === folderId);
                    return folder && !folder.shared_by_name;
                  }) || (selectedFiles.size > 0 && !currentFolder?.shared_by_name) ? [{
                    label: 'Delete Selected',
                    onClick: () => setShowDeleteDialog(true),
                    icon: <Trash2 size={16} />,
                  }] : []),
                ] : []),
                // Only show create/upload options if current folder is not shared by others
                ...(!currentFolder?.shared_by_name ? [
                  {
                    label: 'Create Folder',
                    onClick: () => setIsCreateModalOpen(true),
                    icon: <Plus size={16} />,
                  },
                  {
                    label: 'Upload Files',
                    onClick: () => setIsUploadModalOpen(true),
                    icon: <UploadIcon size={16} />,
                  },
                ] : []),
              ]}
              className="ml-2 flex-shrink-0"
            />
          </div>
        </div>
        {/* Selection Mode Actions Row */}
        {isSelectionMode && getTotalSelected() > 0 && (
          <div className="flex items-center gap-2 py-2 mb-2 overflow-x-auto w-full">
            {/* Remove Exit Select button from here, as it's now in the top bar */}
            <button
              onClick={selectAll}
              className="text-gray-300 hover:text-white transition-colors bg-gray-800/20 backdrop-blur-sm p-2 rounded-lg flex items-center border border-gray-600/20 hover:bg-gray-700/30"
              title="Select All"
            >
              <CheckSquare size={18} />
            </button>
            {/* Removed Clear Selection (Trash2) button */}
            <span className="flex items-center gap-2 text-gray-400 text-base ml-2">
              {selectedFolders.size > 0 && (
                <span className="flex items-center gap-1"><FolderIcon className="w-4 h-4" />{selectedFolders.size}</span>
              )}
              {selectedFiles.size > 0 && (
                <span className="flex items-center gap-1"><File className="w-4 h-4" />{selectedFiles.size}</span>
              )}
            </span>
          </div>
        )}

                         {/* Search, Create Folder, and Upload Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6 w-full max-w-2xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex items-center overflow-hidden rounded-lg flex-1">
              <Search className="absolute left-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search folders and files..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onKeyPress={handleSearchKeyPress}
                className="flex-1 pl-10 pr-4 py-2 surface-alt text-white placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-0 transition-all"
              />
            </div>
            <AISearchToggle
              isEnabled={isAISearchEnabled}
              onToggle={setIsAISearchEnabled}
              className="rounded"
            />
          </div>
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
          {/* AI Search Results */}
          {isAISearchLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
                <div className="w-5 h-5 border border-gray-500 border-t-gray-300 rounded-full animate-spin" />
                <span>AI searching...</span>
              </div>
            </div>
          )}
          
          {aiSearchResults && !isAISearchLoading && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-semibold text-white mb-0">
                  AI Search Results
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by AI</span>
                </div>
              </div>
              {Object.entries(aiSearchResults.categories).map(([category, files]) => (
                <div key={category} className="mb-8">
                  <h4 className="text-md font-medium text-gray-300 mb-4 capitalize">
                    {category} ({files.length})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-8">
                    {files.map((file) => (
                      <div key={file._id} className="relative">
                        <div onClick={() => handleAISearchFileClick(file)}>
                          <FileCard
                            file={file}
                            onRefresh={() => handleFileDeleted(file._id)}
                            isPublic={!!currentFolder?.shared_by_name}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredSubfolders.length === 0 && filteredFiles.length === 0 && !isLoading && !aiSearchResults && !isAISearchLoading ? (
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
              {!searchQuery && canCreateFolder && !currentFolder?.shared_by_name && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-gray-300 hover:text-white transition-colors bg-gray-800/30 backdrop-blur-sm py-3 px-6 rounded-lg font-semibold flex items-center gap-2 border border-gray-600/20 hover:bg-gray-700/40"
                  >
                    <Plus size={20} />
                    Create Folder
                  </button>
                  {canUpload && (
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-gray-300 hover:text-white transition-colors bg-gray-800/30 backdrop-blur-sm py-3 px-6 rounded-lg font-semibold flex items-center gap-2 border border-gray-600/20 hover:bg-gray-700/40"
                    >
                      <UploadIcon size={20} />
                      Upload Files
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 overflow-x-hidden">
              {/* Subfolders */}
              {filteredSubfolders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>Folders</span>
                    <span className="text-sm text-gray-400">({filteredSubfolders.length})</span>
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-8">
                    {filteredSubfolders.map((folder) => (
                      <div
                        key={folder._id}
                        className="relative"
                        onTouchStart={() => handleFolderTouchStart(folder._id)}
                        onTouchEnd={handleFolderTouchEnd}
                        onTouchCancel={handleFolderTouchEnd}
                      >
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
                          isPublic={!!folder.shared_by_name} // Hide delete options for folders shared by others
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
                    {isSelectionMode && (
                      <button
                        onClick={selectAll}
                        className="p-1 rounded border-2 transition-colors mr-2 bg-gray-800/80 border-gray-600 text-gray-300 hover:border-gray-400 flex items-center justify-center"
                        title="Select All Files"
                      >
                        <Square size={18} />
                      </button>
                    )}
                    <span>Files</span>
                    <span className="text-sm text-gray-400">({filteredFiles.length})</span>
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-8">
                    {filteredFiles.map((file) => (
                      <div
                        key={file._id}
                        className="relative"
                        onTouchStart={() => handleFileTouchStart(file._id)}
                        onTouchEnd={handleFileTouchEnd}
                        onTouchCancel={handleFileTouchEnd}
                      >
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
                            onRefresh={() => handleFileDeleted(file._id)}
                            isPublic={!!currentFolder?.shared_by_name} // Hide delete options for files in folders shared by others
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
        {folderId && isUploadModalOpen && canUpload && (
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
            onFileDeleted={handleFileDeleted}
          />
        )}

        {/* AI Search Media Gallery */}
        {showAISearchGallery && aiSearchResults && (
          <MediaGallery
            files={Object.values(aiSearchResults.categories).flat().filter(f => f.file_type === 'image' || f.file_type === 'video')}
            currentIndex={aiSearchGalleryIndex}
            onClose={handleAISearchGalleryClose}
            onNavigate={handleAISearchGalleryNavigate}
            isPublic={!!currentFolder?.shared_by_name}
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