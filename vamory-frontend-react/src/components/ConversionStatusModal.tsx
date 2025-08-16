import { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Folder, FolderConversionStatusResponse } from '../types';
import { foldersAPI } from '../services/api';

interface ConversionStatusModalProps {
  isOpen: boolean;
  folder: Folder;
  onClose: () => void;
  onStatusChecked: (shouldRefetch: boolean) => void;
}

export const ConversionStatusModal = ({ isOpen, folder, onClose, onStatusChecked }: ConversionStatusModalProps) => {
  const [status, setStatus] = useState<FolderConversionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await foldersAPI.checkConversionStatus(folder._id);
      if ('success' in result && result.success) {
        onStatusChecked(true); // refetch folder status and close modal
      }
      setStatus(result);
    } catch (err) {
      setError('Failed to check conversion status.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-black/80 rounded-xl shadow-2xl max-w-md w-full border border-gray-700/60">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-base font-normal text-white">Conversion Status</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-2 text-gray-300 text-sm">
            <span className="truncate max-w-[70%]">Check if all files are converted.</span>
            <button
              onClick={handleCheckStatus}
              disabled={isLoading}
              className="px-4 py-1.5 bg-gray-800/80 text-gray-200 rounded-lg hover:bg-gray-700/80 border border-gray-700/40 transition-colors text-sm disabled:opacity-50 ml-2 whitespace-nowrap"
            >
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
          {error && (
            <div className="mb-3 p-2 border border-red-700/40 rounded-lg bg-transparent">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}
          {status && (
            <div className="mb-3">
              {'success' in status && status.success ? (
                <div className="flex flex-col gap-2 p-2 border border-green-700/40 rounded-lg bg-transparent">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-200 text-sm">{status.message}</span>
                  </div>
                  {status.estimated_ready_time && (
                    <div className="text-green-100 text-xs mt-1">
                      Estimated ready time: <span className="font-semibold">{new Date(status.estimated_ready_time).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : 'success' in status && status.success === false ? (
                <div className="flex flex-col gap-2 p-2 border border-yellow-700/40 rounded-lg bg-transparent">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-200 text-sm font-medium">Still converting...</span>
                  </div>
                  {status.estimated_ready_time && (
                    <div className="text-yellow-100 text-xs mt-1">
                      Estimated ready time: <span className="font-semibold">{new Date(status.estimated_ready_time).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : 'detail' in status ? (
                <div className="flex items-center gap-2 p-2 border border-red-700/40 rounded-lg bg-transparent">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-200 text-sm">{status.detail}</span>
                </div>
              ) : null}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-1.5 text-gray-300 bg-gray-800/60 hover:bg-gray-700/80 transition-colors rounded-lg border border-gray-700/40 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 