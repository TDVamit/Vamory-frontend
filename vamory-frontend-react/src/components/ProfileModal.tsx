import { X, User, Coins, Shield } from 'lucide-react';
import { useAuth0Custom } from '../hooks/useAuth0';
import { createPortal } from 'react-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, auth0User } = useAuth0Custom();

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
          {auth0User?.picture ? (
            <img
              src={auth0User.picture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-600/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-blue-600/30 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Basic Profile Information */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
              <span className="text-gray-400">Full Name</span>
              <span className="text-white font-medium">{auth0User?.name || 'Not provided'}</span>
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
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white text-center">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Standard Storage</span>
                  <span className="text-blue-400 font-medium">{(user.storage_used_standard / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Archive Storage</span>
                  <span className="text-blue-400 font-medium">{(user.storage_used_archived / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-700/30">
                  <span className="text-gray-300 font-medium">Total Used</span>
                  <span className="text-blue-400 font-bold">{((user.storage_used_standard + user.storage_used_archived) / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                </div>
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
    </div>,
    document.body
  );
};
