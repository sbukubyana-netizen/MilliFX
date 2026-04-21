import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, VolumeX, SkipForward } from 'lucide-react';

interface TrailerPlayerProps {
  onComplete: () => void;
}

export default function TrailerPlayer({ onComplete }: TrailerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        setVideoError(true);
      });
      setIsPlaying(true);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="relative h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        onEnded={onComplete}
        onError={() => setVideoError(true)}
        muted={isMuted}
        playsInline
      >
        <source src="/videos/8.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {videoError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-8 text-center">
          <div className="max-w-md space-y-4">
            <p className="text-white text-lg font-bold">Unable to load the trailer video.</p>
            <p className="text-white/60 text-sm italic">"The element has no supported sources."</p>
            <p className="text-white/40 text-xs">Please ensure that the file exists at <code className="bg-white/10 px-1 py-0.5 rounded">public/videos/8.mp4</code></p>
            <button 
              onClick={onComplete}
              className="bg-accent text-white px-8 py-2 rounded-sm font-bold uppercase tracking-widest text-[10px]"
            >
              Enter MilliFix Directly
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />

      {/* Skip Intro */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleSkip}
        className="absolute top-8 right-8 z-50 bg-black/50 hover:bg-black/80 text-white px-6 py-2 rounded-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all"
      >
        <span>Skip Intro</span>
        <SkipForward className="w-4 h-4" />
      </motion.button>

      {/* Main Play Action (Before Start) */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="z-20 text-center space-y-6"
          >
            <button
              onClick={handlePlay}
              className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-white text-black transition-transform hover:scale-110 active:scale-95"
            >
              <Play className="w-10 h-10 fill-current ml-1" />
              <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-25" />
            </button>
            <p className="text-white/60 font-medium tracking-widest uppercase text-sm">
              Press Play to Start the Journey
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captions */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isPlaying ? { opacity: 1, x: 0 } : { opacity: 0 }}
        className="absolute bottom-12 left-12 z-20"
      >
        <p className="text-white text-2xl md:text-3xl font-light tracking-tight italic">
          "A story about someone special..."
        </p>
        <div className="h-0.5 w-24 bg-red-600 mt-4" />
      </motion.div>

      {/* Mute Toggle */}
      {isPlaying && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-12 right-12 z-20 text-white/50 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      )}
    </div>
  );
}
