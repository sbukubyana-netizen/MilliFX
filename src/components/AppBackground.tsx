import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AppBackgroundProps {
  backdropUrls?: string[];
  soundEnabled?: boolean;
}

export default function AppBackground({ backdropUrls, soundEnabled = false }: AppBackgroundProps) {
  const activeUrls = backdropUrls && backdropUrls.length > 0 ? backdropUrls : ['videos/6.mp4', 'videos/7.mp4'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlayingPlaylistMusic, setIsPlayingPlaylistMusic] = useState(false);

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

  const isVideoMuted = !localSoundEnabled || isPlayingPlaylistMusic;

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
          console.warn('Interaction unmute background attempt deferred', err);
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
      const { soundEnabled: detailSoundEnabled } = customEvent.detail || {};
      if (detailSoundEnabled !== undefined) {
        setLocalSoundEnabled(detailSoundEnabled);
      }
    };
    window.addEventListener('millifix-play-backdrop-audio', handleAudioEvent);
    return () => window.removeEventListener('millifix-play-backdrop-audio', handleAudioEvent);
  }, []);

  // Sync index to start from 0 if backdrop list changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeUrls.length, JSON.stringify(activeUrls)]);

  // Automatically cycle through backdrops in the slideshow if there are multiple
  useEffect(() => {
    if (activeUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeUrls.length);
    }, 15000); // 15 seconds per background
    return () => clearInterval(interval);
  }, [activeUrls.length, JSON.stringify(activeUrls)]);

  const currentUrl = activeUrls[currentIndex] || '';

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
        console.warn('Failed to send dynamic mute state to YouTube app backdrop.', err);
      }
    }
  }, [isVideoMuted]);

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

  const ytId = getYouTubeId(currentUrl);
  const isYouTube = !!ytId;

  const isVideo = currentUrl.endsWith('.mp4') || 
                  currentUrl.endsWith('.webm') || 
                  currentUrl.includes('video') || 
                  currentUrl.startsWith('data:video/');

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#050505]">
      {/* Absolute negative inset wrapper to prevent edge bleeding on filter blur */}
      <div className="absolute -inset-16 overflow-hidden">
        <AnimatePresence mode="wait">
          {isYouTube && ytId ? (
            <motion.div
              key={`app-bg-yt-${ytId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute inset-0 w-full h-full scale-110 filter blur-[24px]"
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
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3&modestbranding=1`}
                title="App dynamic background youtube"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute top-1/2 left-1/2 w-[120vw] h-[120vh] min-w-[140%] min-h-[140%] -translate-x-1/2 -translate-y-1/2 scale-150 aspect-video object-cover"
              />
            </motion.div>
          ) : isVideo ? (
            <motion.video
              key={`app-bg-video-${currentUrl}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              src={currentUrl}
              autoPlay
              muted={isVideoMuted}
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-110 filter blur-[20px]"
            />
          ) : currentUrl ? (
            <motion.img
              key={`app-bg-img-${currentUrl}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              src={currentUrl}
              className="absolute inset-0 w-full h-full object-cover scale-110 filter blur-[22px]"
              referrerPolicy="no-referrer"
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Modern ambient overlay to allow maximum color glow while maintaining content readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[#050505]/40 backdrop-blur-[1px]" />
    </div>
  );
}
