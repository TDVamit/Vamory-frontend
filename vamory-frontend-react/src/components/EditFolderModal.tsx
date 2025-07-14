import { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { useFolderManager } from '../hooks/useFolderManager';
import type { Folder, UpdateFolderRequest } from '../types';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folder: Folder;
}

export const EditFolderModal = ({ isOpen, onClose, onSuccess, folder }: EditFolderModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateFolder, isLoading, error } = useFolderManager();

  // Reset form when modal opens/closes or folder changes
  useEffect(() => {
    if (isOpen && folder) {
      setFormData({
        name: folder.name,
      });
      setErrors({});
    }
  }, [isOpen, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Folder name is required' });
      return;
    }

    if (formData.name.trim() === folder.name) {
      // No changes made
      onClose();
      return;
    }

    const updateData: UpdateFolderRequest = {
      name: formData.name.trim(),
    };

    const result = await updateFolder(folder._id, updateData);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 surface-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-xl p-8 w-full max-w-md mx-4 glow-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-700/30 backdrop-blur-sm rounded-lg border border-gray-600/20">
              <Edit3 className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-1">Edit Folder</h3>
              <p className="text-sm text-gray-500">Update the folder name</p>
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
            <div className="bg-red-900/30 backdrop-blur-sm border border-red-700/40 rounded-lg p-3">
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
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
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
                  <Edit3 size={16} />
                  Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 