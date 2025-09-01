import { useState, useEffect, useCallback } from 'react';
import { faceDetectionAPI } from '../services/api';
import type { FaceThumbnail, FaceDetail, FaceNameSuggestion } from '../types';

export const useFaceDetection = () => {
  const [faces, setFaces] = useState<FaceThumbnail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perPage] = useState(20);

  // Fetch faces with pagination
  const fetchFaces = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await faceDetectionAPI.getAllFaces({
        page,
        per_page: perPage,
        named_only: false
      });
      
      setFaces(response.data);
      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.page_count);
      setTotalCount(response.meta.total_count);
    } catch (err) {
      console.error('Failed to fetch faces:', err);
      setError('Failed to load faces');
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  // Initial load
  useEffect(() => {
    fetchFaces(1);
  }, [fetchFaces]);

  return {
    faces,
    currentPage,
    totalPages,
    totalCount,
    loading,
    error,
    fetchFaces,
    perPage,
  };
};

export const useFaceDetail = (faceId: string | null) => {
  const [faceDetail, setFaceDetail] = useState<FaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch face detail
  const fetchFaceDetail = useCallback(async () => {
    if (!faceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await faceDetectionAPI.getFaceDetail(faceId);
      setFaceDetail(response);
    } catch (err) {
      console.error('Failed to fetch face detail:', err);
      setError('Failed to load face details');
    } finally {
      setLoading(false);
    }
  }, [faceId]);

  // Fetch when faceId changes
  useEffect(() => {
    if (faceId) {
      fetchFaceDetail();
    }
  }, [faceId, fetchFaceDetail]);

  return {
    faceDetail,
    loading,
    error,
    fetchFaceDetail,
  };
};

export const useNameSuggestions = () => {
  const [suggestions, setSuggestions] = useState<FaceNameSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get name suggestions
  const getNameSuggestions = useCallback(async (namePattern: string) => {
    if (!namePattern || namePattern.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await faceDetectionAPI.getNameSuggestions(namePattern);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Failed to fetch name suggestions:', err);
      setError('Failed to load name suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    getNameSuggestions,
  };
};
