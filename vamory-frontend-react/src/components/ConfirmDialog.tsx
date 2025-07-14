import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-400',
          confirmButton: 'bg-red-600/20 hover:bg-red-600/30 border-red-500/40 text-red-300 hover:text-red-200',
          iconBg: 'bg-red-500/20'
        };
      case 'warning':
        return {
          icon: 'text-yellow-400',
          confirmButton: 'bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500/40 text-yellow-300 hover:text-yellow-200',
          iconBg: 'bg-yellow-500/20'
        };
      case 'info':
        return {
          icon: 'text-blue-400',
          confirmButton: 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-300 hover:text-blue-200',
          iconBg: 'bg-blue-500/20'
        };
    }
  };

  const styles = getVariantStyles();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={handleBackdropClick}
      />
      {/* Dialog */}
      <div
        className="relative z-10 glass bg-black/50 rounded-xl shadow-2xl max-w-md w-full border border-gray-700/40 p-8 flex flex-col items-center"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-700/30"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
          <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-lg transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2 border rounded-lg transition-all font-medium ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};