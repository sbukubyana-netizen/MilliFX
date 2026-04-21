import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';

interface BackgroundMusicProps {
  isVisible: boolean;
  isPaused: boolean;
  mood: string;
}

const PLAYLIST = [
  { id: 1, title: "Our Theme 🤍", url: "music/1.mp3" },
  { id: 2, title: "Sweet Memories 🍬", url: "music/2.mp3" },
  { id: 3, title: "Afternoon Glow ☀️", url: "music/3.mp3" },
  { id: 4, title: "Midnight Whispers 🌙", url: "music/4.mp3" },
  { id: 5, title: "Playful Vibes 🎈", url: "music/5.mp3" },
  { id: 6, title: "The Journey 🎞️", url: "music/6.mp3" },
];

export default function BackgroundMusic({ isVisible, isPaused }: BackgroundMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = PLAYLIST[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // We don't auto-play if it wasn't playing before
        // but if it WAS, we keep it playing
      }
    }
  }, [isPaused]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    // Auto-play next track if it was already playing
    if (isPlaying) {
      setTimeout(() => audioRef.current?.play().catch(console.error), 100);
    }
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    if (isPlaying) {
      setTimeout(() => audioRef.current?.play().catch(console.error), 100);
    }
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-30 left-6 md:left-12 z-50 flex items-center gap-4 bg-bg-deep/80 border border-border-subtle p-2 md:px-4 md:py-2 rounded-full backdrop-blur-2xl transition-all shadow-2xl group/music">
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnded}
      />
      
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
          {isPlaying ? 'MilliFix Radio • Live' : 'Paused'}
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
          onClick={() => setIsMuted(!isMuted)}
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
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
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
