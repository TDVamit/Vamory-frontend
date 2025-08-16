import { Sparkles } from 'lucide-react';

interface AISearchToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export const AISearchToggle = ({ isEnabled, onToggle, className = '' }: AISearchToggleProps) => {
  return (
    <button
      onClick={() => onToggle(!isEnabled)}
      className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 h-full min-h-[44px] ${
        isEnabled
          ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
          : 'bg-gray-800/20 text-gray-400 border border-gray-600/30 hover:bg-gray-700/30 hover:text-gray-300'
      } ${className}`}
      title={isEnabled ? 'AI Search Enabled' : 'AI Search Disabled'}
    >
      <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 ${isEnabled ? 'text-white' : 'text-gray-400'}`} />
      <span className="text-xs sm:text-sm font-medium">AI</span>
    </button>
  );
};
