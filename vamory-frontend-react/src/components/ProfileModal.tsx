import { X, User, Coins, Shield, Edit3, Upload, Save } from 'lucide-react';
import { useAuth0Custom } from '../contexts/AuthContext';
import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';
import { ImageCropModal } from './ImageCropModal';
import { StorageChart } from './StorageChart';
import api from '../services/api';
import { useProfileImage } from '../hooks/useProfileImage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, auth0User, refreshUserData } = useAuth0Custom();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the profile image hook to handle Google profile images with proper headers
  const { imageUrl, isLoading } = useProfileImage(auth0User?.picture);

  // Identify provider from Auth0 user.sub
  const getProvider = () => {
    if (!auth0User?.sub) return null;
    const provider = auth0User.sub.split("|")[0];
    
    switch (provider) {
      case 'google-oauth2':
        return 'Google';
      case 'facebook':
        return 'Facebook';
      case 'apple':
        return 'Apple';
      default:
        return null; // Email login
    }
  };

  const provider = getProvider();
  const isEmailLogin = !provider;

  // Initialize edit name when starting to edit
  const startEditing = () => {
    setEditName(auth0User?.name || '');
    setIsEditing(true);
    setUpdateError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName('');
    setUpdateError(null);
  };

  const handleProfileUpdate = async (profilePicture?: Blob) => {
    if (!editName.trim() && !profilePicture) return;
    
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const formData = new FormData();
      
      if (editName.trim() && editName !== auth0User?.name) {
        formData.append('name', editName.trim());
      }
      
      if (profilePicture) {
        formData.append('picture', profilePicture, 'profile.jpg');
      }

      await api.patch('/api/v1/auth/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh user data instead of reloading the page
      await refreshUserData();
      
      setIsEditing(false);
      setEditName('');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setUpdateError(error?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select an image file');
        return;
      }

      // Create URL for the image
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowCropModal(true);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setShowCropModal(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    await handleProfileUpdate(croppedImageBlob);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/10" style={{ zIndex: 99999 }}>
      <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative border border-gray-700 max-h-screen overflow-y-auto mx-2">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <User className="w-16 h-16 text-blue-400 mb-3 drop-shadow" />
          <h2 className="text-2xl xs:text-2xl sm:text-3xl font-semibold text-white mb-2 tracking-wide">Profile</h2>
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-600/30"
                onError={(e) => {
                  // Fallback to user icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            {!imageUrl && !isLoading && (
              <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-blue-600/30 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {isLoading && (
              <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-blue-600/30 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Upload button for email login users - only show when editing */}
            {isEmailLogin && isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-full p-2 shadow-lg transition-colors"
                title="Upload profile picture"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Basic Profile Information */}
        <div className="space-y-4 mb-6">
          <div className="text-center flex items-center justify-center gap-3">
            <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            {isEmailLogin && !isEditing && (
              <button
                onClick={startEditing}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Edit profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Provider Information */}
          {provider && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-800/30 text-green-200 text-sm border border-green-700/50">
                <span>Signed in with {provider}</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                To update your profile, please update using {provider}
              </p>
            </div>
          )}

          {/* Error Message */}
          {updateError && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-800/30 text-red-200 text-sm border border-red-700/50">
                {updateError}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
              <span className="text-gray-400">Full Name</span>
              {isEditing && isEmailLogin ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={() => handleProfileUpdate()}
                    disabled={isUpdating || !editName.trim() || editName === auth0User?.name}
                    className="text-green-400 hover:text-green-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    title="Save"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={isUpdating}
                    className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-white font-medium">{auth0User?.name || 'Not provided'}</span>
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
              <span className="text-gray-400">Email</span>
              <span className="text-white font-medium">{auth0User?.email || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Application Profile Information */}
        {user && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="flex gap-3 mb-6 flex-wrap justify-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-blue-200 text-xs font-semibold shadow border border-gray-700">
                <Shield className="w-4 h-4" />
                Role: {user.user_role.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-yellow-200 text-xs font-semibold shadow border border-gray-700">
                <Coins className="w-4 h-4" />
                Credits: {user.credits || 0}
              </span>
            </div>

            {/* Storage Usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white text-center">Storage Usage</h3>
              
              {/* Storage Chart */}
              <div className="flex justify-center">
                <StorageChart
                  storageUsedStandard={user.storage_used_standard}
                  storageUsedArchived={user.storage_used_archived}
                  storageUsedStandardDeleted={user.storage_used_standard_deleted}
                  storageUsedArchivedDeleted={user.storage_used_archived_deleted}
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white text-center">Account Details</h3>
              <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
          
        {/* Loading message for backend data */}
        {!user && (
          <div className="text-center text-gray-400 mt-6">
            <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full mx-auto mb-2"></div>
            <p>Loading application profile...</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-xs mt-8">
          Vamory • Secure Cloud Storage
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImage && (
        <ImageCropModal
          isOpen={showCropModal}
          imageSrc={selectedImage}
          onCrop={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </div>,
    document.body
  );
};
