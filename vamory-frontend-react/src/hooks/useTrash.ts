import { useState, useEffect, useCallback } from 'react';
import { filesAPI } from '../services/api';
import type { FileData, PaginatedResponse } from '../types';

interface UseTrashOptions {
  initialPage?: number;
  initialPerPage?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
}

export const useTrash = (options: UseTrashOptions = {}) => {
  const {
    initialPage = 1,
    initialPerPage = 20,
    initialSortBy = 'deleted_at',
    initialSortOrder = 'desc'
  } = options;

  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadFiles = useCallback(async (page = currentPage, perPageCount = perPage) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: PaginatedResponse<FileData> = await filesAPI.getTrashFiles({
        page,
        per_page: perPageCount,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      setFiles(response.data);
      setTotalCount(response.meta.total_count);
      setHasMore(response.meta.has_next);
      setCurrentPage(response.meta.current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash files');
      console.error('Error loading trash files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, sortBy, sortOrder]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadFiles(currentPage + 1, perPage);
    }
  }, [hasMore, isLoading, currentPage, perPage, loadFiles]);

  const refresh = useCallback(() => {
    loadFiles(1, perPage);
  }, [loadFiles, perPage]);

  const restoreFile = useCallback(async (fileId: string) => {
    setIsRestoring(fileId);
    try {
      await filesAPI.restoreFile(fileId);
      // Remove the file from the list
      setFiles(prev => prev.filter(file => file._id !== fileId));
      setTotalCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore file');
      console.error('Error restoring file:', err);
      return false;
    } finally {
      setIsRestoring(null);
    }
  }, []);

  const permanentDeleteFile = useCallback(async (fileId: string) => {
    setIsDeleting(fileId);
    try {
      await filesAPI.permanentDeleteFile(fileId);
      // Remove the file from the list
      setFiles(prev => prev.filter(file => file._id !== fileId));
      setTotalCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to permanently delete file');
      console.error('Error permanently deleting file:', err);
      return false;
    } finally {
      setIsDeleting(null);
    }
  }, []);

  const updateSort = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    loadFiles(1, perPage);
  }, [loadFiles, perPage]);

  const updatePerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    loadFiles(1, newPerPage);
  }, [loadFiles]);

  // Load files on mount and when dependencies change
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    isLoading,
    error,
    currentPage,
    perPage,
    sortBy,
    sortOrder,
    totalCount,
    hasMore,
    isRestoring,
    isDeleting,
    loadFiles,
    loadMore,
    refresh,
    restoreFile,
    permanentDeleteFile,
    updateSort,
    updatePerPage
  };
};
