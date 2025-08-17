import { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useFolderManager } from '../hooks/useFolderManager';
import { useAuth0Custom } from '../hooks/useAuth0';
import type { CreateFolderRequest } from '../types';
import { UserRole } from '../types';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentFolderId?: string;
}

export const CreateFolderModal = ({ isOpen, onClose, onSuccess, parentFolderId }: CreateFolderModalProps) => {
  const { user } = useAuth0Custom();
  const [formData, setFormData] = useState({
    name: '',
    storage_type: 'STANDARD_IA' as const,
  });
  const [_errors, setErrors] = useState<Record<string, string>>({});
  const { createFolder, isLoading, error } = useFolderManager();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        storage_type: 'STANDARD_IA',
      });
      setErrors({});
    }
  }, [isOpen]);

  // Allow super_admin to have all admin privileges
  const canCreateFolder = user?.user_role === UserRole.super_admin || user?.user_role === UserRole.admin || user?.user_role === UserRole.user;
  // Don't render modal if not allowed
  if (!isOpen || !canCreateFolder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Folder name is required' });
      return;
    }

    const createData: CreateFolderRequest = {
      name: formData.name.trim(),
      storage_type: formData.storage_type,
      parent_folder_id: parentFolderId,
    };

    const result = await createFolder(createData);
    if (result) {
      onSuccess();
      onClose();
      setFormData({
        name: '',
        storage_type: 'STANDARD_IA',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="glass bg-black/40 rounded-xl p-8 w-full max-w-md mx-4 border border-gray-700/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/30 rounded-lg border border-gray-700/30">
              <FolderPlus className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-1">Create New Folder</h3>
              <p className="text-sm text-gray-500">Organize your files by creating a new folder</p>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50 transition-all"
              placeholder="Enter folder name"
            />
          </div>

          <div>
            <label htmlFor="storage_type" className="block text-sm font-medium text-gray-300 mb-2">
              Storage Type
            </label>
            <select
              id="storage_type"
              name="storage_type"
              value={formData.storage_type}
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
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

