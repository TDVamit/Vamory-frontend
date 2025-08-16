import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Folder, MoreVertical, Trash2, Edit3, RefreshCw, Share2, FileText, Folder as FolderIcon, Database, Users, Info } from 'lucide-react';
import { useFolderManager } from '../hooks/useFolderManager';
import { ConfirmDialog } from './ConfirmDialog';
import { EditFolderModal } from './EditFolderModal';
import { StorageConversionModal } from './StorageConversionModal';
import { ShareFolderModal } from './ShareFolderModal';
import { ConversionStatusModal } from './ConversionStatusModal';
import type { Folder as FolderType } from '../types';
import type { FileData } from '../types';

interface FolderCardProps {
  folder: FolderType;
  onClick?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
  videoFile?: FileData; // Optional video file for the folder
  isPublic?: boolean; // Add this prop
}

export const FolderCard = ({ folder, onClick, onDelete, onUpdate, videoFile, isPublic }: FolderCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStorageConversionModal, setShowStorageConversionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConversionStatusModal, setShowConversionStatusModal] = useState(false);
  const [_dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number}>({top: 0, left: 0});
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Conditionally use useFolderManager hook
  const { deleteFolder, isLoading: isDeleting, error } = isPublic ? { deleteFolder: async () => false, isLoading: false, error: null } : useFolderManager();

  // Calculate effective status based on conversion completion and retrieval days
  const getEffectiveStatus = (): 'active' | 'inactive' | 'converting' | 'copying' => {
    if (folder.status === 'copying') return 'copying';
    if (folder.status === 'converting') return 'converting';
    if (folder.status === 'inactive') return 'inactive';
    
    // Check if folder should be considered inactive based on date calculation
    if (folder.conversion_estimated_completion && folder.retrieval_days) {
      const completionDate = new Date(folder.conversion_estimated_completion);
      const expiryDate = new Date(completionDate.getTime() + (folder.retrieval_days * 24 * 60 * 60 * 1000));
      const today = new Date();
      
      if (today > expiryDate) {
        return 'inactive';
      }
    }
    
    return 'active';
  };

  const effectiveStatus = getEffectiveStatus();
  const isClickable = effectiveStatus === 'active';
  const canShowActions = effectiveStatus !== 'converting' && effectiveStatus !== 'copying'; // No actions for converting/copying
  const canShare = !folder.shared_by_name; // Cannot share folders that are shared by others
  const isSharedByOthers = !!folder.shared_by_name; // Folder is shared by someone else
  const isSharedWithOthers = folder.shared_with && folder.shared_with.length > 0; // Folder is shared with others

  const handleCardClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuNode = menuRef.current;
      const buttonNode = menuButtonRef.current;
      // If click is outside both the menu and the button, close the dropdown
      if (
        menuNode && !menuNode.contains(event.target as Node) &&
        buttonNode && !buttonNode.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  // Show error if deletion fails
  useEffect(() => {
    if (error) {
      alert(`Error: ${error}`);
    }
  }, [error]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStorageTypeColor = (storageType: string) => {
    switch (storageType) {
      case 'STANDARD_IA':
        return 'text-gray-300';
      case 'GLACIER_IR':
        return 'text-gray-300';
      case 'DEEP_ARCHIVE':
        return 'text-gray-300';
      default:
        return 'text-gray-300';
    }
  };

  const getStorageTypeDotColor = (storageType: string) => {
    switch (storageType) {
      case 'STANDARD_IA':
        return 'bg-gray-400';
      case 'GLACIER_IR':
        return 'bg-gray-500';
      case 'DEEP_ARCHIVE':
        return 'bg-gray-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStorageTypeLabel = (storageType: string) => {
    switch (storageType) {
      case 'STANDARD_IA':
        return 'Standard';
      case 'GLACIER_IR':
        return 'Glacier';
      case 'DEEP_ARCHIVE':
        return 'Archive';
      default:
        return storageType;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    // Use requestAnimationFrame to ensure the state update happens in the next frame
    requestAnimationFrame(() => {
      setShowDeleteDialog(true);
    });
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    const success = await deleteFolder(folder._id);
    if (success && onDelete) {
      onDelete();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleStorageConversion = () => {
    setShowStorageConversionModal(true);
  };

  const handleStorageConversionSuccess = () => {
    setShowStorageConversionModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleShareSuccess = () => {
    setShowShareModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  // Add this handler for conversion status check
  const handleConversionStatusChecked = (shouldRefetch: boolean) => {
    setShowConversionStatusModal(false);
    if (shouldRefetch && onUpdate) {
      onUpdate();
    }
  };

  // Default folder thumbnail
  const getDefaultThumbnail = () => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-700/30 to-gray-800/20 backdrop-blur-sm flex items-center justify-center border border-gray-600/20">
        <div className="text-center">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <div className="text-xs text-gray-500">
            {folder.file_count || 0} files
          </div>
        </div>
      </div>
    );
  };

  // When opening the menu, check if there's enough space below, otherwise open upwards, and set absolute position
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate, or count options * option height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let direction: 'down' | 'up' = 'down';
      let top = rect.bottom + 8;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        direction = 'up';
        top = rect.top - dropdownHeight - 8;
      }
      setDropdownDirection(direction);
      setDropdownPosition({
        top,
        left: rect.left + rect.width - 140 // 140px = min width of menu
      });
    }
    setShowActions((prev) => !prev);
  };

  return (
    <>
      <div className={`relative aspect-square rounded-xl overflow-hidden card-hover group bg-gray-900 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
        {/* Thumbnail */}
        <div
          onClick={videoFile && videoFile.file_type === 'video' ? () => setShowVideoModal(true) : handleCardClick}
          className="w-full h-full relative"
        >
          {videoFile && videoFile.file_type === 'video' && videoFile.thumbnail_url ? (
            <>
              <img
                src={videoFile.thumbnail_url}
                alt={folder.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Play button overlay */}
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition group/video-play"
                style={{ pointerEvents: 'none' }}
                tabIndex={-1}
                aria-label="Play video"
                disabled
              >
                <svg className="w-14 h-14 text-white/80 drop-shadow-lg" fill="currentColor" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="black" fillOpacity="0.4"/><polygon points="20,16 36,24 20,32" fill="white"/></svg>
              </button>
            </>
          ) : folder.thumbnail_url ? (
            <img
              src={folder.thumbnail_url}
              alt={folder.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            getDefaultThumbnail()
          )}
        </div>

        {/* Actions Menu - Only show for active folders */}
        {canShowActions && (
          <div className={"absolute top-2 right-2 z-30"} ref={menuRef} style={{ overflow: 'visible' }}>
            <div className="bg-black/60 rounded-lg p-1.5 flex items-center justify-center">
              <button
                ref={menuButtonRef}
                onClick={handleMenuButtonClick}
                className="text-gray-300 flex items-center justify-center focus:outline-none"
                disabled={isDeleting}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            {showActions && createPortal(
              <div 
                ref={menuRef}
                className="fixed bg-black/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-600/20 z-50 py-1 min-w-[140px]"
                style={{overflow: 'visible', top: dropdownPosition.top, left: dropdownPosition.left, minWidth: 140}}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    setShowInfoModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-blue-700/30 hover:text-blue-200 transition-colors flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  Info
                </button>
                {/* Only show the rest of the options if not public */}
                {!isPublic && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(false);
                        setShowEditModal(true);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(false);
                        handleStorageConversion();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Convert Storage
                    </button>
                    {canShare && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(false);
                          handleShare();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        {isSharedWithOthers ? 'Manage Shares' : 'Share'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>,
              document.body
            )}
          </div>
        )}
        {!canShowActions && effectiveStatus === 'converting' && (
          <div className={"absolute top-2 right-2 z-30"} ref={menuRef} style={{ overflow: 'visible' }}>
            <div className="bg-black/60 rounded-lg p-1.5 flex items-center justify-center">
              <button
                ref={menuButtonRef}
                onClick={handleMenuButtonClick}
                className="text-gray-300 flex items-center justify-center focus:outline-none"
                disabled={isDeleting}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            {showActions && createPortal(
              <div
                ref={menuRef}
                className="fixed bg-black/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-600/20 z-50 py-1 min-w-[140px]"
                style={{overflow: 'visible', top: dropdownPosition.top, left: dropdownPosition.left, minWidth: 140}}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    setShowConversionStatusModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-blue-700/30 hover:text-blue-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Conversion Status
                </button>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* Status Indicator for Non-Active Folders */}
        {effectiveStatus !== 'active' && (
          <div className="absolute top-2 left-2 backdrop-blur-sm border border-black bg-black/80 rounded-lg px-2 py-1 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {effectiveStatus === 'converting' ? 'Converting' : effectiveStatus === 'copying' ? 'Copying' : effectiveStatus === 'inactive' ? 'Inactive' : ''}
            </span>
          </div>
        )}

        {/* Check Conversion Status Button for 'converting' folders */}
        {/* This block is removed as per the edit hint */}

        {/* Shared Indicator - when folder is shared by someone else */}
        {isSharedByOthers && false && (
          <div className="absolute top-2 right-2" style={{overflow: 'visible', zIndex: 30}}>
            <div className="relative group/share" style={{overflow: 'visible'}}>
              <Users className="w-5 h-5 text-blue-300 cursor-pointer" />
              <div className="absolute right-0 mt-2 z-50 px-3 py-1 rounded bg-black text-white text-xs opacity-0 group-hover/share:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-lg" style={{top: '100%', minWidth: 'max-content'}}>
                Shared by {folder.shared_by_name}
              </div>
            </div>
          </div>
        )}

        {/* Shared With Others Indicator */}
        {false && (
          <div className="absolute top-2 right-12 backdrop-blur-sm border rounded-lg px-2 py-1 flex items-center justify-center bg-green-500/20 border-green-500/40">
            <Share2 className="w-3 h-3 text-green-300 mr-1" />
            <span className="text-xs font-medium text-green-300">
              Shared with {folder.shared_with!.length}
            </span>
          </div>
        )}

        {/* Metadata Overlay: Always show name, show stats only on hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2">
          <div className="text-white">
            <div className="relative h-10 flex items-center" style={{minHeight: '3.2rem'}}>
              <h3 className={
                `font-medium text-[11px] xs:text-xs sm:text-sm md:text-base text-shadow-lg flex items-center gap-2 truncate transition-all duration-300 absolute left-0 right-0 w-full ${
                  'bottom-0 group-hover:top-0 group-hover:bottom-auto top-1 group-hover:translate-y-0 translate-y-[40%]'
                }`
              } title={folder.name} style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)', maxWidth: '100%', paddingBottom: 0, paddingTop: 2}}>
                {/* Shared icon before folder name, in white */}
                {isSharedWithOthers && !isSharedByOthers && (
                  <span className="flex items-center" style={{marginTop: 2}}><Share2 className="w-4 h-4 text-white" /></span>
                )}
                {isSharedByOthers && (
                  <span className="flex items-center" style={{marginTop: 2}}><Users className="w-4 h-4 text-white" /></span>
                )}
                <span className="truncate max-w-[70%]" title={folder.name}>{folder.name}</span>
              </h3>
              <div className="flex items-center gap-2 text-[8px] xs:text-[9px] sm:text-xs text-gray-300 justify-start min-w-0 overflow-hidden absolute left-0 right-0 w-full opacity-0 group-hover:opacity-100 transition-all duration-300" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)', top: '1.8rem'}}>
                {folder.total_size !== undefined && (
                  <span className="flex items-center gap-1 whitespace-nowrap truncate"><Database className="w-4 h-4 text-gray-400" />{formatSize(folder.total_size)}</span>
                )}
                <span className="flex items-center gap-1 truncate">
                  <span className={`w-2 h-2 rounded-full ${getStorageTypeDotColor(folder.storage_type)} shadow-lg`}></span>
                  <span className={`font-medium ${getStorageTypeColor(folder.storage_type)}`}>{getStorageTypeLabel(folder.storage_type)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-gray-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        {/* Deleting overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-300 rounded-full animate-spin" />
              <span className="text-sm">Deleting...</span>
            </div>
          </div>
        )}
      </div>

      {/* Folder Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border border-gray-700">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowInfoModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center mb-8">
              <Folder className="w-16 h-16 text-blue-400 mb-3 drop-shadow" />
              <h2 className="text-2xl xs:text-2xl sm:text-3xl font-semibold text-white mb-2 tracking-wide">Folder Details</h2>
              <div className="flex gap-3 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/60 text-blue-300 text-xs xs:text-sm font-semibold shadow border border-gray-700">
                  <FileText className="w-4 h-4" />{folder.file_count || 0}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/60 text-blue-300 text-xs xs:text-sm font-semibold shadow border border-gray-700">
                  <FolderIcon className="w-4 h-4" />{folder.subfolder_count || 0}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/60 text-blue-300 text-xs xs:text-sm font-semibold shadow border border-gray-700">
                  <Database className="w-4 h-4" />{folder.total_size !== undefined ? formatSize(folder.total_size) : '0 B'}
                </span>
              </div>
              <div className="text-gray-300 text-xs xs:text-sm sm:text-lg font-bold break-all text-center px-2 mb-1">
                {folder.name}
              </div>
              {isSharedByOthers && (
                <div className="text-sm text-gray-400 text-center mb-4">Shared by {folder.shared_by_name}</div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-gray-300 mb-6">
              {isSharedWithOthers && !isSharedByOthers && <><div className="flex items-center gap-2"><Users className="w-5 h-5 text-green-300" /><span className="font-medium">Shared with</span></div><div className="pl-2">{folder.shared_with!.length}</div></>}
            </div>
            <div className="flex flex-wrap gap-3 justify-center mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-blue-200 text-xs font-semibold shadow border border-gray-700">
                <span className={`w-3 h-3 rounded-full ${getStorageTypeDotColor(folder.storage_type)} shadow-lg inline-block`}></span>
                {getStorageTypeLabel(folder.storage_type)}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-gray-200 text-xs font-semibold shadow border border-gray-700">
                <span className="font-medium">Created</span> {formatDate(folder.created_at)}
              </span>
            </div>
            <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-xs">Vamory • Secure Cloud Storage</div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog - Only show if not public */}
      {!isPublic && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Folder"
          message={`Are you sure you want to delete "${folder.name}"? This action cannot be undone and will permanently delete all files and subfolders within it.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Edit Folder Modal - Only for active folders */}
      {canShowActions && (
        <EditFolderModal
          isOpen={showEditModal}
          folder={folder}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Storage Conversion Modal */}
      <StorageConversionModal
        isOpen={showStorageConversionModal}
        folder={folder}
        onClose={() => setShowStorageConversionModal(false)}
        onSuccess={handleStorageConversionSuccess}
      />

      {/* Share Folder Modal */}
      <ShareFolderModal
        isOpen={showShareModal}
        folder={folder}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleShareSuccess}
      />

      {/* Video Modal */}
      {videoFile && videoFile.file_type === 'video' && (
        showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative bg-black rounded-lg shadow-lg max-w-2xl w-full p-4">
              <button
                className="absolute top-2 right-2 text-white text-2xl font-bold hover:text-gray-300"
                onClick={() => setShowVideoModal(false)}
                aria-label="Close video"
              >
                &times;
              </button>
              <video
                src={videoFile.s3_url}
                controls
                autoPlay
                className="w-full h-[360px] bg-black rounded-lg"
                style={{ maxHeight: '70vh' }}
              >
                Your browser does not support the video tag.
              </video>
              <div className="mt-2 text-white text-sm truncate">{videoFile.original_filename || videoFile.filename}</div>
            </div>
          </div>
        )
      )}

      {/* Conversion Status Modal */}
      <ConversionStatusModal
        isOpen={showConversionStatusModal}
        folder={folder}
        onClose={() => setShowConversionStatusModal(false)}
        onStatusChecked={handleConversionStatusChecked}
      />
    </>
  )
} 