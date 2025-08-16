import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search,  File, CheckSquare, Square, Folder as FolderIcon, Plus, Download, AlertTriangle, Sparkles, RotateCcw } from 'lucide-react';
import { publicFoldersAPI, aiSearchAPI } from '../services/api';
import { AISearchToggle } from './AISearchToggle';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { MediaGallery } from './MediaGallery';

import type { Folder as FolderType, FileData, PaginatedResponse } from '../types';


// Unauthorized UI
const UnauthorizedPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-4">
    <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-md w-full">
      <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2 text-red-200">Unauthorized</h1>
      <p className="text-gray-300 mb-4 text-center">You do not have permission to view this folder.<br/>Please ask the owner to grant you access.</p>
      <button
        onClick={() => window.location.href = '/'}
        className="mt-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow"
      >
        Go to Home
      </button>
    </div>
  </div>
);

export const PublicFolderView = () => {
  const [searchParams] = useSearchParams();
  const publicToken = searchParams.get('token') || '';
  const folderId = searchParams.get('folder_id') || '';
  const navigate = useNavigate();

  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [subfolders, setSubfolders] = useState<FolderType[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);

  const [_foldersPage, setFoldersPage] = useState(1);
  const [filesPage, setFilesPage] = useState(1);
  const [_hasMoreFolders, setHasMoreFolders] = useState(true);
  const [hasMoreFiles, setHasMoreFiles] = useState(true);

  const [isLoadingMoreFiles, setIsLoadingMoreFiles] = useState(false);
  const [isAISearchEnabled, setIsAISearchEnabled] = useState(true); // Default to enabled
  const [aiSearchResults, setAiSearchResults] = useState<{ categories: Record<string, FileData[]> } | null>(null);
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  const [isAIReloading, setIsAIReloading] = useState(false);
  const [showAISearchGallery, setShowAISearchGallery] = useState(false);
  const [aiSearchGalleryIndex, setAiSearchGalleryIndex] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimeout = useRef<number | null>(null);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const [unauthorized, setUnauthorized] = useState(false);
  const folderNavStack = useRef<string[]>([]);

  // On folder navigation, push current folderId to stack
  useEffect(() => {
    if (folderId) {
      // Only push if not the same as the last
      if (folderNavStack.current.length === 0 || folderNavStack.current[folderNavStack.current.length - 1] !== folderId) {
        folderNavStack.current.push(folderId);
      }
    }
  }, [folderId]);

  // Fetch folder, subfolders, and files
  const loadFolderContent = async (id: string) => {
    setIsLoading(true);
    setError('');
    setFoldersPage(1);
    setFilesPage(1);
    setHasMoreFolders(true);
    setHasMoreFiles(true);
    setUnauthorized(false);
    try {
      // Fetch folder details and subfolders
      const folderRes = await publicFoldersAPI.getPublicFolder(publicToken, id);
      if ('data' in folderRes && 'meta' in folderRes) {
        const folderData = folderRes.data as FolderType[];
        // If folderData is empty, still set currentFolder to a minimal object
        if (folderData.length > 0) {
          setCurrentFolder(folderData[0]);
          setSubfolders(Array.isArray(folderData) ? folderData : []);
        } else {
          // Fallback: set minimal folder object
          setCurrentFolder({
            _id: id,
            name: 'Unnamed Folder',
            parent_folder_id: undefined,
            storage_type: 'STANDARD_IA',
            owner_id: '',
            created_at: '',
            updated_at: '',
            is_shared: false,
            status: 'active',
          });
          setSubfolders([]);
        }
      } else {
        setCurrentFolder(folderRes);
        setSubfolders(Array.isArray(folderRes.subfolders) ? folderRes.subfolders : []);
      }
      // Fetch files
      const filesRes: PaginatedResponse<FileData> = await publicFoldersAPI.getPublicFolderFiles(publicToken, id, { page: 1, per_page: 20 });
      setFiles(filesRes.data);
      setHasMoreFiles(filesRes.meta.has_next);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUnauthorized(true);
        setCurrentFolder(null);
        setFiles([]);
        setSubfolders([]);
        setError('');
      } else {
        setError(err?.response?.data?.detail || 'Folder not found or access denied.');
        setCurrentFolder(null);
        setFiles([]);
        setSubfolders([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicToken && folderId) {
      loadFolderContent(folderId);
    }
    setIsSelectionMode(false);
    setSelectedFolders(new Set());
    setSelectedFiles(new Set());
  }, [publicToken, folderId]);

  // Infinite scroll for files (folders are usually not paginated in public API)
  const loadMoreFiles = async () => {
    if (!folderId || isLoadingMoreFiles || !hasMoreFiles) return;
    setIsLoadingMoreFiles(true);
    try {
      const nextPage = filesPage + 1;
      const filesRes: PaginatedResponse<FileData> = await publicFoldersAPI.getPublicFolderFiles(publicToken, folderId, { page: nextPage, per_page: 20 });
      if (filesRes.data.length > 0) {
        setFiles(prev => [...prev, ...filesRes.data]);
        setFilesPage(nextPage);
        setHasMoreFiles(filesRes.meta.has_next);
      } else {
        setHasMoreFiles(false);
      }
    } catch (err) {
      setHasMoreFiles(false);
    } finally {
      setIsLoadingMoreFiles(false);
    }
  };

  // Scroll detection for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    if (scrollPercentage > 0.8 && hasMoreFiles && !isLoadingMoreFiles) {
      loadMoreFiles();
    }
  }, [hasMoreFiles, isLoadingMoreFiles]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Selection and navigation logic (same as FolderView)
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
  // Back navigation: use stack fallback
  const handleBackNavigation = () => {
    if (folderNavStack.current.length > 1) {
      // Pop current
      folderNavStack.current.pop();
      // Go to previous
      const prevId = folderNavStack.current[folderNavStack.current.length - 1];
      if (prevId) {
        navigate(`/shared/folder?token=${publicToken}&folder_id=${prevId}`);
        return;
      }
    }
    // Fallback to public root
    navigate(`/shared?token=${publicToken}`);
  };
  const handleFolderNavigation = (targetFolderId: string) => {
    if (targetFolderId) {
      navigate(`/shared/folder?token=${publicToken}&folder_id=${targetFolderId}`);
    }
  };
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
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

  // Search and filter
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
  const filteredSubfolders = subfolders.filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter(file => file.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  const mediaFiles = filteredFiles.filter(file => file.file_type === 'image' || file.file_type === 'video');
  const handleFileClick = (file: FileData) => {
    if (file.file_type === 'image' || file.file_type === 'video') {
      const mediaIndex = mediaFiles.findIndex(f => f._id === file._id);
      if (mediaIndex !== -1) {
        setGalleryCurrentIndex(mediaIndex);
        setShowMediaGallery(true);
      }
    }
  };
  const handleGalleryClose = () => setShowMediaGallery(false);
  const handleGalleryNavigate = (index: number) => setGalleryCurrentIndex(index);

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

  // AI Search Reload function
  const handleAIReload = async () => {
    setIsAIReloading(true);
    try {
      await aiSearchAPI.reload();
      // If there's a current search query, re-run the search
      if (searchQuery.trim()) {
        const results = await aiSearchAPI.search(searchQuery, folderId);
        setAiSearchResults(results);
      }
    } catch (error) {
      console.error('AI reload failed:', error);
    } finally {
      setIsAIReloading(false);
    }
  };
  const truncateName = (name: string | undefined | null, maxLength = 12) =>
    typeof name === 'string' ? (name.length > maxLength ? name.slice(0, maxLength - 1) + '…' : name) : '';

  // Download handler for public files (single and bulk)
  const handleBulkDownload = async () => {
    const selectedFileData = files.filter(f => selectedFiles.has(f._id));
    for (const file of selectedFileData) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'}/api/v1/files/${file._id}/public/download`);
        const data = await response.json();
        const downloadUrl = data.download_url;
        const filename = data.filename || file.filename || file.original_filename || file._id;
        if (!downloadUrl) {
          console.error(`No download_url for file ${file.filename}`);
          continue;
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(res => setTimeout(res, 700));
      } catch (downloadError) {
        console.error(`Failed to download ${file.filename}:`, downloadError);
      }
    }
  };

  // For single file download, pass a download handler to FileCard
  const handleSingleDownload = async (file: FileData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'}/api/v1/files/${file._id}/public/download`);
      const data = await response.json();
      const downloadUrl = data.download_url;
      const filename = data.filename || file.filename || file.original_filename || file._id;
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

  // Show loading state for initial load
  if (unauthorized) {
    return <UnauthorizedPage />;
  }
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

  // Always show navigation bar if currentFolder is not null
  return (
    <div className="min-h-screen surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Navigation */}
        {currentFolder && (
          <div className="flex items-center justify-between mb-2 w-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Always show back button if currentFolder exists */}
              <button
                onClick={handleBackNavigation}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
                title={currentFolder.parent_folder_id ? "Back to Parent Folder" : "Back to Shared Root"}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {/* Breadcrumbs (always show current folder name) */}
              <nav className="flex items-center gap-2 text-sm min-w-0 overflow-x-auto">
                <span className="text-xs sm:text-sm text-white font-medium overflow-hidden whitespace-nowrap truncate max-w-[100px] inline-block" title={currentFolder.name}>
                  {truncateName(currentFolder.name)}
                </span>
              </nav>
            </div>
            {/* Selection mode toggle checkbox (no ActionDropdown for public) */}
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
            </div>
          </div>
        )}
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
              {selectedFolders.size > 0 && (
                <span className="flex items-center gap-1"><FolderIcon className="w-4 h-4" />{selectedFolders.size}</span>
              )}
              {selectedFiles.size > 0 && (
                <span className="flex items-center gap-1"><File className="w-4 h-4" />{selectedFiles.size}</span>
              )}
            </span>
            {/* Download Selected button for public view */}
            {selectedFiles.size > 0 && (
              <button
                onClick={handleBulkDownload}
                className="text-gray-300 hover:text-white transition-colors bg-gray-800/30 py-1 px-2 rounded-lg font-normal flex items-center gap-1 border border-gray-600/20 hover:bg-gray-700/40 text-xs sm:text-sm h-8 min-h-0"
                title="Download Selected Files"
              >
                <Download size={14} />
                <span className="truncate">Download</span>
              </button>
            )}
            {/* No delete or bulk delete button in public view */}
          </div>
        )}
                         {/* Search */}
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white mb-0">
                    AI Search Results
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Powered by AI</span>
                  </div>
                </div>
                <button
                  onClick={handleAIReload}
                  disabled={isAIReloading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 bg-gray-800/20 text-gray-300 border border-gray-600/30 hover:bg-gray-700/30 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reload AI Search Index"
                >
                  <RotateCcw className={`w-4 h-4 ${isAIReloading ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">
                    {isAIReloading ? 'Reloading...' : 'Reload'}
                  </span>
                </button>
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
                            isPublic={true}
                            publicToken={publicToken}
                            onDownload={() => handleSingleDownload(file)}
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
                  : 'This folder is empty.'}
              </p>
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
                          isPublic={true}
                        />
                      </div>
                    ))}
                  </div>
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
                            isPublic={true}
                            publicToken={publicToken}
                            onDownload={() => handleSingleDownload(file)}
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
        {/* Media Gallery */}
        {showMediaGallery && mediaFiles.length > 0 && (
          <MediaGallery
            files={mediaFiles}
            currentIndex={galleryCurrentIndex}
            onClose={handleGalleryClose}
            onNavigate={handleGalleryNavigate}
            isPublic={true}
            publicToken={publicToken}
          />
        )}

        {/* AI Search Media Gallery */}
        {showAISearchGallery && aiSearchResults && (
          <MediaGallery
            files={Object.values(aiSearchResults.categories).flat().filter(f => f.file_type === 'image' || f.file_type === 'video')}
            currentIndex={aiSearchGalleryIndex}
            onClose={handleAISearchGalleryClose}
            onNavigate={handleAISearchGalleryNavigate}
            isPublic={true}
            publicToken={publicToken}
          />
        )}
      </div>
    </div>
  );
}; 