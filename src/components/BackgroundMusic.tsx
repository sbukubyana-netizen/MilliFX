import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';

interface BackgroundMusicProps {
  isVisible: boolean;
}

const PLAYLIST = [
  { id: 1, title: "Our Theme 🤍", url: "music/1.mp3" },
  { id: 2, title: "Sweet Memories 🍬", url: "music/2.mp3" },
  { id: 3, title: "Afternoon Glow ☀️", url: "music/3.mp3" },
  { id: 4, title: "Midnight Whispers 🌙", url: "music/4.mp3" },
  { id: 5, title: "Playful Vibes 🎈", url: "music/5.mp3" },
  { id: 6, title: "The Journey 🎞️", url: "music/6.mp3" },
];

export default function BackgroundMusic({ isVisible }: BackgroundMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>(PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Sync state from SoundtrackVinylPlayer's broadcast channels
  useEffect(() => {
    const handleState = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { isPlaying, currentTrackIndex, volume: vinylVolume, playlist: vinylPlaylist } = customEvent.detail || {};
      
      if (isPlaying !== undefined) setIsPlaying(isPlaying);
      if (currentTrackIndex !== undefined) setCurrentTrackIndex(currentTrackIndex);
      if (vinylVolume !== undefined) {
        setVolume(vinylVolume);
        if (vinylVolume > 0) setIsMuted(false);
      }
      if (vinylPlaylist !== undefined) setPlaylist(vinylPlaylist);
    };

    window.addEventListener('millifix-audio-state', handleState);
    
    // Proactively request current state in case vinyl is already mounted
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'request-state' } }));

    return () => {
      window.removeEventListener('millifix-audio-state', handleState);
    };
  }, []);

  const currentTrack = playlist[currentTrackIndex] || playlist[0] || PLAYLIST[0];

  const togglePlay = () => {
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'toggle' } }));
  };

  const nextTrack = () => {
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'next' } }));
  };

  const prevTrack = () => {
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'prev' } }));
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'volume', value: nextMuted ? 0 : volume } }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-30 left-6 md:left-12 z-50 flex items-center gap-4 bg-bg-deep/80 border border-border-subtle p-2 md:px-4 md:py-2 rounded-full backdrop-blur-2xl transition-all shadow-2xl group/music">
      {/* Visualizer/Status Indicator */}
      <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-accent/10 border border-accent/20">
        <Music className={`w-4 h-4 text-accent transition-all ${isPlaying ? 'scale-110 opacity-100' : 'opacity-40'}`} />
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-20" />
        )}
      </div>

      <div className="flex flex-col min-w-[120px] md:min-w-[150px]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[10px] md:text-[11px] font-black text-text-main uppercase tracking-widest truncate">
            {currentTrack.title}
          </span>
          {isPlaying && (
            <div className="flex gap-0.5 items-end h-2 shrink-0">
              <motion.div animate={{ height: [2, 6, 2] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-accent" />
              <motion.div animate={{ height: [2, 8, 2] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-accent" />
              <motion.div animate={{ height: [2, 5, 2] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-accent" />
            </div>
          )}
        </div>
        <span className="text-[8px] font-bold text-text-dim uppercase tracking-tighter opacity-70">
          {isPlaying ? 'MilliSbu Radio • Live' : 'Paused'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-2 border-l border-border-subtle">
        <button 
          onClick={prevTrack}
          className="text-text-dim hover:text-text-main transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <button 
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button 
          onClick={nextTrack}
          className="text-text-dim hover:text-text-main transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume System */}
      <div 
        className="relative flex items-center gap-2 pr-2"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button 
          onClick={toggleMute}
          className="text-text-dim hover:text-text-main transition-colors"
        >
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showVolumeSlider && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 60 }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  window.dispatchEvent(new CustomEvent('millifix-audio-control', { detail: { action: 'volume', value: val } }));
                }}
                className="w-12 h-1 accent-accent cursor-pointer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
