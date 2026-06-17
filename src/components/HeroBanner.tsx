import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Maximize2, Minimize2, ChevronLeft, ChevronRight, Volume2, VolumeX, PictureInPicture2, X, Settings } from 'lucide-react';

interface HeroBannerProps {
  onPlayAll: () => void;
  profile?: 'Girlfriend' | 'Boyfriend';
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

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalSoundEnabled(prev => !prev);
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
    if (activeVideos.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length);
    }, 10000); // Switch every 10 seconds
    return () => clearInterval(interval);
  }, [activeVideos.length, currentVideoIndex, isPaused]);

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

  const isVideoMuted = isMaximized ? false : (!localSoundEnabled || isPlayingPlaylistMusic);

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
            JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
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
  }, [isVideoMuted]);

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

  const currentBackdropUrl = activeVideos[currentVideoIndex] || '';

  // Send message to YouTube iframe dynamically to avoid element reload flashes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const command = isVideoMuted ? 'mute' : 'unMute';
      try {
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
      } catch (err) {
        console.warn('Failed to send dynamic state to YouTube backdrop.', err);
      }
    }
  }, [isVideoMuted, isPaused]);

  // Autoplay control with dynamic muting fallback to prevent browser blockage
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        // Force programmatic play call if browser allows
        videoRef.current.play().catch(err => {
          console.warn("Autoplay programmatically blocked or deferred by browser policy. Falling back to muted autoplay state...", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(mutedErr => {
              console.error("Muted fallback autoplay failed:", mutedErr);
            });
          }
        });
      }
    }
  }, [currentBackdropUrl, isVideoMuted, isPaused]);

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
    containerClasses = "relative w-auto mx-4 md:mx-12 mt-20 md:mt-24 rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col justify-center py-16 sm:py-24 md:py-32 transition-all duration-500 group";
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
                controls={isMaximized}
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
      </div>
    </>
  );
}
