import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface ActionDropdownOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ActionDropdownProps {
  options: ActionDropdownOption[];
  className?: string;
}

export const ActionDropdown = ({ options, className = '' }: ActionDropdownProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="text-gray-300 flex items-center justify-center focus:outline-none"
        aria-label="Actions"
        type="button"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-black/40 border border-gray-700/40 z-50 py-1 backdrop-blur-md">
          {options.map((opt, idx) => (
            <button
              key={opt.label}
              onClick={() => {
                setOpen(false);
                opt.onClick();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white flex items-center gap-2 transition-colors"
              type="button"
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 