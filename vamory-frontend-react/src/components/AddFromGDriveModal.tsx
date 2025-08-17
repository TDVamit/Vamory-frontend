import { useState, useEffect } from 'react';
import { X, FolderPlus, Link as LinkIcon } from 'lucide-react';
import { filesAPI } from '../services/api';
import { useAuth0Custom } from '../contexts/AuthContext';
import type { AddFromGDriveRequest } from '../types';
import { UserRole } from '../types';

interface AddFromGDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFromGDriveModal = ({ isOpen, onClose, onSuccess }: AddFromGDriveModalProps) => {
  const { user } = useAuth0Custom();
  const canAddFromGDrive = user?.user_role === UserRole.super_admin || user?.user_role === UserRole.admin || user?.user_role === UserRole.user;

  const [formData, setFormData] = useState<AddFromGDriveRequest>({
    gdrive_url: '',
    folder_name: '',
    folder_storage_type: 'STANDARD_IA',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        gdrive_url: '',
        folder_name: '',
        folder_storage_type: 'STANDARD_IA',
      });
      setErrors({});
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError(null);

    if (!formData.gdrive_url.trim()) {
      setErrors({ gdrive_url: 'Google Drive folder URL is required' });
      return;
    }
    if (!formData.folder_name.trim()) {
      setErrors({ folder_name: 'Folder name is required' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await filesAPI.addFromGDrive(formData);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to add from Google Drive');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to add from Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen || !canAddFromGDrive) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="glass bg-black/40 rounded-xl p-8 w-full max-w-md mx-4 border border-gray-700/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/30 rounded-lg border border-gray-700/30">
              <LinkIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-1">Add Folder from Google Drive</h3>
              <p className="text-sm text-gray-500">Import a public Google Drive folder by URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="gdrive_url" className="block text-sm font-medium text-gray-300 mb-2">
              Google Drive Folder URL
            </label>
            <input
              type="text"
              id="gdrive_url"
              name="gdrive_url"
              value={formData.gdrive_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 transition-all"
              placeholder="Paste public Google Drive folder URL"
            />
            {errors.gdrive_url && <p className="text-red-400 text-xs mt-1">{errors.gdrive_url}</p>}
          </div>

          <div>
            <label htmlFor="folder_name" className="block text-sm font-medium text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              id="folder_name"
              name="folder_name"
              value={formData.folder_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 transition-all"
              placeholder="Enter folder name"
            />
            {errors.folder_name && <p className="text-red-400 text-xs mt-1">{errors.folder_name}</p>}
          </div>

          <div>
            <label htmlFor="folder_storage_type" className="block text-sm font-medium text-gray-300 mb-2">
              Storage Type
            </label>
            <select
              id="folder_storage_type"
              name="folder_storage_type"
              value={formData.folder_storage_type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 transition-all"
            >
              <option value="STANDARD_IA">Standard IA</option>
              <option value="GLACIER_IR">Glacier IR</option>
              <option value="DEEP_ARCHIVE">Deep Archive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 surface-alt border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-neon py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              ) : (
                <>
                  <FolderPlus size={16} />
                  Add
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};