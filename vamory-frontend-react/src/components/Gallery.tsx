import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, LogOut, User, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFolders } from '../hooks/useFolders';
import { FolderCard } from './FolderCard';
import { CreateFolderModal } from './CreateFolderModal';
import { AddFromGDriveModal } from './CreateFolderModal';
import { Header } from './Header';
import { UserRole } from '../types';
import React from 'react';
import { ActionDropdown } from './ActionDropdown';

export const Gallery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddFromGDriveOpen, setIsAddFromGDriveOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [carouselFolders, setCarouselFolders] = useState<any[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const autoPlayRef = useRef<number | null>(null);

  // Memoize the options to prevent recreating on every render
  const folderOptions = useMemo(() => ({
    useRootFolders: true
  }), []);

  // Memoize the initial params to prevent recreating on every render
  const initialParams = useMemo(() => ({
    limit: 20,
    include_size: true,
  }), []);

  const { folders, isLoading, error, hasMore, loadMore, refresh, search, removeFolder } = useFolders(
    initialParams,
    folderOptions
  );

  // Set carousel folders only from the initial load (not from search results)
  useEffect(() => {
    if (!searchQuery && folders.length > 0) {
      const foldersWithThumbnails = folders.filter(folder => folder.thumbnail_url).slice(0, 10);
      if (foldersWithThumbnails.length > 0) {
        setCarouselFolders(foldersWithThumbnails);
      }
    }
  }, [folders, searchQuery]);

  // Reset current slide when carousel folders change
  useEffect(() => {
    if (currentSlide >= carouselFolders.length) {
      setCurrentSlide(0);
    }
  }, [carouselFolders.length, currentSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && !isPausedByUser && carouselFolders.length > 1) {
      autoPlayRef.current = window.setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % carouselFolders.length);
      }, 2000); // Change slide every 2 seconds (was 4 seconds)
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isPausedByUser, carouselFolders.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % carouselFolders.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + carouselFolders.length) % carouselFolders.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsPausedByUser(!isPausedByUser);
    setIsAutoPlaying(!isPausedByUser);
  };

  // Debounced search - but don't reset carousel
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      search(searchQuery);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, search]);

  // Infinite scroll observer - disable during search
  const lastFolderElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || searchQuery) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchQuery) {
        loadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, loadMore, searchQuery]);

  const handleCreateFolderSuccess = () => {
    refresh(); // Refresh the folder list
  };

  const handleAddFromGDriveSuccess = () => {
    refresh();
  };

  const handleFolderClick = (folderId: string) => {
    if (folderId) {
      navigate(`/folder/${folderId}`);
    } else {
      console.error('Tried to navigate to undefined folderId');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleFolderDeleted = (deletedFolderId: string) => {
    // Remove the deleted folder from both carousel and main folders list
    setCarouselFolders(prev => prev.filter(folder => folder._id !== deletedFolderId));
    // Remove from main folders list without refetching
    removeFolder(deletedFolderId);
  };

  const canCreateFolder = user && (
    user.user_role === UserRole.super_admin ||
    user.user_role === UserRole.admin ||
    user.user_role === UserRole.user
  );

  return (
    <div className="min-h-screen surface-dark overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section - Folder Carousel - Full Width */}
      <div className="relative h-[60vh]">
        <section 
          className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden"
          style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)' }}
          onMouseEnter={() => !isPausedByUser && setIsAutoPlaying(false)}
          onMouseLeave={() => !isPausedByUser && setIsAutoPlaying(true)}
        >
          {carouselFolders.length > 0 ? (
            <div className="h-full relative">
              {/* Carousel Images */}
              <div className="absolute inset-0 h-full w-full min-w-full max-w-none">
                {carouselFolders.map((folder, index) => (
                  <div
                    key={folder._id}
                    className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => handleFolderClick(folder._id)}
                  >
                    {/* Full Width Background Image */}
                    <img
                      src={folder.thumbnail_url}
                      alt={folder.name}
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-60"
                    />
                    
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/30"></div>
                    
                    {/* Main Folder Name Display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-8 group/folder">
                        {/* Details above name, only visible on hover */}
                        <div className="flex items-center justify-center gap-6 text-lg text-white/80 mb-2 opacity-0 group-hover/folder:opacity-100 transition-opacity duration-300">
                          <span>{folder.file_count || 0} files</span>
                          {folder.subfolder_count ? (
                            <>
                              <span>•</span>
                              <span>{folder.subfolder_count} folders</span>
                            </>
                          ) : null}
                          {folder.shared_by_name && (
                            <span className="relative group/share flex-shrink-0">
                              <Users className="w-7 h-7 text-black inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 px-3 py-1 rounded bg-black text-white text-xs opacity-0 group-hover/share:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-lg" style={{top: '100%', minWidth: 'max-content'}}>
                                Shared by {folder.shared_by_name}
                              </span>
                            </span>
                          )}
                        </div>
                        {/* Folder name below, always visible */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-wide">
                          {folder.name}
                        </h1>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Fallback when no folders with thumbnails: show default image on black background
            <div className="h-full w-full flex flex-col items-center justify-center bg-black">
              <img src="/VD Logo Funky.png" alt="Vamory Default" className="w-32 h-32 object-contain mb-6" />
              <div className="text-2xl font-light text-gray-300 mb-2">Welcome to Vamory</div>
              <div className="text-gray-500 mb-2">Upload images to see them in the carousel</div>
            </div>
          )}
          {/* Always show the search bar at the bottom of the carousel section */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 flex items-end z-30"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.8) 25%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0) 100%)',
            }}
          >
            <div className="w-full p-6">
              {/* Search Bar with Glass Effect */}
              <div className="max-w-2xl mx-auto">
                <div className="relative backdrop-blur-md bg-white/10 rounded-xl border border-gray-600/30">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search folders..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 rounded-xl text-lg"
                  />
                </div>
              </div>
              {/* Slide Indicators */}
              {carouselFolders.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {carouselFolders.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all backdrop-blur-sm border ${
                        index === currentSlide 
                          ? 'bg-gray-300 w-8 border-gray-300/50' 
                          : 'bg-gray-600/50 hover:bg-gray-500/70 w-2 border-gray-600/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12 pt-20 overflow-x-hidden">
        {error && (
          <div className="mb-6 bg-red-900/30 backdrop-blur-sm border border-red-700/40 rounded-xl p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {folders.length === 0 && !isLoading && !error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600/20">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-light text-gray-300 mb-2">
              {searchQuery ? 'No folders found' : 'No folders yet'}
            </h3>
            <p className="text-gray-500 mb-8">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first folder to get started'
              }
            </p>
            {!searchQuery && canCreateFolder && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 mx-auto text-lg font-medium bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20 hover:bg-gray-700/40"
              >
                <Plus size={20} />
                Create Your First Folder
              </button>
            )}
          </div>
        ) : (
          <React.Fragment>
            {/* All Folders Grid */}
            {folders.length > 0 && (
              <div className="mb-12">
                <div className="flex flex-row items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-light text-white mb-0">
                    {searchQuery ? `Search Results (${folders.length})` : 'All Folders'}
                  </h3>
                  <ActionDropdown
                    options={[
                      {
                        label: 'Create Folder',
                        onClick: () => setIsCreateModalOpen(true),
                        icon: <Plus size={16} />,
                      },
                      {
                        label: 'Add from Google Drive',
                        onClick: () => setIsAddFromGDriveOpen(true),
                        icon: <Plus size={16} />,
                      },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-6">
                  {folders.map((folder, index) => (
                    <div
                      key={folder._id}
                      ref={index === folders.length - 1 ? lastFolderElementRef : null}
                      className="animate-fade-in"
                    >
                      <FolderCard
                        folder={folder}
                        onClick={() => handleFolderClick(folder._id)}
                        onDelete={() => handleFolderDeleted(folder._id)}
                        onUpdate={refresh}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-400 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/20">
                  <div className="w-5 h-5 border border-gray-500 border-t-gray-300 rounded-full animate-spin" />
                  <span>{searchQuery ? 'Searching folders...' : 'Loading folders...'}</span>
                </div>
              </div>
            )}
          </React.Fragment>
        )}

        {/* Load more trigger (hidden, used for intersection observer) */}
        <div ref={loadMoreRef} className="h-1" />
      </main>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateFolderSuccess}
      />
      <AddFromGDriveModal
        isOpen={isAddFromGDriveOpen}
        onClose={() => setIsAddFromGDriveOpen(false)}
        onSuccess={handleAddFromGDriveSuccess}
      />
    </div>
  );
}; 