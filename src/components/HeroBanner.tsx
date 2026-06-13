import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Maximize2, Minimize2, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

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
    if (activeVideos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length);
    }, 10000); // Switch every 10 seconds
    return () => clearInterval(interval);
  }, [activeVideos.length, currentVideoIndex]);

  const handleNextVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length);
  };

  const handlePrevVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*'
        );
      } catch (err) {
        console.warn('Failed to send dynamic mute state to YouTube backdrop.', err);
      }
    }
  }, [isVideoMuted]);

  // Autoplay control with dynamic muting fallback to prevent browser blockage
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
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
  }, [currentBackdropUrl, isVideoMuted]);

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

  return (
    <div className={
      isMaximized
        ? "fixed inset-0 w-screen h-screen m-0 rounded-none shadow-none z-[9999] flex flex-col justify-center bg-black/95 overflow-hidden transition-all duration-500"
        : "relative w-auto mx-4 md:mx-12 mt-20 md:mt-24 rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col justify-center py-16 sm:py-24 md:py-32 transition-all duration-500"
    }>
      {/* Cinematic Background Video/Photo Slideshow */}
      <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isYouTube && ytId ? (
            <motion.div
              key={`yt-${ytId}-${isMaximized}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center ${
                isMaximized ? 'pointer-events-auto' : 'pointer-events-none'
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
                      iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                        '*'
                      );
                    }
                  }, 800);
                }}
                src={
                  isMaximized
                    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&loop=1&playlist=${ytId}&controls=1&showinfo=1&rel=0&enablejsapi=1&playsinline=1`
                    : `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3&modestbranding=1`
                }
                title="Cinematic YouTube backdrop"
                frameBorder="0"
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                className={
                  isMaximized
                    ? "relative w-full max-w-5xl h-auto aspect-video max-h-[85vh] rounded-xl border border-white/10 shadow-2xl z-10 transition-all duration-700 pointer-events-auto"
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
                  ? "relative w-full max-w-5xl h-auto max-h-[85vh] rounded-xl border border-white/10 shadow-2xl z-10 pointer-events-auto transition-all duration-500"
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
                  ? "relative w-full max-w-5xl h-auto max-h-[85vh] rounded-xl border border-white/10 shadow-2xl z-10 object-contain bg-black transition-all duration-500"
                  : "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              }
            />
          )}
        </AnimatePresence>
        
        {/* Force a dark gradient even in light mode for the cinematic hero look - fade out if maximized for full details */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-[#050505]/20 transition-opacity duration-500 ${
          isMaximized ? 'opacity-0' : 'opacity-100'
        }`} />
      </div>

      {/* Floating Manual Slide Navigation Controls */}
      {activeVideos.length > 1 && (
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

      {/* Modern Maximized Theater Overlay Bar */}
      {isMaximized ? (
        <div className="absolute top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 flex items-center justify-between z-[45] transition-all">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10.5px] font-mono tracking-widest text-white/90">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            THEATER FOCUS: {currentVideoIndex + 1} / {activeVideos.length}
          </div>

          <button
            onClick={() => setIsMaximized(false)}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white text-black border border-white hover:bg-zinc-200 cursor-pointer text-xs font-black uppercase tracking-wider transition-all hover:scale-105 shadow-2xl"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Minimize</span>
          </button>
        </div>
      ) : (
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sans font-black tracking-tight leading-tight text-white transition-colors">
              The Story of Us
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 font-medium leading-relaxed max-w-lg mb-4 sm:mb-6">
              A cinematic collection of memories, smiles, and the small moments that mean everything.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onPlayAll(); }}
              className="flex items-center gap-2 bg-white text-black px-4 md:px-6 py-2.5 rounded-sm font-bold text-sm md:text-base hover:bg-zinc-200 transition-colors shadow-2xl"
            >
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              Play Memories
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); setIsMaximized(true); }}
              className="flex items-center gap-2 bg-black/45 backdrop-blur-md text-white border border-white/15 px-4 md:px-6 py-2.5 rounded-sm font-bold text-sm md:text-base hover:bg-white hover:text-black hover:border-white transition-colors shadow-2xl"
            >
              <Maximize2 className="w-4 h-4" />
              Maximize View
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
