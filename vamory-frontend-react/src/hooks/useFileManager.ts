import { useState } from 'react';
import { filesAPI } from '../services/api';
import type { FileData, UploadFileResponse, UpdateFileRequest } from '../types';

export const useFileManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (folderId: string, file: File): Promise<UploadFileResponse | null> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await filesAPI.uploadFile(folderId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setUploadProgress(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getFileDetails = async (fileId: string): Promise<FileData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const file = await filesAPI.getFile(fileId);
      return file;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file details';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFile = async (fileId: string, data: UpdateFileRequest): Promise<FileData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const file = await filesAPI.updateFile(fileId, data);
      return file;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update file';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await filesAPI.deleteFile(fileId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const downloadUrl = await filesAPI.downloadFile(fileId);
      return downloadUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const resetUploadProgress = () => {
    setUploadProgress(0);
  };

  return {
    isLoading,
    error,
    uploadProgress,
    uploadFile,
    getFileDetails,
    updateFile,
    deleteFile,
    downloadFile,
    clearError,
    resetUploadProgress,
  };
}; 