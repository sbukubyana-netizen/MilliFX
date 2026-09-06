import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Maximize2, Minimize2, ChevronLeft, ChevronRight, 
  Volume2, Volume1, VolumeX, PictureInPicture2, X, Settings, 
  Gauge, SlidersHorizontal, SkipBack, SkipForward, Clock, Layers 
} from 'lucide-react';

interface HeroBannerProps {
  onPlayAll: () => void;
  profile?: 'Girlfriend' | 'Boyfriend' | 'Us';
  bannerVideos?: string[];
  soundEnabled?: boolean;
}

export default function HeroBanner({ onPlayAll, profile, bannerVideos, soundEnabled = false }: HeroBannerProps) {
  const DEFAULT_VIDEOS = [
    'videos/6.mp4', 
    'videos/7.mp4',
    'https://www.youtube.com/watch?v=Fst6I72W60A', // Beautiful Romantic Trailer
    'https://www.youtube.com/watch?v=gcc96_C2c0M'  // Cinematic Romance Loop
  ];
  const activeVideos = bannerVideos && bannerVideos.length > 0 ? bannerVideos : DEFAULT_VIDEOS;
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee that the currentVideoIndex can never exceed the active list length on dynamically switching profiles
  useEffect(() => {
    setCurrentVideoIndex(0);
  }, [activeVideos.length]);

  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlayingPlaylistMusic, setIsPlayingPlaylistMusic] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [miniWidth, setMiniWidth] = useState(380);
  const [showPlaceholderGuide, setShowPlaceholderGuide] = useState(false);
  const [showMiniSettings, setShowMiniSettings] = useState(false);
  const [isCinemaAutoplay, setIsCinemaAutoplay] = useState(false);

  // Video Volume, Speed and Slide Control States
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_hero_volume');
    return saved !== null ? parseFloat(saved) : 0.85;
  });
  const [isExplicitlyMuted, setIsExplicitlyMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_hero_speed');
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [slideInterval, setSlideInterval] = useState<number>(10000); // 10s default slide cycle
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSlideIntervalMenu, setShowSlideIntervalMenu] = useState(false);

  const currentBackdropUrl = activeVideos[currentVideoIndex] || '';

  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const s = url.trim();
    let match = s.match(/(?:search_query=|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    match = s.match(/(?:embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    match = s.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    match = s.match(/\/([a-zA-Z0-9_-]{11})(?:\?|&|$)/);
    if (match) return match[1];
    return null;
  };

  const ytId = getYouTubeId(currentBackdropUrl);
  const isYouTube = !!ytId;
  const isVideo = currentBackdropUrl.endsWith('.mp4') || 
                  currentBackdropUrl.endsWith('.webm') || 
                  currentBackdropUrl.includes('video') || 
                  currentBackdropUrl.startsWith('data:video/');

  const isVideoMuted = isExplicitlyMuted || !localSoundEnabled || isPlayingPlaylistMusic || volume === 0;

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('millisbu_hero_volume', newVol.toString());
    if (newVol === 0) {
      setIsExplicitlyMuted(true);
    } else if (isExplicitlyMuted) {
      setIsExplicitlyMuted(false);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExplicitlyMuted(prev => !prev);
    if (!localSoundEnabled) setLocalSoundEnabled(true);
  };

  const handleSpeedChange = (newSpeed: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaybackSpeed(newSpeed);
    localStorage.setItem('millisbu_hero_speed', newSpeed.toString());
    setShowSpeedMenu(false);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    if (isYouTube && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
          '*'
        );
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    if (isVideo) {
      if (videoRef.current) {
        if (nextPaused) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(err => console.warn(err));
        }
      }
    } else if (isYouTube && iframeRef.current?.contentWindow) {
      const command = nextPaused ? 'pauseVideo' : 'playVideo';
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: command, args: [] }),
          '*'
        );
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.posX + dx,
      y: dragRef.current.posY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 380, edge: 'right' });

  const handleResizeDown = (e: React.PointerEvent, edge: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startWidth: miniWidth,
      edge
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeRef.current.startX;
    const change = resizeRef.current.edge === 'right' ? dx : -dx;
    const newWidth = Math.max(200, Math.min(800, resizeRef.current.startWidth + change));
    setMiniWidth(newWidth);
  };

  const handleResizeUp = (e: React.PointerEvent) => {
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    if (isMaximized) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  useEffect(() => {
    if (activeVideos.length <= 1 || isPaused || slideInterval === 0) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length);
    }, slideInterval);
    return () => clearInterval(interval);
  }, [activeVideos.length, currentVideoIndex, isPaused, slideInterval]);

  const handleNextVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPaused(false);
    setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length);
  };

  const handlePrevVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPaused(false);
    setCurrentVideoIndex((prev) => (prev - 1 + activeVideos.length) % activeVideos.length);
  };

  useEffect(() => {
    setLocalSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const handleMusicState = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { isPlaying } = customEvent.detail || {};
      if (isPlaying !== undefined) {
        setIsPlayingPlaylistMusic(isPlaying);
      }
    };
    window.addEventListener('millifix-audio-state', handleMusicState);

    // Request initial state from vinyl player
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'request-state' } }));

    return () => {
      window.removeEventListener('millifix-audio-state', handleMusicState);
    };
  }, []);

  // Listen for any user gesture on the page to dynamic unmute/trigger audio playback bypass
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!isVideoMuted && iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } catch (err) {
          console.warn('Interaction unmute attempt deferred', err);
        }
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleFirstUserInteraction, { capture: true });
      window.removeEventListener('touchstart', handleFirstUserInteraction, { capture: true });
    };
  }, [isVideoMuted, volume]);

  useEffect(() => {
    const handleAudioEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { play, soundEnabled: detailSoundEnabled } = customEvent.detail || {};
      
      if (detailSoundEnabled !== undefined) {
        setLocalSoundEnabled(detailSoundEnabled);
      }
      
      if (videoRef.current) {
        if (play && !isPlayingPlaylistMusic) {
          videoRef.current.muted = false;
          videoRef.current.play().catch(err => {
            console.warn("Manual play attempt was blocked. Retrying with audio context gesture...", err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error("Muted fallback failed:", e));
            }
          });
        } else {
          videoRef.current.muted = true;
        }
      }
    };

    window.addEventListener('millifix-play-backdrop-audio', handleAudioEvent);
    return () => window.removeEventListener('millifix-play-backdrop-audio', handleAudioEvent);
  }, [isPlayingPlaylistMusic]);

  const scrollToContent = () => {
    const content = document.querySelector('main > div');
    if (content) content.scrollIntoView({ behavior: 'smooth' });
  };

  // Synchronize volume, mute, playback speed to YouTube iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const volNum = isVideoMuted ? 0 : Math.round(volume * 100);
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: isVideoMuted ? 'mute' : 'unMute', args: [] }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [volNum] }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackSpeed] }),
          '*'
        );
        const playCommand = isPaused ? 'pauseVideo' : 'playVideo';
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: playCommand, args: [] }),
          '*'
        );
      } catch (err) {
        console.warn('Failed to send dynamic state to YouTube backdrop.', err);
      }
    }
  }, [isVideoMuted, isPaused, volume, playbackSpeed, currentBackdropUrl]);

  // Synchronize HTML5 video element volume, mute, and speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackSpeed;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.warn("Autoplay deferred:", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(mutedErr => {
              console.error("Muted fallback failed:", mutedErr);
            });
          }
        });
      }
    }
  }, [currentBackdropUrl, isVideoMuted, isPaused, volume, playbackSpeed]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  let containerClasses = "";
  let containerStyles: React.CSSProperties = {};

  if (isMaximized) {
    containerClasses = "fixed inset-0 w-screen h-screen m-0 rounded-none shadow-none z-[9999] flex flex-col justify-start bg-black overflow-hidden transition-all duration-500";
  } else if (isMiniMode) {
    containerClasses = "fixed bottom-6 right-6 m-0 rounded-xl shadow-2xl z-[9999] flex flex-col bg-black border border-white/20 overflow-hidden select-none touch-none cursor-default";
    containerStyles = {
      transform: `translate(${position.x}px, ${position.y}px)`,
      width: `${miniWidth}px`,
      height: `${Math.round((miniWidth * 9) / 16)}px`,
    };
  } else {
    // Standard hero: Has original margins, rounded corners, drop shadows, and height parameters
    containerClasses = "relative w-auto mx-4 md:mx-12 mt-20 md:mt-24 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/10 hover:border-white/20 overflow-hidden z-10 flex flex-col justify-center py-16 sm:py-24 md:py-32 transition-all duration-500 group ring-1 ring-white/5";
  }

  return (
    <>
      {/* Sleek inline Navigation Control Ribbon shown when the main hero banner is minimized/hidden */}
      {isMiniMode && (
        <div id="mini-player-navigation" className="mx-4 md:mx-12 mt-24 mb-4 select-none pointer-events-auto animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/85 backdrop-blur-md rounded-lg border border-white/10 p-3.5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase leading-none">
                  Cinema Mini Player Active
                </span>
                <span className="text-[9px] text-zinc-500 mt-1">
                  Playing: Moment {currentVideoIndex + 1} of {activeVideos.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMiniMode(false); 
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
                title="Restore standard screen player"
              >
                <span>Restore Player</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-accent text-black font-extrabold uppercase tracking-widest text-[10px] shadow-md cursor-default select-none transition-all"
                title="Mini Player is active"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
                <span>Mini Player</span>
              </button>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMiniMode(false);
                  setIsMaximized(true); 
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
                title="Open in Theater Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 text-accent" />
                <span>Theater Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        id="hero-banner-main-card"
        className={containerClasses}
        style={containerStyles}
      >
        {isMiniMode && (
          <>
            {/* Top Drag Handle (above edges) */}
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute top-0 left-3 right-3 h-3 z-[55] cursor-move bg-gradient-to-b from-blue-500/10 to-transparent hover:from-blue-500/40 opacity-0 hover:opacity-100 transition-all border-t-2 border-blue-500/40 flex items-center justify-center select-none"
              title="Drag above edge to move player"
            >
              <div className="w-12 h-0.5 rounded bg-blue-400/40" />
            </div>

            {/* Bottom Drag Handle (below edges) */}
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute bottom-0 left-3 right-3 h-3 z-[55] cursor-move bg-gradient-to-t from-blue-500/10 to-transparent hover:from-blue-500/40 opacity-0 hover:opacity-100 transition-all border-b-2 border-blue-500/40 flex items-center justify-center select-none"
              title="Drag below edge to move player"
            >
              <div className="w-12 h-0.5 rounded bg-blue-400/40" />
            </div>

            {/* Left Edge Resize Handle */}
            <div 
              onPointerDown={(e) => handleResizeDown(e, 'left')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeUp}
              className="absolute top-0 bottom-0 left-0 w-3.5 z-[55] cursor-ew-resize bg-gradient-to-r from-accent/20 to-transparent hover:from-accent/50 opacity-0 hover:opacity-100 transition-all border-l-2 border-accent/40 select-none"
              title="Drag side edges to resize player width/height"
            />

            {/* Right Edge Resize Handle */}
            <div 
              onPointerDown={(e) => handleResizeDown(e, 'right')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeUp}
              className="absolute top-0 bottom-0 right-0 w-3.5 z-[55] cursor-ew-resize bg-gradient-to-l from-accent/20 to-transparent hover:from-accent/50 opacity-0 hover:opacity-100 transition-all border-r-2 border-accent/40 select-none"
              title="Drag side edges to resize player width/height"
            />
          </>
        )}

        {isMaximized && (
          <div className="w-full h-14 bg-zinc-950 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">
                THEATER FOCUS | Moment {currentVideoIndex + 1} of {activeVideos.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMaximized(false);
                  setIsMiniMode(true); 
                  setPosition({ x: 0, y: 0 }); // reset drag coordinates
                }}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
                title="Switch to Floatable Mini Player"
              >
                <PictureInPicture2 className="w-3.5 h-3.5 text-accent" />
                <span>Mini Player</span>
              </button>

              <button
                onClick={() => setIsMaximized(false)}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtle hover-revealed overlay option controls on the regular player */}
        {!isMaximized && !isMiniMode && !isCinemaAutoplay && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 pointer-events-none">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMiniMode(true); 
                setPosition({ x: 0, y: 0 }); // reset drag coordinates
              }}
              type="button"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/75 hover:bg-white text-zinc-300 hover:text-black border border-white/10 hover:border-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95"
              title="Switch to Floatable Mini Player"
            >
              <PictureInPicture2 className="w-3.5 h-3.5 text-accent" />
              <span>Mini Player</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setIsMaximized(true); }}
              type="button"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/75 hover:bg-white text-zinc-300 hover:text-black border border-white/10 hover:border-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95"
              title="Maximize to Full Theater Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>Theater Mode</span>
            </button>
          </div>
        )}
        {/* Cinematic Background Video/Photo Slideshow */}
        <div className={isMaximized ? "relative flex-1 w-full bg-[#050505] flex items-center justify-center overflow-hidden" : "absolute inset-0 bg-[#050505] flex items-center justify-center"}>
          <AnimatePresence mode="wait">
            {isYouTube && ytId ? (
              <motion.div
                key={`yt-${ytId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center ${
                  isMaximized || isMiniMode ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  onLoad={() => {
                    setTimeout(() => {
                      if (iframeRef.current?.contentWindow) {
                        const command = isVideoMuted ? 'mute' : 'unMute';
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: 'command', func: command, args: [] }),
                          '*'
                        );
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
                          '*'
                        );
                        const playCommand = isPaused ? 'pauseVideo' : 'playVideo';
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: 'command', func: playCommand, args: [] }),
                          '*'
                        );
                      }
                    }, 800);
                  }}
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&showinfo=0&rel=0&enablejsapi=1&playsinline=1`}
                  title="Cinematic YouTube backdrop"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                  className={
                    isMaximized
                      ? "absolute inset-0 w-full h-full border-none z-10 transition-all duration-700 pointer-events-auto"
                      : isMiniMode
                        ? "absolute inset-0 w-full h-full object-cover pointer-events-auto border-none"
                        : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] scale-150 aspect-video pointer-events-none"
                  }
                />
                {/* Subtle background replica blurred video behind the theater iframe to enhance theater mode */}
                {isMaximized && (
                  <div className="absolute inset-0 -z-10 opacity-30 blur-3xl scale-110 pointer-events-none hidden md:block">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0`}
                      title="Blur Backdrop"
                      frameBorder="0"
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                )}
              </motion.div>
            ) : isVideo ? (
              <motion.video
                ref={videoRef}
                key={`video-${currentBackdropUrl}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                src={currentBackdropUrl}
                autoPlay
                muted={isVideoMuted}
                loop
                playsInline
                controls={false}
                onTimeUpdate={(e) => {
                  if (!isSeeking) {
                    setCurrentTime(e.currentTarget.currentTime);
                  }
                }}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration || 0);
                  if (videoRef.current) {
                    videoRef.current.volume = volume;
                    videoRef.current.playbackRate = playbackSpeed;
                    videoRef.current.muted = isVideoMuted;
                  }
                }}
                className={
                  isMaximized
                    ? "absolute inset-0 w-full h-full object-cover z-10 pointer-events-auto transition-all duration-500"
                    : isMiniMode
                      ? "absolute inset-0 w-full h-full object-cover pointer-events-auto border-none"
                      : "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 pointer-events-none"
                }
              />
            ) : (
              <motion.img
                key={`img-${currentBackdropUrl}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                src={currentBackdropUrl}
                className={
                  isMaximized
                    ? "absolute inset-0 w-full h-full object-cover z-10 transition-all duration-500"
                    : isMiniMode
                      ? "absolute inset-0 w-full h-full object-cover"
                      : "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                }
              />
            )}
          </AnimatePresence>
          
          {/* Force a dark gradient even in light mode for the cinematic hero look - fade out if maximized for full details */}
          <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-[#050505]/20 transition-opacity duration-500 pointer-events-none ${
            isMaximized || isMiniMode ? 'opacity-0' : 'opacity-100'
          }`} />

          {/* Bottom control panel overlay for Mini Player removed to keep cinema view pristine */}

          {/* Options are now in the dedicated Cinema Control Bar above */}
        </div>

        {/* Pinned Expand/Minimize Button at Top Right Corner - Visible only on mobile devices */}
        {!isMiniMode && (
          <button
            type="button"
            id="hero-corner-expand-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(!isMaximized);
            }}
            className="md:hidden absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 sm:p-2.5 rounded-xl backdrop-blur-md bg-black/60 hover:bg-black/90 border border-white/20 hover:border-accent text-white hover:text-accent shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 group"
            title={isMaximized ? "Exit Theater Mode (Minimize)" : "Open Theater Mode (Expand)"}
          >
            {isMaximized ? (
              <>
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-black uppercase tracking-wider text-accent hidden sm:inline">Minimize</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-accent transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white group-hover:text-accent hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        )}

        {/* Floating Manual Slide Navigation Controls */}
        {activeVideos.length > 1 && !isMiniMode && (
          <>
            <button
              onClick={handlePrevVideo}
              type="button"
              className={`absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-[45] flex items-center justify-center p-2.5 rounded-full backdrop-blur-md bg-black/45 border border-white/10 text-white cursor-pointer hover:bg-white hover:text-black hover:border-white transition-all hover:scale-110 shadow-xl group`}
              title="Previous video"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={handleNextVideo}
              type="button"
              className={`absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-[45] flex items-center justify-center p-2.5 rounded-full backdrop-blur-md bg-black/45 border border-white/10 text-white cursor-pointer hover:bg-white hover:text-black hover:border-white transition-all hover:scale-110 shadow-xl group`}
              title="Next video"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}

        {isCinemaAutoplay && !isMaximized && !isMiniMode && (
          <div className="absolute top-4 left-4 right-4 z-40 bg-black/85 backdrop-blur-md rounded-lg border border-white/10 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">
                Cinema Autoplay Mode Active • Moment {currentVideoIndex + 1} of {activeVideos.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsCinemaAutoplay(false); 
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow active:scale-95"
                title="Restore standard info overlay"
              >
                <span>Restore</span>
              </button>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMaximized(true); 
                  setIsCinemaAutoplay(false);
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
                title="Open in Theater Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 text-accent" />
                <span>Theater Mode</span>
              </button>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMiniMode(true); 
                  setPosition({ x: 0, y: 0 }); // reset drag coordinates
                  setIsCinemaAutoplay(false);
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white text-white hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-white transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
                title="Switch to Floatable Mini Player"
              >
                <PictureInPicture2 className="w-3.5 h-3.5 text-accent" />
                <span>Mini Player</span>
              </button>
            </div>
          </div>
        )}

        {!isMaximized && !isMiniMode && !isCinemaAutoplay ? (
          /* Regular Home Banner Information Overlay */
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative z-10 flex flex-col justify-center max-w-2xl px-6 sm:px-8 md:px-12 space-y-4 pointer-events-auto"
          >
            <div className="space-y-2">
              <h2 className="text-accent font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs md:text-sm">
                Starring: {profile === 'Boyfriend' ? 'Sibusiso' : 'Millicent'}
              </h2>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sans font-black tracking-tight leading-tight text-white transition-colors block">
                The Story of Us
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 font-medium leading-relaxed max-w-lg mb-4 sm:mb-6 select-none">
                A cinematic collection of memories, smiles, and the small moments that mean everything.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onPlayAll(); }}
                className="flex items-center gap-2 bg-white text-black px-4 md:px-6 py-2.5 rounded-sm font-bold text-sm md:text-base hover:bg-zinc-200 transition-colors shadow-2xl cursor-pointer"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                Play Memories
              </motion.button>
            </div>
          </motion.div>
        ) : null}

        {/* Cinema Video, Volume, Speed & Slide Control Dock - Only on big screens (hidden on mobile) and removed in theater mode */}
        {!isMiniMode && !isMaximized ? (
          <div 
            id="hero-cinema-control-dock"
            className="hidden md:block absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-12 md:right-12 z-40 pointer-events-auto transition-all duration-300"
          >
            <div className="bg-zinc-950/90 backdrop-blur-xl rounded-xl border border-white/15 p-2.5 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col gap-2 ring-1 ring-white/5">
              {/* Top Row: Video Scrubber Seek Bar / Slide Progress */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-[10px] font-mono text-zinc-400 min-w-[32px] text-right select-none">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 flex items-center group/scrub">
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.1}
                    value={currentTime}
                    onMouseDown={() => setIsSeeking(true)}
                    onTouchStart={() => setIsSeeking(true)}
                    onMouseUp={() => setIsSeeking(false)}
                    onTouchEnd={() => setIsSeeking(false)}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-accent transition-all group-hover/scrub:h-2"
                    title="Slide / Seek Video Timeline"
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 min-w-[32px] select-none">
                  {duration > 0 ? formatTime(duration) : '0:00'}
                </span>
              </div>

              {/* Bottom Row: Control Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                {/* Left: Playback & Slide Navigation */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all cursor-pointer shadow-md"
                    title={isPaused ? "Play" : "Pause"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />}
                  </button>

                  {activeVideos.length > 1 && (
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={handlePrevVideo}
                        className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                        title="Previous Moment / Slide"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Clickable Slide Dots */}
                      <div className="flex items-center gap-1 px-1 sm:px-1.5">
                        {activeVideos.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setIsPaused(false);
                              setCurrentVideoIndex(idx);
                            }}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              idx === currentVideoIndex ? 'w-4 sm:w-5 bg-accent' : 'w-2 bg-white/20 hover:bg-white/60'
                            }`}
                            title={`Slide to Moment ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleNextVideo}
                        className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                        title="Next Moment / Slide"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase hidden lg:inline">
                    Moment {currentVideoIndex + 1} of {activeVideos.length}
                  </span>
                </div>

                {/* Right: Volume & Video Speed & Slide Interval & Theater controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Volume Slider Control */}
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 sm:px-2.5 py-1.5 border border-white/10 group/vol">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title={isVideoMuted ? "Unmute Video" : "Mute Video"}
                    >
                      {isVideoMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4 text-accent" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-accent" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isVideoMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-14 sm:w-20 md:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
                      title={`Volume: ${Math.round(volume * 100)}%`}
                    />
                    <span className="text-[9px] font-mono text-zinc-400 min-w-[28px] text-right select-none">
                      {isVideoMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>

                  {/* Video Playback Speed Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSpeedMenu(!showSpeedMenu);
                        setShowSlideIntervalMenu(false);
                      }}
                      className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        playbackSpeed !== 1.0 
                          ? 'bg-accent/25 border-accent text-accent' 
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Adjust Video Playback Speed"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl p-1.5 min-w-[120px] flex flex-col gap-1 z-50 animate-fadeIn">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-2 py-1">
                          Video Speed
                        </span>
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={(e) => handleSpeedChange(spd, e)}
                            className={`px-2.5 py-1 rounded text-left text-[10px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                              playbackSpeed === spd 
                                ? 'bg-accent text-white font-bold' 
                                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{spd}x</span>
                            {spd === 1.0 && <span className="text-[8px] opacity-70">Normal</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Slide Interval Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSlideIntervalMenu(!showSlideIntervalMenu);
                        setShowSpeedMenu(false);
                      }}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
                      title="Slide Cycle Speed"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Slide: </span>
                      <span>{slideInterval === 0 ? 'Manual' : `${slideInterval / 1000}s`}</span>
                    </button>

                    {showSlideIntervalMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl p-1.5 min-w-[140px] flex flex-col gap-1 z-50 animate-fadeIn">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-2 py-1">
                          Slide Interval
                        </span>
                        {[
                          { label: '5s (Fast)', val: 5000 },
                          { label: '10s (Normal)', val: 10000 },
                          { label: '15s (Relaxed)', val: 15000 },
                          { label: 'Manual Only', val: 0 },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlideInterval(opt.val);
                              setShowSlideIntervalMenu(false);
                            }}
                            className={`px-2.5 py-1 rounded text-left text-[10px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                              slideInterval === opt.val 
                                ? 'bg-accent text-white font-bold' 
                                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode Toggles */}
                  {!isMaximized && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMiniMode(true);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer hidden sm:flex"
                      title="Switch to Floatable Mini Player"
                    >
                      <PictureInPicture2 className="w-3.5 h-3.5 text-accent" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title={isMaximized ? "Exit Theater" : "Theater Mode"}
                  >
                    {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Hover Control Dock on Mini Player */}
        {isMiniMode && (
          <div className="absolute bottom-2 left-2 right-2 z-40 flex items-center justify-between gap-1 bg-black/80 backdrop-blur-md rounded-lg p-1.5 border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={togglePlayPause}
              className="p-1 rounded text-white hover:bg-white/20 transition-colors"
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded text-white hover:bg-white/20 transition-colors"
            >
              {isVideoMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-accent" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isVideoMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-12 h-1 bg-white/30 rounded appearance-none accent-accent"
            />
            <button
              type="button"
              onClick={(e) => {
                const nextSpeed = playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : playbackSpeed === 2.0 ? 0.75 : 1.0;
                handleSpeedChange(nextSpeed, e);
              }}
              className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-white/10 text-zinc-200"
              title="Toggle Video Speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        )}
      </div>
    </>
  );
}
