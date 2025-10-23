import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import './App.css'

interface Video {
  id: string
  s3_key: string
  cdn_url: string
  m3u8_url: string | null
  created_at: string
  uploaded_at: string
  status: string
}

interface ApiResponse {
  data: Video[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

interface QualityLevel {
  height: number
  bitrate: number
  index: number
}

function App() {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [viewMode, setViewMode] = useState<'library' | 'url'>('library')
  const [customUrl, setCustomUrl] = useState<string>('')
  const [currentSourceUrl, setCurrentSourceUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState<number>(-1)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.quality-selector')) {
        setShowQualityMenu(false)
      }
    }

    if (showQualityMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showQualityMenu])

  useEffect(() => {
    if (currentSourceUrl && videoRef.current) {
      playVideo(currentSourceUrl)
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [currentSourceUrl])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(
        'https://api.vamory.vadaevri.com/api/v1/cdn/urls?page=1&per_page=20&secret_key=E72E2FF3D6519451D82B5BAA15A11',
        {
          credentials: 'include'
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data: ApiResponse = await response.json()
      const videosWithM3u8 = data.data.filter(video => video.m3u8_url !== null)
      setVideos(videosWithM3u8)
      
      // Auto-select first video if available
      if (videosWithM3u8.length > 0) {
        setSelectedVideo(videosWithM3u8[0])
        setCurrentSourceUrl(videosWithM3u8[0].m3u8_url as string)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const playVideo = (m3u8Url: string) => {
    if (!videoRef.current) return;
  
    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
  
    // Reset quality levels
    setQualityLevels([]);
    setCurrentQuality(-1);
  
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: function (xhr, url) {
          // Remove cookies (cross-domain iframe won't allow them)
          xhr.withCredentials = false;
  
          // Append the same signature/query params from master.m3u8 to each segment
          // Assume your master.m3u8 URL has ?Expires=...&Signature=...&Key-Pair-Id=...
          const masterUrl = new URL(m3u8Url);
          const segmentUrl = new URL(url, masterUrl.origin + masterUrl.pathname);
  
          // Copy query params from master.m3u8
          masterUrl.searchParams.forEach((value, key) => {
            segmentUrl.searchParams.set(key, value);
          });
  
          xhr.open('GET', segmentUrl.toString(), true);
        }
      });
  
      hls.loadSource(m3u8Url);
      hls.attachMedia(videoRef.current);
  
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          bitrate: level.bitrate,
          index: index
        }));
        setQualityLevels(levels);
        setCurrentQuality(hls.currentLevel);
        videoRef.current?.play();
      });
  
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentQuality(data.level);
      });
  
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error:", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error:", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error:", data);
              break;
          }
        }
      });
  
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      videoRef.current.src = m3u8Url;
      videoRef.current.play();
    }
  };
  

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex
      setCurrentQuality(levelIndex)
      setShowQualityMenu(false)
    }
  }

  const getQualityLabel = (level: QualityLevel) => {
    if (level.height >= 2160) return '4K'
    if (level.height >= 1440) return '2K'
    if (level.height >= 1080) return '1080p'
    if (level.height >= 720) return '720p'
    if (level.height >= 480) return '480p'
    if (level.height >= 360) return '360p'
    return `${level.height}p`
  }

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video)
    setShowQualityMenu(false)
    if (video.m3u8_url) {
      setCurrentSourceUrl(video.m3u8_url)
    }
  }

  const handlePlayCustomUrl = () => {
    const trimmed = customUrl.trim()
    if (!trimmed) return
    setSelectedVideo(null)
    setCurrentSourceUrl(trimmed)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading videos...</div>
      </div>
    )
  }

  if (error) {
  return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchVideos}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎥 M3U8 Video Player</h1>
        <p className="subtitle">{videos.length} videos available</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('library')}
            className={viewMode === 'library' ? 'quality-button' : 'video-button'}
          >
            Library
          </button>
          <button
            onClick={() => setViewMode('url')}
            className={viewMode === 'url' ? 'quality-button' : 'video-button'}
          >
            URL Player
          </button>
        </div>
      </header>

      <div className="container" style={{ gridTemplateColumns: viewMode === 'url' ? '1fr' : undefined }}>
        {viewMode === 'library' && (
          <aside className="sidebar">
            <h2>Video Library</h2>
            <div className="video-list">
              {videos.map((video) => (
                <button
                  key={video.id}
                  className={`video-button ${selectedVideo?.id === video.id ? 'active' : ''}`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="video-info">
                    <div className="video-title">
                      {video.s3_key.split('/').pop() || 'Unknown'}
                    </div>
                    <div className="video-meta">
                      <span className={`status ${video.status.toLowerCase()}`}>
                        {video.status}
                      </span>
                      <span className="date">{formatDate(video.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="player-section">
          {viewMode === 'url' && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Paste an m3u8 URL here..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />
              <button className="quality-button" onClick={handlePlayCustomUrl}>Play</button>
            </div>
          )}
          {currentSourceUrl ? (
            <>
              <div className="player-wrapper">
                <video
                  ref={videoRef}
                  className="video-player"
                  controls
                  autoPlay
                />
                {qualityLevels.length > 0 && (
                  <div className="quality-selector">
                    <button
                      className="quality-button"
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                    >
                      ⚙️ Quality: {currentQuality === -1 ? 'Auto' : getQualityLabel(qualityLevels[currentQuality])}
                    </button>
                    {showQualityMenu && (
                      <div className="quality-menu">
                        <button
                          className={`quality-option ${currentQuality === -1 ? 'active' : ''}`}
                          onClick={() => handleQualityChange(-1)}
                        >
                          Auto
                        </button>
                        {qualityLevels
                          .sort((a, b) => b.height - a.height)
                          .map((level) => (
                            <button
                              key={level.index}
                              className={`quality-option ${currentQuality === level.index ? 'active' : ''}`}
                              onClick={() => handleQualityChange(level.index)}
                            >
                              {getQualityLabel(level)}
                              <span className="quality-bitrate">
                                {(level.bitrate / 1000000).toFixed(1)} Mbps
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedVideo && (
                <div className="video-details">
                  <h3>Now Playing</h3>
                  <div className="detail-item">
                    <strong>File:</strong> {selectedVideo.s3_key}
                  </div>
                  <div className="detail-item">
                    <strong>ID:</strong> {selectedVideo.id}
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong> {selectedVideo.status}
                  </div>
                  <div className="detail-item">
                    <strong>Uploaded:</strong> {formatDate(selectedVideo.uploaded_at)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-video">
              <p>No source selected</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
