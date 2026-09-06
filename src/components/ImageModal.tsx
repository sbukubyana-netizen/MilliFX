import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, ChevronLeft, ChevronRight, Pause, Play, 
  Volume2, Volume1, VolumeX, Gauge, Clock, SkipBack, SkipForward, Layers
} from 'lucide-react';
import { Memory } from '../constants';

interface ImageModalProps {
  item: Memory | null;
  currentIndex?: number;
  totalCount?: number;
  onSeekIndex?: (index: number) => void;
  slideInterval?: number;
  onSlideIntervalChange?: (interval: number) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function ImageModal({ 
  item, 
  currentIndex = 0,
  totalCount = 0,
  onSeekIndex,
  slideInterval = 5000,
  onSlideIntervalChange,
  onClose, 
  onNext, 
  onPrev, 
  isPaused, 
  onTogglePause, 
  hasNext, 
  hasPrev 
}: ImageModalProps) {
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Volume & Speed states synchronized with local storage
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_hero_volume');
    return saved !== null ? parseFloat(saved) : 0.85;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_hero_speed');
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);

  // Sync volume, mute & speed with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed, item?.videoUrl]);

  // Handle keyboard shortcuts (Esc, Left, Right, Space, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
      if (e.key === ' ') {
        e.preventDefault();
        onTogglePause?.();
      }
      if (e.key.toLowerCase() === 'm') {
        setIsMuted(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, onTogglePause, hasPrev, hasNext]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('millisbu_hero_volume', newVol.toString());
    if (newVol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    localStorage.setItem('millisbu_hero_speed', newSpeed.toString());
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!item) return null;

  const isVideo = !!item.videoUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none"
        >
          {/* Navigation Controls Overlay */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-50 pointer-events-none">
            {hasPrev ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="pointer-events-auto bg-black/50 text-white p-3.5 sm:p-4 rounded-full hover:bg-accent hover:scale-110 transition-all border border-white/10 backdrop-blur-md shadow-2xl cursor-pointer group"
                title="Previous Slide / Moment"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
              </button>
            ) : <div />}
            {hasNext ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="pointer-events-auto bg-black/50 text-white p-3.5 sm:p-4 rounded-full hover:bg-accent hover:scale-110 transition-all border border-white/10 backdrop-blur-md shadow-2xl cursor-pointer group"
                title="Next Slide / Moment"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : <div />}
          </div>

          {/* Top-Right Control Bar */}
          <div className="pointer-events-auto absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 z-50 flex items-center gap-2">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePause?.(); }}
              className="bg-black/60 text-white p-2.5 sm:p-3 rounded-full hover:bg-accent transition-all backdrop-blur-md border border-white/10 cursor-pointer shadow-lg"
              title={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
            >
              {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
            </button>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="bg-black/60 text-white p-2.5 sm:p-3 rounded-full hover:bg-red-500 transition-all backdrop-blur-md border border-white/10 cursor-pointer shadow-lg"
              title="Close Cinema Mode"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-center pointer-events-auto overflow-hidden bg-black select-none relative">
            <AnimatePresence mode="wait">
              {isVideo ? (
                <motion.video
                  ref={videoRef}
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration || 0;
                    setVideoDuration(dur);
                    if (videoRef.current) {
                      videoRef.current.volume = volume;
                      videoRef.current.muted = isMuted;
                      videoRef.current.playbackRate = playbackSpeed;
                    }
                  }}
                  onTimeUpdate={(e) => {
                    if (!isSeeking) {
                      setCurrentTime(e.currentTarget.currentTime);
                    }
                  }}
                  onEnded={onNext}
                  key={item.videoUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={item.videoUrl}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  className="w-full h-full max-h-screen object-contain"
                />
              ) : (
                <motion.img 
                  key={item.imageUrl}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full max-h-screen object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </AnimatePresence>
            
            {/* Top Gradient & Autoplay Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10 z-40">
              <motion.div 
                key={`${item.id}-${isPaused}-${isVideo ? videoDuration : slideInterval}`}
                initial={{ width: 0 }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{ 
                  duration: isPaused ? 0 : (isVideo ? videoDuration : slideInterval / 1000), 
                  ease: "linear" 
                }}
                className="h-full bg-accent shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.8)]"
              />
            </div>

            {/* Bottom Floating Control Dock */}
            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-10 bg-linear-to-t from-black/95 via-black/80 to-transparent flex flex-col justify-end pointer-events-auto z-40 gap-3">
              {/* Item Info */}
              <div className="flex items-start justify-between gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={item.title}
                  className="max-w-2xl"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px]">
                      {isVideo ? 'Cinematic Video' : 'Photo Slide'}
                    </span>
                    {totalCount > 0 && (
                      <span className="text-zinc-400 text-[9px] font-mono">
                        • Moment {currentIndex + 1} of {totalCount}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-2xl line-clamp-1">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-zinc-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </motion.div>
              </div>

              {/* Comprehensive Video, Volume, Speed & Slide Control Bar */}
              <div className="bg-zinc-950/90 backdrop-blur-xl rounded-xl border border-white/15 p-2.5 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col gap-2.5 ring-1 ring-white/5">
                {/* Timeline Scrubber Slider */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-[10px] font-mono text-zinc-400 min-w-[34px] text-right select-none">
                    {isVideo ? formatTime(currentTime) : `${currentIndex + 1}`}
                  </span>
                  <div className="relative flex-1 flex items-center group/scrub">
                    {isVideo ? (
                      <input
                        type="range"
                        min={0}
                        max={videoDuration > 0 ? videoDuration : 100}
                        step={0.1}
                        value={currentTime}
                        onMouseDown={() => setIsSeeking(true)}
                        onTouchStart={() => setIsSeeking(true)}
                        onMouseUp={() => setIsSeeking(false)}
                        onTouchEnd={() => setIsSeeking(false)}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-accent transition-all group-hover/scrub:h-2"
                        title="Slide & Seek Video Timeline"
                      />
                    ) : (
                      /* Slide moment scrubber for collections */
                      <input
                        type="range"
                        min={0}
                        max={totalCount > 1 ? totalCount - 1 : 0}
                        step={1}
                        value={currentIndex}
                        onChange={(e) => onSeekIndex?.(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-accent transition-all group-hover/scrub:h-2"
                        title="Slide across moments"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 min-w-[34px] select-none">
                    {isVideo ? (videoDuration > 0 ? formatTime(videoDuration) : '0:00') : `${totalCount}`}
                  </span>
                </div>

                {/* Interactive Controls Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                  {/* Left: Play/Pause & Slide Navigation */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={onTogglePause}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all cursor-pointer shadow-md"
                      title={isPaused ? "Play" : "Pause"}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />}
                    </button>

                    {/* Prev / Next Slide */}
                    <button
                      type="button"
                      onClick={onPrev}
                      disabled={!hasPrev}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      title="Previous Slide"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    {/* Clickable Moment dots */}
                    {totalCount > 1 && totalCount <= 12 && (
                      <div className="hidden sm:flex items-center gap-1 px-1">
                        {Array.from({ length: totalCount }).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onSeekIndex?.(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              idx === currentIndex ? 'w-4 bg-accent' : 'w-1.5 bg-white/20 hover:bg-white/50'
                            }`}
                            title={`Jump to Moment ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={onNext}
                      disabled={!hasNext}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      title="Next Slide"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right: Volume, Video Speed & Slide Interval */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Volume Control */}
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 sm:px-2.5 py-1.5 border border-white/10">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                        )}
                      </button>

                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-14 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
                        title={`Volume: ${Math.round(volume * 100)}%`}
                      />
                      <span className="text-[9px] font-mono text-zinc-400 min-w-[28px] text-right select-none">
                        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                      </span>
                    </div>

                    {/* Video Speed Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSpeedMenu(!showSpeedMenu);
                          setShowIntervalMenu(false);
                        }}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          playbackSpeed !== 1.0 
                            ? 'bg-accent/25 border-accent text-accent' 
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Video Playback Speed"
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
                              onClick={() => handleSpeedChange(spd)}
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

                    {/* Slide Speed / Interval Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowIntervalMenu(!showIntervalMenu);
                          setShowSpeedMenu(false);
                        }}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
                        title="Slide Cycle Speed"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Slide: </span>
                        <span>{slideInterval === 0 ? 'Manual' : `${slideInterval / 1000}s`}</span>
                      </button>

                      {showIntervalMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl p-1.5 min-w-[140px] flex flex-col gap-1 z-50 animate-fadeIn">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-2 py-1">
                            Slide Interval
                          </span>
                          {[
                            { label: '3s (Fast)', val: 3000 },
                            { label: '5s (Normal)', val: 5000 },
                            { label: '10s (Relaxed)', val: 10000 },
                            { label: 'Manual Only', val: 0 },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => {
                                onSlideIntervalChange?.(opt.val);
                                setShowIntervalMenu(false);
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

