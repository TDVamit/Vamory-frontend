import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Trash2, 
  MoreHorizontal,
  Eye,
  Volume2, VolumeX, RotateCcw, RotateCw, Pause, Play, Maximize2, Minimize2, Zap
} from 'lucide-react';
import { useFileManager } from '../hooks/useFileManager';
import { ConfirmDialog } from './ConfirmDialog';
import type { FileData } from '../types';

interface FileCardProps {
  file: FileData;
  onRefresh: () => void;
}

export const FileCard = ({ file, onRefresh }: FileCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { downloadFile, deleteFile } = useFileManager();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'bg-gray-600/90 text-white';
      case 'video':
        return 'bg-gray-600/90 text-white';
      case 'document':
        return 'bg-gray-600/90 text-white';
      default:
        return 'bg-gray-600/90 text-white';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Only one handleDownload function, used for both download button and elsewhere
  const handleDownload = async () => {
    if (file.s3_url) {
      window.open(file.s3_url, '_blank');
    } else {
      try {
        const downloadUrl = await downloadFile(file._id);
        if (downloadUrl) {
          window.open(downloadUrl, '_blank');
        }
      } catch (error) {
        console.error('Download failed:', error);
      }
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
    setIsDeleting(true);
    try {
      const success = await deleteFile(file._id);
      if (success) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleCardClick = () => {
    // For images and videos, the parent component will handle the gallery
    // For other file types, download directly
    if (file.file_type !== 'image' && file.file_type !== 'video') {
      handleDownload();
    }
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
  };

  // Default placeholder for non-image files
  const getDefaultThumbnail = () => {
    const colors = {
      image: 'from-gray-700/20 to-gray-800/10',
      video: 'from-gray-700/20 to-gray-800/10',
      document: 'from-gray-700/20 to-gray-800/10',
      other: 'from-gray-700/20 to-gray-800/10'
    };
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${colors[file.file_type] || colors.other} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getFileTypeColor(file.file_type).replace('bg-', 'text-').replace('/90', '')}`}>
            {file.filename.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {file.file_type === 'video' ? '' : file.file_type.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  // Video player state for custom controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // For press-and-hold 2x speed with delay
  const [is2xActive, setIs2xActive] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const is2xRef = useRef(false);
  const prevPlaybackRateRef = useRef(1);

  const handlePressStart = () => {
    pressTimerRef.current = window.setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        prevPlaybackRateRef.current = v.playbackRate;
        v.playbackRate = 2;
        setIs2xActive(true);
        is2xRef.current = true;
      }
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (is2xRef.current) {
      // Was in 2x mode, exit 2x
      const v = videoRef.current;
      if (v) {
        v.playbackRate = prevPlaybackRateRef.current;
      }
      setIs2xActive(false);
      is2xRef.current = false;
    } else {
      // Not in 2x mode, treat as click
      handlePlayPause();
    }
  };

  const handlePressCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (is2xRef.current) {
      const v = videoRef.current;
      if (v) {
        v.playbackRate = prevPlaybackRateRef.current;
      }
      setIs2xActive(false);
      is2xRef.current = false;
    }
  };

  useEffect(() => {
    if (!showPreview) return;
    setIsPlaying(false);
    setIsMuted(false);
    setVolume(1);
    setCurrentTime(0);
    setPlaybackRate(1);
    setIsFullscreen(false);
  }, [showPreview]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  };
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };
  const handleSeekRelative = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    let newTime = Math.max(0, Math.min(video.currentTime + delta, duration));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rate = parseFloat(e.target.value);
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };
  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!isFullscreen) {
      if (video.requestFullscreen) video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  // Listen for exiting fullscreen
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Set playbackRate via ref when it changes and video modal is open
  useEffect(() => {
    if (showPreview && file.file_type === 'video') {
      const v = videoRef.current;
      if (v) v.playbackRate = playbackRate;
    }
  }, [showPreview, file.file_type, playbackRate]);

  return (
    <>
      <div 
        className="relative aspect-square rounded-xl overflow-hidden card-hover group cursor-pointer bg-gray-900"
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        {(file.file_type === 'image' || file.file_type === 'video') && (file.thumbnail_s3_url || file.thumbnail_url) ? (
          <div className="relative w-full h-full">
            <img
              src={file.thumbnail_s3_url || file.thumbnail_url}
              alt={file.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {file.file_type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-12 h-12 text-white/90 drop-shadow-lg" fill="currentColor" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="24" fill="black" fillOpacity="0.4"/>
                  <polygon points="20,16 36,24 20,32" fill="white"/>
                </svg>
              </span>
            )}
          </div>
        ) : (
          getDefaultThumbnail()
        )}

        {/* Actions Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 bg-black/60 text-white hover:text-gray-300 transition-colors rounded-lg backdrop-blur-sm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 glass rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
              {file.file_type === 'image' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(true);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Image
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-gray-100 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(e);
                }}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Metadata Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4">
          <div className="text-white">
            <div className="flex items-center justify-between text-xs text-gray-300">
              {file.file_type !== 'image' && file.file_type !== 'video' && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getFileTypeColor(file.file_type)}`}>
                  {file.file_type.toUpperCase()}
                </span>
              )}
              <div className={`text-right ${file.file_type === 'image' || file.file_type === 'video' ? 'ml-auto' : ''}`}>
                <div className="text-sm">{formatFileSize(file.file_size)}</div>
                <div className="text-gray-400">{formatDate(file.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-gray-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>



      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete File"
        message={`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}; 