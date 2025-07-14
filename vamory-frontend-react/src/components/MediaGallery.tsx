import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Maximize2, Minimize2, Download } from 'lucide-react';
import type { FileData } from '../types';

interface MediaGalleryProps {
  files: FileData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const MediaGallery = ({ files, currentIndex, onClose, onNavigate }: MediaGalleryProps) => {
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

  const handleDownload = () => {
    if (currentFile?.s3_url) {
      const link = document.createElement('a');
      link.href = currentFile.s3_url;
      link.download = currentFile.original_filename || currentFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors text-lg font-medium z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation arrows */}
      {files.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            disabled={currentFileIndex === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            disabled={currentFileIndex === files.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* File counter */}
      {files.length > 1 && (
        <div className="absolute top-4 left-4 text-white text-sm z-10">
          {currentFileIndex + 1} / {files.length}
        </div>
      )}

      {/* Content */}
      <div 
        className="relative max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={currentFile.s3_url || currentFile.thumbnail_s3_url || currentFile.thumbnail_url}
            alt={currentFile.filename}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}

        {isVideo && (
          <div className="relative w-full">
            <video
              ref={videoRef}
              src={currentFile.s3_url}
              autoPlay
              className="w-full max-h-[70vh] bg-black rounded-lg"
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

        {/* Video Controls */}
        {isVideo && (
          <div className="w-full bg-black/80 p-3 flex flex-col gap-2 rounded-b-lg mt-2">
            <div className="flex items-center gap-2 w-full">
              {/* Play/Pause */}
              <button onClick={handlePlayPause} className="text-white hover:text-gray-300" aria-label="Play/Pause">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              {/* Seek Back 10s */}
              <button onClick={() => handleSeekRelative(-10)} className="text-white hover:text-gray-300" aria-label="Back 10s">
                <RotateCcw className="w-5 h-5" />
              </button>
              {/* Seek Forward 10s */}
              <button onClick={() => handleSeekRelative(10)} className="text-white hover:text-gray-300" aria-label="Forward 10s">
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

        {/* File details */}
        <div className="w-full bg-black/90 text-white p-4 rounded-b-lg mt-2">
          <h3 className="font-medium text-lg truncate" title={currentFile.filename}>
            {currentFile.filename}
          </h3>
          <p className="text-gray-300 text-sm">
            {formatFileSize(currentFile.file_size)} • {formatDate(currentFile.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}; 