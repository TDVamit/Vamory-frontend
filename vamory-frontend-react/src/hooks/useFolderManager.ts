import { useState } from 'react';
import { foldersAPI } from '../services/api';
import type { Folder, CreateFolderRequest, UpdateFolderRequest, ChangeStorageTypeRequest, ShareFolderRequest } from '../types';

export const useFolderManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFolder = async (data: CreateFolderRequest): Promise<Folder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folder = await foldersAPI.createFolder(data);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFolder = async (folderId: string, data: UpdateFolderRequest): Promise<Folder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folder = await foldersAPI.updateFolder(folderId, data);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolder = async (folderId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await foldersAPI.deleteFolder(folderId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changeStorageType = async (folderId: string, data: ChangeStorageTypeRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await foldersAPI.changeStorageType(folderId, data);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change storage type';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const shareFolder = async (folderId: string, data: ShareFolderRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await foldersAPI.shareFolder(folderId, data);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share folder';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShareFolder = async (folderId: string, userEmail: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await foldersAPI.revokeShareFolder(folderId, userEmail);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke folder access';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getFolderDetails = async (folderId: string): Promise<Folder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folder = await foldersAPI.getFolder(folderId);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get folder details';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Make folder public
  const makeFolderPublic = async (folderId: string): Promise<{ message: string; public_token: string } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await foldersAPI.makeFolderPublic(folderId);
      return result;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to make folder public');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Make folder private
  const makeFolderPrivate = async (folderId: string): Promise<{ message?: string; reason?: string; success?: boolean } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await foldersAPI.makeFolderPrivate(folderId);
      return result;
    } catch (err: any) {
      // Try to extract 'reason' and 'success' from backend error response
      const reason = err?.response?.data?.reason;
      const success = err?.response?.data?.success;
      if (reason) {
        setError(reason);
        return { reason, success };
      }
      setError(err?.response?.data?.detail || 'Failed to make folder private');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    changeStorageType,
    shareFolder,
    revokeShareFolder,
    getFolderDetails,
    clearError,
    makeFolderPublic,
    makeFolderPrivate,
  };
}; 