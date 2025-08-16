import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Maximize2, Minimize2, Download, MoreVertical, Eye, Download as DownloadIcon, Trash2, Info } from 'lucide-react';
import type { FileData } from '../types';
import { useFileManager } from '../hooks/useFileManager';

interface MediaGalleryProps {
  files: FileData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onFileDeleted?: (fileId: string) => void;
  isPublic?: boolean;
  publicToken?: string;
}

export const MediaGallery = ({ files, currentIndex, onClose, onNavigate, onFileDeleted, isPublic = false, publicToken }: MediaGalleryProps) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(currentIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is2xActive, setIs2xActive] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { downloadFile, deleteFile } = useFileManager();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const is2xRef = useRef(false);
  const prevPlaybackRateRef = useRef(1);

  const currentFile = files[currentFileIndex];
  const isVideo = currentFile?.file_type === 'video';
  const isImage = currentFile?.file_type === 'image';

  // Navigation functions
  const goToPrevious = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
      onNavigate(currentFileIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
      onNavigate(currentFileIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          if (isVideo) {
            e.preventDefault();
            handlePlayPause();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentFileIndex, files.length, isVideo]);

  // Touch/swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe left - go to next
        goToNext();
      } else {
        // Swipe right - go to previous
        goToPrevious();
      }
    }

    setTouchStartX(0);
    setTouchStartY(0);
  };

  // Video controls
  const handlePressStart = () => {
    if (!isVideo) return;
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
    if (!isVideo) return;
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
    } else {
      handlePlayPause();
    }
  };

  const handlePressCancel = () => {
    if (!isVideo) return;
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

  const handlePlayPause = () => {
    if (!isVideo) return;
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
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  };

  const handleTimeUpdate = () => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleSeekRelative = (delta: number) => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    let newTime = Math.max(0, Math.min(video.currentTime + delta, duration));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const rate = parseFloat(e.target.value);
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleFullscreen = () => {
    if (!isVideo) return;
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

  const handleDownload = async () => {
    if (isPublic && currentFile) {
      // Use public /public/download endpoint for download
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'}/api/v1/files/${currentFile._id}/public/download`);
        const data = await response.json();
        const downloadUrl = data.download_url;
        const filename = data.filename || currentFile.filename || currentFile.original_filename || currentFile._id;
        if (!downloadUrl) {
          console.error(`No download_url for file ${currentFile.filename}`);
          return;
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (downloadError) {
        console.error(`Failed to download ${currentFile.filename}:`, downloadError);
      }
      return;
    }
    // Default (private) download logic
    if (currentFile) {
      try {
        const response = await downloadFile(currentFile._id);
        if (response && response.download_url) {
          const link = document.createElement('a');
          link.href = response.download_url;
          link.download = response.filename || currentFile.original_filename || currentFile.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleDelete = async () => {
    setShowOptions(false);
    setIsDeleting(true);
    try {
      const success = await deleteFile(currentFile._id);
      if (success) {
        if (onFileDeleted) onFileDeleted(currentFile._id);
        onClose();
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
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

  // Reset video state when file changes
  useEffect(() => {
    setCurrentFileIndex(currentIndex);
    setIsPlaying(false);
    setIsMuted(false);
    setVolume(1);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setIsFullscreen(false);
    setIs2xActive(false);
  }, [currentIndex]);

  // Listen for exiting fullscreen
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!currentFile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col h-screen bg-black/90 backdrop-blur-sm text-white select-none"
      tabIndex={-1}
      onClick={() => {
        if (!showOptions && !showInfoModal) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar: Close, Counter, Options */}
      <div className="flex items-center justify-between w-full px-6 pt-6 pb-2 z-20 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2 rounded-full bg-black/40 backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>
          {files.length > 1 && (
            <div className="text-white text-sm bg-black/60 rounded px-2 py-0.5 ml-1">
              {currentFileIndex + 1} / {files.length}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowOptions((v) => !v); }}
            className="text-white hover:text-gray-300 p-2 rounded-full bg-black/40 backdrop-blur-sm"
            aria-label="More options"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-40 bg-black/80 backdrop-blur-lg rounded-lg shadow-lg py-2 z-30 border border-gray-700" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setShowOptions(false); setShowInfoModal(true); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-700/30 hover:text-blue-200 flex items-center gap-2 transition-colors"
              >
                <Info className="w-4 h-4" />
                Info
              </button>
              <button
                onClick={async () => { setShowOptions(false); await handleDownload(); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white flex items-center gap-2 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
              {/* Only show delete if not public */}
              {!isPublic && (
                <button
                  onClick={() => { setShowOptions(false); setShowDeleteDialog(true); }}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content: image/video and arrows in a row, perfectly centered */}
      <div className="flex flex-1 items-center justify-center w-full max-w-7xl mx-auto px-1 sm:px-8" style={{height: 'calc(100vh - 64px)'}}>
        <div className="relative w-full h-full max-h-full max-w-[98vw] sm:max-w-[90vw] bg-black/80 rounded-xl mx-auto flex items-center justify-center p-1 sm:p-4">
          {/* Arrows and image/video in a row, centered */}
          <div className="flex items-center justify-center w-full h-full">
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                disabled={currentFileIndex === 0}
                className="text-white hover:text-gray-300 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                style={{ height: '48px', width: '48px' }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {/* Image or Video */}
            <div className="flex items-center justify-center w-full h-full">
              {isImage && (
                <img
                  src={currentFile.s3_url || currentFile.thumbnail_s3_url || currentFile.thumbnail_url}
                  alt={currentFile.filename}
                  className="w-full h-full max-w-[98vw] max-h-full object-contain rounded-lg"
                  onClick={e => e.stopPropagation()}
                />
              )}
              {isVideo && (
                <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                  <video
                    ref={videoRef}
                    src={currentFile.s3_url}
                    autoPlay
                    className="w-full h-full max-w-[98vw] max-h-full bg-black rounded-lg object-contain pb-16"
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressCancel}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    onTouchCancel={handlePressCancel}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onVolumeChange={() => {
                      const v = videoRef.current;
                      if (v) {
                        setVolume(v.volume);
                        setIsMuted(v.muted);
                      }
                    }}
                    muted={isMuted}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {is2xActive && (
                    <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-1 rounded-lg text-lg font-bold shadow-lg z-10 animate-pulse select-none pointer-events-none">
                      2x
                    </div>
                  )}
                </div>
              )}
            </div>
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                disabled={currentFileIndex === files.length - 1}
                className="text-white hover:text-gray-300 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                style={{ height: '48px', width: '48px' }}
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Controls (bottom) */}
      {isVideo && (
        <div className="absolute bottom-0 left-0 w-full bg-black/80 p-3 flex flex-col gap-2 rounded-b-lg z-20" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 w-full">
            {/* Play/Pause */}
            <button onClick={handlePlayPause} className="text-white hover:text-gray-300" aria-label="Play/Pause">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            {/* Seek Back 5s */}
            <button onClick={() => handleSeekRelative(-5)} className="text-white hover:text-gray-300" aria-label="Back 5s">
              <RotateCcw className="w-5 h-5" />
            </button>
            {/* Seek Forward 5s */}
            <button onClick={() => handleSeekRelative(5)} className="text-white hover:text-gray-300" aria-label="Forward 5s">
              <RotateCw className="w-5 h-5" />
            </button>
            {/* Time */}
            <span className="text-xs text-gray-200 w-12 text-right">{formatTime(currentTime)}</span>
            {/* Seek Bar */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 mx-2 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
            {/* Mute/Unmute */}
            <button onClick={handleMute} className="text-white hover:text-gray-300 ml-2" aria-label="Mute/Unmute">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {/* Volume Slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-blue-500"
            />
            {/* Quality Selector */}
            <select
              className="ml-2 bg-gray-800 text-white rounded px-1 py-0.5 text-xs"
              aria-label="Video quality"
              onChange={(e) => {
                const video = videoRef.current;
                if (video) {
                  console.log('Quality changed to:', e.target.value);
                }
              }}
            >
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="ml-2 bg-gray-800 text-white rounded px-1 py-0.5 text-xs"
              aria-label="Playback speed"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
            {/* Download */}
            <button onClick={handleDownload} className="text-white hover:text-gray-300 ml-2" aria-label="Download">
              <Download className="w-5 h-5" />
            </button>
            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="text-white hover:text-gray-300 ml-2" aria-label="Fullscreen">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border border-gray-700 max-h-screen overflow-y-auto mx-2" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowInfoModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center mb-8">
              <Info className="w-16 h-16 text-blue-400 mb-3 drop-shadow" />
              <h2 className="text-2xl xs:text-2xl sm:text-3xl font-semibold text-white mb-2 tracking-wide">File Details</h2>
              <div className="flex gap-3 mb-4 flex-wrap justify-center">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-blue-200 text-xs font-semibold shadow border border-gray-700">
                  Size: {formatFileSize(currentFile.file_size)}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 text-blue-200 text-xs font-semibold shadow border border-gray-700">
                  Created: {formatDate(currentFile.created_at)}
                </span>
              </div>
              <div className="w-full text-center break-words whitespace-pre-line text-lg font-medium text-white mb-2 px-2">
                {currentFile.filename}
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-xs">Vamory • Secure Cloud Storage</div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {!isPublic && showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-gray-700 animate-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowDeleteDialog(false)}
              >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center mb-8">
              <Trash2 className="w-16 h-16 text-red-400 mb-3 drop-shadow" />
              <h2 className="text-2xl font-semibold text-red-400 mb-2 tracking-wide">Delete File</h2>
              <div className="text-center text-white mb-4">
                Are you sure you want to delete <span className="font-bold break-words">{currentFile.filename}</span>?<br />This action cannot be undone.
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <button
                className="px-6 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 font-semibold border border-gray-600 transition-colors"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold border border-red-700 transition-colors"
                onClick={async () => {
                  setIsDeleting(true);
                  await handleDelete();
                  setIsDeleting(false);
                  setShowDeleteDialog(false);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 