import { useState, useEffect } from 'react';
import { X, Share2, Link2 } from 'lucide-react';
import { filesAPI } from '../services/api';
import type { FileData } from '../types';

interface ShareFileModalProps {
  isOpen: boolean;
  file: FileData;
  onClose: () => void;
  onSuccess: (updatedFile?: FileData) => void;
}

export const ShareFileModal = ({ isOpen, file, onClose, onSuccess }: ShareFileModalProps) => {
  const [publicToken, setPublicToken] = useState<string | null>(file.public_token || null);
  const [isPublic, setIsPublic] = useState<boolean>(!!file.public_token);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPublicToken(file.public_token || null);
      setIsPublic(!!file.public_token);
      setPublicError(null);
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const handleMakePublic = async () => {
    setPublicLoading(true);
    setPublicError(null);
    try {
      const result = await filesAPI.makeFilePublic(file._id);
      if (result && result.public_token) {
        setPublicToken(result.public_token);
        setIsPublic(true);
        // Create updated file object with public_token
        const updatedFile = { ...file, public_token: result.public_token };
        onSuccess(updatedFile);
      } else {
        setPublicError('Failed to make file public');
      }
    } catch (err: any) {
      setPublicError(err?.response?.data?.detail || 'Failed to make file public');
    } finally {
      setPublicLoading(false);
    }
  };

  const handleMakePrivate = async () => {
    setPublicLoading(true);
    setPublicError(null);
    try {
      const result = await filesAPI.makeFilePrivate(file._id);
      if (result && result.message) {
        setPublicToken(null);
        setIsPublic(false);
        // Create updated file object without public_token
        const updatedFile = { ...file, public_token: undefined };
        onSuccess(updatedFile);
      } else {
        setPublicError('Failed to make file private');
      }
    } catch (err: any) {
      setPublicError(err?.response?.data?.detail || 'Failed to make file private');
    } finally {
      setPublicLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    }
  };

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://vamory.vadaevri.com';
  const publicLink = publicToken ? `${frontendUrl}/shared/file?token=${publicToken}` : '';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4" onClick={(e) => e.stopPropagation()}>
      <div className="glass bg-black/40 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700/40" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-light text-white">Share File</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" onClick={(e) => e.stopPropagation()}>
          {/* File Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sharing</h3>
            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-gray-700/30">
              <div className="w-8 h-8 bg-gray-800/60 rounded-lg flex items-center justify-center">
                <Share2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{file.filename}</div>
                <div className="text-sm text-gray-400">
                  {file.file_type} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              {/* Public/Private Controls */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {isPublic ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-green-400" />
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

          {/* Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">How it works</h3>
            <div className="text-sm text-gray-400 space-y-2">
              <p>• Anyone with the link can view and download this file</p>
              <p>• The link will remain active until you make the file private</p>
              <p>• You can revoke access anytime by making the file private</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-black/30 hover:bg-black/40 transition-colors rounded-lg border border-gray-700/30"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
