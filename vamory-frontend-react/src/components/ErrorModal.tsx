import { X, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

export const ErrorModal = ({ 
  isOpen, 
  onClose, 
  title = "Error", 
  message, 
  details 
}: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass bg-black/40 backdrop-blur-md rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700/40 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 text-sm mb-3">{message}</p>
                     {details && (
             <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-gray-600/20">
               <p className="text-gray-400 text-xs font-mono break-all">{details}</p>
             </div>
           )}
        </div>

                 <div className="flex justify-end">
           <button
             type="button"
             onClick={onClose}
             className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors backdrop-blur-sm border border-gray-600/30"
           >
             Close
           </button>
         </div>
      </div>
    </div>
  );
};
