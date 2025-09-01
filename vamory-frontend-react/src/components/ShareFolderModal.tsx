import { useState, useEffect } from 'react';
import { X, Search, Share2, User as UserIcon, Mail,  Eye, Edit, Crown, Trash2, Link2 } from 'lucide-react';
import { useFolderManager } from '../hooks/useFolderManager';
import { usersAPI } from '../services/api';
import type { Folder, ShareFolderRequest, User } from '../types';
import { getProfilePictureUrl } from '../utils/profileImageUtils';

interface ShareFolderModalProps {
  isOpen: boolean;
  folder: Folder;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareFolderModal = ({ isOpen, folder, onClose, onSuccess }: ShareFolderModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const { shareFolder, revokeShareFolder, isLoading, error, makeFolderPublic, makeFolderPrivate } = useFolderManager();
  const [publicToken, setPublicToken] = useState<string | null>(folder.public_token || null);
  const [isPublic, setIsPublic] = useState<boolean>(!!folder.is_public);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setUsers([]);
      setSelectedUser(null);
      setAccessLevel('read');
      setSearchError(null);
      setRevokingEmail(null);
      setPublicToken(folder.public_token || null);
      setIsPublic(!!folder.is_public);
    }
  }, [isOpen, folder]);

  // Debounced user search
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await usersAPI.searchUsers({
          search: searchQuery,
          per_page: 10,
          sort_by: 'full_name',
          sort_order: 'asc'
        });
        setUsers(response.users);
      } catch (err) {
        setSearchError('Failed to search users');
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      return;
    }

    const requestData: ShareFolderRequest = {
      user_email: selectedUser.email,
      access_level: accessLevel,
    };

    const success = await shareFolder(folder._id, requestData);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleRevokeAccess = async (userEmail: string) => {
    setRevokingEmail(userEmail);
    const success = await revokeShareFolder(folder._id, userEmail);
    if (success) {
      onSuccess();
    }
    setRevokingEmail(null);
  };

  const handleMakePublic = async () => {
    setPublicLoading(true);
    setPublicError(null);
    const result = await makeFolderPublic(folder._id);
    if (result && result.public_token) {
      setPublicToken(result.public_token);
      setIsPublic(true);
      // Do not call onSuccess or refresh, just update UI
    } else {
      setPublicError(error || 'Failed to make folder public');
    }
    setPublicLoading(false);
  };

  const handleMakePrivate = async () => {
    setPublicLoading(true);
    setPublicError(null);
    const result = await makeFolderPrivate(folder._id);
    if (result && result.message) {
      setPublicToken(null);
      setIsPublic(false);
      // Do not call onSuccess or refresh, just update UI
    } else if (result && result.reason) {
      setPublicError(result.reason);
      // Do not change UI state, keep Make Private button
    } else {
      setPublicError(error || 'Failed to make folder private');
    }
    setPublicLoading(false);
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'read':
        return Eye;
      case 'write':
        return Edit;
      case 'admin':
        return Crown;
      default:
        return Eye;
    }
  };

  const getAccessLevelDescription = (level: string) => {
    switch (level) {
      case 'read':
        return 'Can view files and folders';
      case 'write':
        return 'Can view, upload, and modify files';
      case 'admin':
        return 'Full access including sharing and deletion';
      default:
        return '';
    }
  };

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://vamory.vadaevri.com';
  const publicLink = publicToken ? `${frontendUrl}/shared/folder?token=${publicToken}&folder_id=${folder._id}` : '';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="glass bg-black/40 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-light text-white">Share Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Folder Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sharing</h3>
            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-gray-700/30">
              <div className="w-8 h-8 bg-gray-800/60 rounded-lg flex items-center justify-center">
                <Share2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{folder.name}</div>
                <div className="text-sm text-gray-400">
                  {folder.shared_with && folder.shared_with.length > 0 
                    ? `Shared with ${folder.shared_with.length} user${folder.shared_with.length > 1 ? 's' : ''}`
                    : 'Select a user to share with'
                  }
                </div>
              </div>
              {/* Public/Private Controls */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {isPublic ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-xs">Public</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMakePrivate}
                      disabled={publicLoading}
                      className="px-2 py-1 text-xs bg-red-700/30 text-red-200 rounded hover:bg-red-700/50 disabled:opacity-50"
                    >
                      {publicLoading ? 'Making Private...' : 'Make Private'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleMakePublic}
                    disabled={publicLoading}
                    className="px-2 py-1 text-xs bg-green-700/30 text-green-200 rounded hover:bg-green-700/50 disabled:opacity-50"
                  >
                    {publicLoading ? 'Making Public...' : 'Make Public'}
                  </button>
                )}
              </div>
            </div>
            {/* Public Link Display */}
            {isPublic && publicToken && (
              <div className="mt-3 flex items-center gap-2 bg-black/30 border border-green-700/30 rounded-lg p-2 relative">
                <Link2 className="w-4 h-4 text-green-400" />
                <input
                  type="text"
                  value={publicLink}
                  readOnly
                  className="flex-1 bg-transparent text-green-300 text-xs px-2 py-1 outline-none"
                  onFocus={e => e.target.select()}
                />
                <button
                  type="button"
                  className="text-xs text-green-300 hover:underline"
                  onClick={handleCopyLink}
                >
                  Copy Link
                </button>
                {linkCopied && (
                  <span className="absolute right-2 top-[-1.5rem] bg-green-800 text-green-100 text-xs px-2 py-1 rounded shadow">Copied!</span>
                )}
              </div>
            )}
            {publicError && (
              <div className="mt-2 text-xs text-red-400">{publicError}</div>
            )}
          </div>

          {/* Current Shares */}
          {folder.shared_with && folder.shared_with.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Current Access</h3>
              <div className="space-y-2">
                {folder.shared_with.map((userEmail) => (
                  <div
                    key={userEmail}
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800/60 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300 text-sm">{userEmail}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeAccess(userEmail)}
                      disabled={revokingEmail === userEmail}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                      title="Revoke access"
                    >
                      {revokingEmail === userEmail ? (
                        <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-300 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-gray-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-300 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {searchError && (
                  <div className="p-3 text-sm text-red-300 bg-red-900/20 rounded-lg">
                    {searchError}
                  </div>
                )}
                {users.length > 0 ? (
                  <div className="space-y-1">
                    {users.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedUser?._id === user._id
                            ? 'bg-black/50 border-gray-500/50 text-white'
                            : 'bg-black/30 border-gray-700/30 text-gray-300 hover:bg-black/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const profilePicUrl = getProfilePictureUrl(user);
                            return profilePicUrl ? (
                              <img
                                src={profilePicUrl}
                                alt={user.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-700 bg-gray-800"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            );
                          })()}
                          <div className="flex-1">
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm opacity-75 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  !isSearching && searchQuery && (
                    <div className="p-3 text-sm text-gray-400 text-center">
                      No users found
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Selected User</h3>
              <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-gray-700/30">
                {(() => {
                  const profilePicUrl = getProfilePictureUrl(selectedUser);
                  return profilePicUrl ? (
                    <img
                      src={profilePicUrl}
                      alt={selectedUser.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-700 bg-gray-800"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600/50 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-300" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <div className="text-white font-medium">{selectedUser.full_name}</div>
                  <div className="text-sm text-gray-300">{selectedUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Access Level */}
          {selectedUser && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Access Level
              </label>
              <div className="space-y-2">
                {(['read', 'write', 'admin'] as const).map((level) => {
                  const Icon = getAccessLevelIcon(level);
                  
                  return (
                    <label
                      key={level}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        accessLevel === level
                          ? 'bg-black/50 border-gray-500/50 text-white'
                          : 'bg-black/30 border-gray-700/30 text-gray-300 hover:bg-black/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accessLevel"
                        value={level}
                        checked={accessLevel === level}
                        onChange={(e) => setAccessLevel(e.target.value as any)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium capitalize">{level}</div>
                        <div className="text-sm opacity-75">{getAccessLevelDescription(level)}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-black/30 hover:bg-black/40 transition-colors rounded-lg border border-gray-700/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="flex-1 px-4 py-2 bg-gray-700/40 text-white hover:bg-gray-600/50 transition-colors rounded-lg border border-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sharing...' : 'Share Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};