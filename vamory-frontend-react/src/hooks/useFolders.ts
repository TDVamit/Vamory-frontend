import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Folder, FoldersRequest } from '../types';
import { foldersAPI } from '../services/api';

interface UseFoldersResult {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  search: (query: string) => void;
  removeFolder: (folderId: string) => void;
}

interface UseFoldersOptions {
  useRootFolders?: boolean;
}

export const useFolders = (
  initialParams: FoldersRequest = {}, 
  options: UseFoldersOptions = {}
): UseFoldersResult => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [params, setParams] = useState<FoldersRequest>({
    per_page: 20,
    page: 1,
    ...initialParams,
  });
  
  // Use refs to avoid dependency issues
  const foldersRef = useRef<Folder[]>([]);
  const isLoadingRef = useRef(false);
  
  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [options.useRootFolders]);
  
  // Update refs when state changes
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);
  
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const loadFolders = async () => {
      if (isLoadingRef.current) {
        return;
      }
      
      const isLoadMore = params.page !== 1;
      setIsLoading(true);
      setError(null);

      try {
        // Use the new paginated API method
        const response = memoizedOptions.useRootFolders 
          ? await foldersAPI.getRootFolders(params)
          : await foldersAPI.getFoldersPaginated(params);
        const newFolders = response.folders || [];
        
        if (isLoadMore) {
          setFolders(prev => [...prev, ...newFolders]);
        } else {
          setFolders(newFolders);
        }
        
        // Use the pagination metadata to determine if there are more pages
        setHasMore(response.has_more || false);
        setCurrentPage(params.page || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, [params, memoizedOptions]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      setParams(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [hasMore]);

  const refresh = useCallback(() => {
    setParams(prev => ({ ...prev, page: 1 }));
    setFolders([]);
    setHasMore(true);
    setCurrentPage(1);
  }, []);

  const search = useCallback((query: string) => {
    setParams(prev => ({
      ...prev,
      search: query || undefined,
      page: 1,
    }));
    setFolders([]);
    setHasMore(true);
    setCurrentPage(1);
  }, []);

  const removeFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(folder => folder._id !== folderId));
  }, []);

  return {
    folders,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    search,
    removeFolder,
  };
}; 