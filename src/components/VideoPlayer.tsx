'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { LectureItem, ServerOption } from '@/types';

interface VideoPlayerProps {
  playlist: LectureItem[];
  currentIndex: number;
  courseName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  currentIndex,
  courseName,
  onClose,
  onNavigate,
}) => {
  const currentItem = playlist[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);

  // Reset selected server when lecture item changes
  useEffect(() => {
    setSelectedServerIndex(0);
  }, [currentIndex]);

  const servers: ServerOption[] = currentItem?.servers && currentItem.servers.length > 0
    ? currentItem.servers
    : [{ name: 'Server 1', url: currentItem?.url || '', type: currentItem?.type }];

  const activeServer = servers[selectedServerIndex] || servers[0];
  const activeUrl = activeServer?.url || currentItem?.url || '';

  const getYouTubeID = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, []);

  const skipVideo = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    videoRef.current.currentTime = Math.max(0, Math.min(dur, videoRef.current.currentTime + seconds));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const target = containerRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) target.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!currentItem || currentItem.type !== 'hls' || !videoRef.current) return;

    const video = videoRef.current;
    setQualities([]);
    setCurrentQuality(-1);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
      hlsRef.current = hls;

      hls.loadSource(activeUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((lvl, idx) => ({ height: lvl.height, index: idx }));
        setQualities(levels);
        video.play().catch(() => {});
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeUrl;
      video.play().catch(() => {});
    }
  }, [currentItem, activeUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [currentItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipVideo(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipVideo(10);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipVideo, toggleFullscreen, onClose]);

  if (!currentItem) return null;
  const ytId = currentItem.type === 'youtube' ? getYouTubeID(activeUrl) : null;
  const isEmbedableExternal = activeUrl.includes('vidmoly.me/') || activeUrl.includes('morencius.com/') || activeUrl.includes('/w/') || activeUrl.includes('/v/');

  const handleDirectDownload = () => {
    const dlTarget = currentItem.downloadUrl || activeUrl;
    window.open(dlTarget, '_blank');
  };

  return (
    <div id="player-modal" className="open" role="dialog" aria-modal="true" aria-label="Video Player">
      <div className="player-backdrop" id="player-backdrop" onClick={onClose}></div>
      <div className="player-box" id="player-box" ref={containerRef}>
        <div className="player-top-bar" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className="player-info" style={{ flex: 1, minWidth: '200px' }}>
            <div className="player-course-label" id="player-course-label">{courseName}</div>
            <div className="player-lecture-title" id="player-lecture-title">{currentItem.label}</div>
          </div>

          {/* Server Switcher */}
          {servers.length > 1 && (
            <div className="server-switcher" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Servers:</span>
              {servers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedServerIndex(idx)}
                  className={`server-btn ${selectedServerIndex === idx ? 'active' : ''}`}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: selectedServerIndex === idx ? 'var(--accent)' : 'var(--bg-card)',
                    color: selectedServerIndex === idx ? '#ffffff' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Server {idx + 1}
                </button>
              ))}
            </div>
          )}

          <button className="player-close-btn" onClick={onClose} title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="player-screen" id="player-screen">
          {currentItem.type === 'hls' ? (
            <video ref={videoRef} controls autoPlay playsInline />
          ) : ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isEmbedableExternal ? (
            <iframe
              src={activeUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="player-ext-msg">
              <p>This lecture is hosted on an external site.</p>
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="open-ext-btn">
                Open Content ↗
              </a>
            </div>
          )}
        </div>

        <div className="player-controls">
          <button
            className="player-nav-btn"
            id="btn-prev"
            disabled={currentIndex === 0}
            onClick={() => onNavigate(currentIndex - 1)}
            title="Previous Lecture"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="ctrl-label">Prev</span>
          </button>

          <button
            className="player-nav-btn player-skip-btn"
            id="btn-skip-back"
            onClick={() => skipVideo(-10)}
            title="Skip back 10s (←)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
            <span className="ctrl-label">10s</span>
          </button>

          <button
            className="player-nav-btn player-play-btn"
            id="btn-play-pause"
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <svg id="icon-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg id="icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <button
            className="player-nav-btn player-skip-btn"
            id="btn-skip-fwd"
            onClick={() => skipVideo(10)}
            title="Skip forward 10s (→)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 17l5-5-5-5" />
              <path d="M6 17l5-5-5-5" />
            </svg>
            <span className="ctrl-label">10s</span>
          </button>

          {qualities.length > 0 && (
            <div id="quality-selector" style={{ position: 'relative' }}>
              <button
                className="player-nav-btn"
                id="btn-quality"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                Quality: {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height}p`}
              </button>
              {showQualityMenu && (
                <div
                  id="quality-menu"
                  style={{
                    display: 'block',
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '8px',
                    marginBottom: '8px',
                    zIndex: 100,
                    minWidth: '100px',
                  }}
                >
                  <button
                    className="quality-opt"
                    style={{ display: 'block', width: '100%', padding: '6px 10px', textAlign: 'left', fontSize: '12px' }}
                    onClick={() => {
                      if (hlsRef.current) hlsRef.current.currentLevel = -1;
                      setCurrentQuality(-1);
                      setShowQualityMenu(false);
                    }}
                  >
                    Auto
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      className="quality-opt"
                      style={{ display: 'block', width: '100%', padding: '6px 10px', textAlign: 'left', fontSize: '12px' }}
                      onClick={() => {
                        if (hlsRef.current) hlsRef.current.currentLevel = q.index;
                        setCurrentQuality(q.index);
                        setShowQualityMenu(false);
                      }}
                    >
                      {q.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="player-nav-btn"
            id="btn-download"
            onClick={handleDirectDownload}
            title="Direct Download Video"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="ctrl-label">Download</span>
          </button>

          <button
            className="player-nav-btn"
            id="btn-fullscreen"
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span className="ctrl-label">Fullscreen</span>
          </button>

          <button
            className="player-nav-btn"
            id="btn-next"
            disabled={currentIndex >= playlist.length - 1}
            onClick={() => onNavigate(currentIndex + 1)}
            title="Next Lecture"
          >
            <span className="ctrl-label">Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="player-progress-bar">
          <div className="player-progress-track" id="player-progress-track" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};
