import { useState, useEffect } from 'react';
import { X, HardDrive, Archive, Database } from 'lucide-react';
import { useFolderManager } from '../hooks/useFolderManager';
import type { Folder, ChangeStorageTypeRequest } from '../types';

interface StorageConversionModalProps {
  isOpen: boolean;
  folder: Folder;
  onClose: () => void;
  onSuccess: () => void;
}

export const StorageConversionModal = ({ isOpen, folder, onClose, onSuccess }: StorageConversionModalProps) => {
  const [newStorageType, setNewStorageType] = useState<'STANDARD_IA' | 'GLACIER_IR' | 'DEEP_ARCHIVE'>('STANDARD_IA');
  const [_applyToChildren, setApplyToChildren] = useState(true);
  const [retrievalDays, setRetrievalDays] = useState(5);
  const [retrievalMode, setRetrievalMode] = useState<'Standard' | 'Bulk'>('Bulk');
  const { changeStorageType, isLoading, error } = useFolderManager();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewStorageType(folder.storage_type === 'DEEP_ARCHIVE' ? 'STANDARD_IA' : 'DEEP_ARCHIVE');
      setApplyToChildren(true); // Always true
      setRetrievalDays(5);
      setRetrievalMode('Bulk');
    }
  }, [isOpen, folder.storage_type]);

  if (!isOpen) return null;

  const isConvertingFromDeepArchive = folder.storage_type === 'DEEP_ARCHIVE';
  const needsRetrievalSettings = isConvertingFromDeepArchive && (newStorageType === 'STANDARD_IA' || newStorageType === 'GLACIER_IR');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData: ChangeStorageTypeRequest = {
      new_storage_type: newStorageType,
      apply_to_children: true, // Always true
    };

    if (needsRetrievalSettings) {
      requestData.retrieval_days = retrievalDays;
      requestData.retrieval_mode = retrievalMode;
    }

    const success = await changeStorageType(folder._id, requestData);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const getStorageTypeIcon = (type: string) => {
    switch (type) {
      case 'STANDARD_IA':
        return HardDrive;
      case 'GLACIER_IR':
        return Database;
      case 'DEEP_ARCHIVE':
        return Archive;
      default:
        return HardDrive;
    }
  };

  const getStorageTypeLabel = (type: string) => {
    switch (type) {
      case 'STANDARD_IA':
        return 'Standard IA';
      case 'GLACIER_IR':
        return 'Glacier IR';
      case 'DEEP_ARCHIVE':
        return 'Deep Archive';
      default:
        return type;
    }
  };

  const getStorageTypeDescription = (type: string) => {
    switch (type) {
      case 'STANDARD_IA':
        return 'Fast access, higher cost';
      case 'GLACIER_IR':
        return 'Medium access time, medium cost';
      case 'DEEP_ARCHIVE':
        return 'Slow access, lowest cost';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="glass bg-black/40 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <h2 className="text-xl font-light text-white">Convert Storage Type</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Storage Type */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Current Storage Type</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/20">
              {(() => {
                const Icon = getStorageTypeIcon(folder.storage_type);
                return <Icon className="w-5 h-5 text-gray-400" />;
              })()}
              <div>
                <div className="text-white font-medium">{getStorageTypeLabel(folder.storage_type)}</div>
                <div className="text-sm text-gray-400">{getStorageTypeDescription(folder.storage_type)}</div>
              </div>
            </div>
          </div>

          {/* New Storage Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Convert To
            </label>
            <div className="space-y-2">
              {(['STANDARD_IA', 'GLACIER_IR', 'DEEP_ARCHIVE'] as const).map((type) => {
                if (type === folder.storage_type) return null;
                const Icon = getStorageTypeIcon(type);
                
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      newStorageType === type
                        ? 'bg-gray-700/40 border-gray-500/50 text-white'
                        : 'bg-gray-800/20 border-gray-600/20 text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="storageType"
                      value={type}
                      checked={newStorageType === type}
                      onChange={(e) => setNewStorageType(e.target.value as any)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{getStorageTypeLabel(type)}</div>
                      <div className="text-sm opacity-75">{getStorageTypeDescription(type)}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Retrieval Settings - Only for DEEP_ARCHIVE to other types */}
          {needsRetrievalSettings && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-300 mb-3">Retrieval Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Retrieval Days
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="364"
                    value={retrievalDays}
                    onChange={(e) => setRetrievalDays(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Retrieval Mode
                  </label>
                  <select
                    value={retrievalMode}
                    onChange={(e) => setRetrievalMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-gray-400/50"
                  >
                    <option value="Bulk">Bulk (12-48 hours, lowest cost)</option>
                    <option value="Standard">Standard (3-5 hours, medium cost)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Apply to Children */}
          {/*
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={applyToChildren}
                onChange={(e) => setApplyToChildren(e.target.checked)}
                className="w-4 h-4 bg-gray-800 border border-gray-600 rounded focus:ring-2 focus:ring-gray-400/50 text-gray-300"
              />
              <span className="text-sm text-gray-300">Apply to all subfolders and files</span>
            </label>
          */}

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
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-800/30 hover:bg-gray-700/40 transition-colors rounded-lg border border-gray-600/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600/40 text-white hover:bg-gray-500/50 transition-colors rounded-lg border border-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Converting...' : 'Convert Storage Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};