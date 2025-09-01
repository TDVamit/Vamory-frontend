import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Edit3, Save, X, Users, Clock, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFaceDetail, useNameSuggestions } from '../hooks/useFaceDetection';
import { faceDetectionAPI } from '../services/api';
import { Header } from './Header';
import type { FaceNameSuggestion } from '../types';

export const FaceDetailPage: React.FC = () => {
  const { faceId } = useParams<{ faceId: string }>();
  const navigate = useNavigate();
  const { faceDetail, loading, error, fetchFaceDetail } = useFaceDetail(faceId || null);
  const { suggestions, getNameSuggestions } = useNameSuggestions();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize edit name when face detail loads
  useEffect(() => {
    if (faceDetail) {
      setEditName(faceDetail.name || '');
    }
  }, [faceDetail]);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
    setShowSuggestions(false);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditName(faceDetail?.name || '');
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    setEditName(value);
    if (value.length >= 2) {
      getNameSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSaveName = async () => {
    if (!faceId || !editName.trim()) return;

    setSaving(true);
    try {
      await faceDetectionAPI.nameFace({
        face_id: faceId,
        name: editName.trim()
      });
      setIsEditing(false);
      setShowSuggestions(false);
      fetchFaceDetail(); // Refresh face detail
    } catch (err) {
      console.error('Failed to save name:', err);
      alert('Failed to save name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMergeWithSuggestion = async (suggestion: FaceNameSuggestion) => {
    if (!faceId) return;

    setSaving(true);
    try {
      await faceDetectionAPI.mergeFaces({
        face_id: faceId,
        target_face_id: suggestion.face_id
      });
      
      // If merge is successful (200 response), navigate to all faces page
      // since the current face is now merged and won't be found
      setIsEditing(false);
      setShowSuggestions(false);
      navigate('/faces'); // Navigate to all faces page
    } catch (err) {
      console.error('Failed to merge faces:', err);
      alert('Failed to merge faces. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen surface-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading face details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !faceDetail) {
    return (
      <div className="min-h-screen surface-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error || 'Face not found'}</p>
            <button
              onClick={() => navigate('/faces')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Faces
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-dark">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
                     <button
             onClick={() => navigate('/faces')}
             className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all glass"
           >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
                     <div>
             <h1 className="text-2xl font-bold text-white">Face Details</h1>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Face Info */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Face Information</h2>
              {!isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Name Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
              {isEditing ? (
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter face name..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                    >
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.face_id}
                          onClick={() => handleMergeWithSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-3"
                        >
                          <img
                            src={suggestion.thumbnail_s3_url}
                            alt={suggestion.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white">{suggestion.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveName}
                      disabled={saving || !editName.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditing}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className={`text-lg ${
                    faceDetail.name ? 'text-white' : 'text-red-400'
                  }`}>
                    {faceDetail.name || 'No Name'}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
                         <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 rounded-lg p-4 glass">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Photos</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {faceDetail.file_references.length}
                </span>
              </div>
                             <div className="bg-white/5 rounded-lg p-4 glass">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Created</span>
                </div>
                <span className="text-sm text-white">
                  {formatDate(faceDetail.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 glass">
            <h2 className="text-xl font-semibold text-white mb-6">Photos</h2>
            
            {faceDetail.file_references.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No photos found for this face.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {faceDetail.file_references.map((fileRef, index) => (
                  <div key={fileRef.file_id} className="relative group">
                    <img
                      src={fileRef.s3_url}
                      alt={`Photo ${index + 1}`}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                                         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
