import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onClose: () => void;
}

export const ImageCropModal = ({ isOpen, imageSrc, onCrop, onClose }: ImageCropModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onImageLoad = useCallback(() => {
    // Reset position first
    setPosition({ x: 0, y: 0 });
    
    // Calculate optimal initial zoom to fill the square crop area
    if (imgRef.current && containerRef.current) {
      const image = imgRef.current;
      const container = containerRef.current;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      const cropSize = Math.min(containerWidth, containerHeight);

      let optimalZoom;

      if (imageAspectRatio < containerAspectRatio) {
        // Portrait image (like 1080x1920) - zoom to fill crop width
        
        const displayWidth = containerHeight * imageAspectRatio;
        optimalZoom = cropSize / displayWidth;
      } else {
        // Landscape image (like 1920x1080) - zoom to fill crop height
        
        const displayHeight = containerWidth / imageAspectRatio;
        optimalZoom = cropSize / displayHeight;
      }

      // Ensure we don't exceed maximum zoom
      optimalZoom = Math.min(optimalZoom, 3);
      setZoom(optimalZoom);
    } else {
      setZoom(1);
    }
  }, []);

  // Calculate minimum zoom needed to fill the crop area (no black bars)
  const getMinimumZoom = useCallback(() => {
    if (!imgRef.current || !containerRef.current) {
      return 0.5;
    }

    const image = imgRef.current;
    const container = containerRef.current;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    const cropSize = Math.min(containerWidth, containerHeight);

    if (imageAspectRatio < containerAspectRatio) {
      // Portrait image - minimum zoom to fill crop width
      
      const displayWidth = containerHeight * imageAspectRatio;
      return cropSize / displayWidth;
    } else {
      // Landscape image - minimum zoom to fill crop height
      
      const displayHeight = containerWidth / imageAspectRatio;
      return cropSize / displayHeight;
    }
  }, []);

  // Calculate the actual image dimensions and position when using object-contain
  const getImageDimensions = useCallback(() => {
    if (!imgRef.current || !containerRef.current) {
      return null;
    }

    const image = imgRef.current;
    const container = containerRef.current;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - fit by width
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      // Image is taller than container - fit by height
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    return {
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight
    };
  }, []);

  // Calculate bounds for dragging to prevent moving out of crop area
  const getBounds = useCallback(() => {
    if (!imgRef.current || !containerRef.current) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const imageDims = getImageDimensions();
    if (!imageDims) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const cropSize = Math.min(containerWidth, containerHeight);

    // Calculate how much the image extends beyond the crop area when zoomed
    const scaledImageWidth = imageDims.displayWidth * zoom;
    const scaledImageHeight = imageDims.displayHeight * zoom;

    // Calculate the maximum movement allowed to keep crop area within image bounds
    const maxMoveX = Math.max(0, (scaledImageWidth - cropSize) / 2);
    const maxMoveY = Math.max(0, (scaledImageHeight - cropSize) / 2);

    return {
      minX: -maxMoveX,
      maxX: maxMoveX,
      minY: -maxMoveY,
      maxY: maxMoveY
    };
  }, [zoom, getImageDimensions]);

  // Constrain position within bounds
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const bounds = getBounds();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y))
    };
  }, [getBounds]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return; // Only allow dragging when zoomed in
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    setPosition(constrainPosition(newPosition));
  }, [isDragging, dragStart, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newPosition = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    };
    setPosition(constrainPosition(newPosition));
  }, [isDragging, dragStart, constrainPosition]);

  // Update preview whenever position or zoom changes
  const updatePreview = useCallback(() => {
    if (!imgRef.current || !canvasRef.current || !containerRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const imageDims = getImageDimensions();
    if (!imageDims) return;

    // Set canvas size for preview
    canvas.width = 128;
    canvas.height = 128;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, 128, 128);

    // Get the crop area (center square of the container)
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const cropSize = Math.min(containerWidth, containerHeight);
    
    // Calculate the center of the crop area
    const cropCenterX = containerWidth / 2;
    const cropCenterY = containerHeight / 2;

    // Calculate where this crop center maps to on the scaled image
    const scaledImageCenterX = imageDims.offsetX + (imageDims.displayWidth / 2);
    const scaledImageCenterY = imageDims.offsetY + (imageDims.displayHeight / 2);

    // Account for zoom and position
    const imageX = scaledImageCenterX + position.x;
    const imageY = scaledImageCenterY + position.y;

    // Calculate the offset from crop center to image center
    const offsetX = cropCenterX - imageX;
    const offsetY = cropCenterY - imageY;

    // Calculate source coordinates on the natural image
    const sourceX = (imageDims.naturalWidth / 2) + (offsetX / zoom) * (imageDims.naturalWidth / imageDims.displayWidth);
    const sourceY = (imageDims.naturalHeight / 2) + (offsetY / zoom) * (imageDims.naturalHeight / imageDims.displayHeight);
    const sourceSize = (cropSize / zoom) * (imageDims.naturalWidth / imageDims.displayWidth);

    // Ensure we don't go outside image bounds
    const clampedSourceX = Math.max(0, Math.min(sourceX - sourceSize/2, imageDims.naturalWidth - sourceSize));
    const clampedSourceY = Math.max(0, Math.min(sourceY - sourceSize/2, imageDims.naturalHeight - sourceSize));
    const clampedSourceSize = Math.min(sourceSize, imageDims.naturalWidth - clampedSourceX, imageDims.naturalHeight - clampedSourceY);

    if (clampedSourceSize > 0) {
      ctx.drawImage(
        imgRef.current,
        clampedSourceX,
        clampedSourceY,
        clampedSourceSize,
        clampedSourceSize,
        0,
        0,
        128,
        128
      );
    }
  }, [zoom, position, getImageDimensions]);

  // Update preview when values change
  useEffect(() => {
    const timer = setTimeout(updatePreview, 50);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const imageDims = getImageDimensions();
      if (!imageDims) {
        throw new Error('Could not get image dimensions');
      }

      // Set output size (512x512 for high quality profile picture)
      const outputSize = 512;
      tempCanvas.width = outputSize;
      tempCanvas.height = outputSize;
      ctx.imageSmoothingQuality = 'high';

      // Clear canvas
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Get the crop area (center square of the container)
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const cropSize = Math.min(containerWidth, containerHeight);
      
      // Calculate the center of the crop area
      const cropCenterX = containerWidth / 2;
      const cropCenterY = containerHeight / 2;

      // Calculate where this crop center maps to on the scaled image
      const scaledImageCenterX = imageDims.offsetX + (imageDims.displayWidth / 2);
      const scaledImageCenterY = imageDims.offsetY + (imageDims.displayHeight / 2);

      // Account for zoom and position
      const imageX = scaledImageCenterX + position.x;
      const imageY = scaledImageCenterY + position.y;

      // Calculate the offset from crop center to image center
      const offsetX = cropCenterX - imageX;
      const offsetY = cropCenterY - imageY;

      // Calculate source coordinates on the natural image
      const sourceX = (imageDims.naturalWidth / 2) + (offsetX / zoom) * (imageDims.naturalWidth / imageDims.displayWidth);
      const sourceY = (imageDims.naturalHeight / 2) + (offsetY / zoom) * (imageDims.naturalHeight / imageDims.displayHeight);
      const sourceSize = (cropSize / zoom) * (imageDims.naturalWidth / imageDims.displayWidth);

      // Ensure we don't go outside image bounds
      const clampedSourceX = Math.max(0, Math.min(sourceX - sourceSize/2, imageDims.naturalWidth - sourceSize));
      const clampedSourceY = Math.max(0, Math.min(sourceY - sourceSize/2, imageDims.naturalHeight - sourceSize));
      const clampedSourceSize = Math.min(sourceSize, imageDims.naturalWidth - clampedSourceX, imageDims.naturalHeight - clampedSourceY);

      if (clampedSourceSize > 0) {
        ctx.drawImage(
          imgRef.current,
          clampedSourceX,
          clampedSourceY,
          clampedSourceSize,
          clampedSourceSize,
          0,
          0,
          outputSize,
          outputSize
        );
      }

      tempCanvas.toBlob(
        (blob) => {
          if (blob) {
            onCrop(blob);
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [zoom, position, onCrop, getImageDimensions]);

  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    
    // Reset to optimal zoom (same as initial load)
    if (imgRef.current && containerRef.current) {
      const image = imgRef.current;
      const container = containerRef.current;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      const cropSize = Math.min(containerWidth, containerHeight);

      let optimalZoom;

      if (imageAspectRatio < containerAspectRatio) {
        // Portrait image - zoom to fill crop width
        
        const displayWidth = containerHeight * imageAspectRatio;
        optimalZoom = cropSize / displayWidth;
      } else {
        // Landscape image - zoom to fill crop height
        
        const displayHeight = containerWidth / imageAspectRatio;
        optimalZoom = cropSize / displayHeight;
      }

      optimalZoom = Math.min(optimalZoom, 3);
      setZoom(optimalZoom);
    } else {
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.2, 3);
      // Constrain position after zoom change
      setTimeout(() => {
        setPosition(currentPos => constrainPosition(currentPos));
      }, 0);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const minZoom = getMinimumZoom();
      const newZoom = Math.max(prev - 0.2, minZoom);
      // Constrain position after zoom change
      setTimeout(() => {
        setPosition(currentPos => constrainPosition(currentPos));
      }, 0);
      return newZoom;
    });
  };

  // Constrain position when zoom changes
  useEffect(() => {
    setPosition(currentPos => constrainPosition(currentPos));
  }, [zoom, constrainPosition]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/10" style={{ zIndex: 99999 }}>
      <div className="backdrop-blur-2xl bg-black/20 rounded-2xl shadow-2xl p-4 sm:p-8 max-w-lg w-full mx-4 border border-gray-700 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Crop Profile Picture</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-400 mb-4 text-center">
          {zoom > 1 ? 'Drag the image to reposition • Zoom in/out to adjust crop area' : 'Zoom in to crop a specific area of your image'}
        </p>

        {/* Crop Area with Overlay */}
        <div className="relative mb-6">
          <div 
            ref={containerRef}
            className="relative w-full aspect-square backdrop-blur-xl bg-black/30 rounded-lg border border-gray-700/30 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imgRef}
              alt="Crop"
              src={imageSrc}
              onLoad={onImageLoad}
              className="absolute inset-0 w-full h-full object-contain select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
              draggable={false}
            />
            
            {/* Crop overlay - shows the square crop area */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute top-1/2 left-1/2 w-full aspect-square bg-transparent border-2 border-blue-400"
                   style={{ 
                     transform: 'translate(-50%, -50%)',
                     maxWidth: '100%',
                     maxHeight: '100%',
                     boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)'
                   }}>
                {/* Grid lines for better cropping reference */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-blue-400/30" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-blue-400/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-blue-400/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-blue-400/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= getMinimumZoom()}
            className="flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl bg-black/30 border border-gray-700/30 text-white disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl bg-black/30 border border-gray-700/30">
            <span className="text-xs text-gray-400">Zoom:</span>
            <span className="text-sm text-white font-medium">{Math.round(zoom * 100)}%</span>
          </div>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl bg-black/30 border border-gray-700/30 text-white disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
          <div className="backdrop-blur-xl bg-black/30 rounded-lg p-4 border border-gray-700/30">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700/50 border-4 border-blue-600/30">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ 
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors backdrop-blur-xl bg-black/20 rounded-lg border border-gray-700/30"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 text-gray-400 hover:text-white transition-colors backdrop-blur-xl bg-black/20 rounded-lg border border-gray-700/30"
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600/80 hover:bg-blue-700/80 disabled:bg-blue-800/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed backdrop-blur-xl border border-blue-500/30"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
