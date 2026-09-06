import { motion } from 'motion/react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Plus, Heart, Volume2, Volume1, VolumeX, 
  Gauge, Maximize2 
} from 'lucide-react';
import { Memory } from '../constants';

interface Top10RowProps {
  id?: string;
  items: Memory[];
  userStats: { [key: string]: { views: number, likes: number } };
  onLike: (id: string) => void;
  onView?: (id: string) => void;
  onSelect: (item: Memory, collection: Memory[]) => void;
}

export const Top10Row: React.FC<Top10RowProps> = ({ id, items, userStats, onLike, onView, onSelect }) => {
  return (
    <div className="py-12 space-y-3" id={id}>
      <div className="px-6 md:px-12 flex items-center justify-between">
        <div className="flex flex-col pb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-text-main flex items-center gap-2 italic tracking-tighter mb-0 pb-0">
            Global Top 10 <span className="text-accent not-italic">🔥</span>
          </h3>
          <p className="text-text-dim text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5">Based on your recent binge-watching & likes</p>
        </div>
        {items.length > 0 && (
          <button 
            onClick={() => onSelect(items[0], items)}
            className="text-accent text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
          >
            Play the Hits &#8250;
          </button>
        )}
      </div>
      <div className="flex gap-12 overflow-x-auto px-6 md:px-12 py-8 no-scrollbar items-center">
        {items.map((item, index) => {
          const stats = userStats[item.id] || { views: 0, likes: 0 };
          const isLiked = stats.likes > 0;
          
          return (
            <Top10Card
              key={item.id}
              item={item}
              index={index}
              items={items}
              stats={stats}
              isLiked={isLiked}
              onLike={() => onLike(item.id)}
              onView={() => onView?.(item.id)}
              onSelect={() => onSelect(item, items)}
            />
          );
        })}
      </div>
      
      <style>{`
        .outline-text {
          -webkit-text-stroke: 2px var(--color-text-dim);
          color: transparent;
        }
        .group:hover .outline-text {
          -webkit-text-stroke: 2px var(--color-accent);
        }
      `}</style>
    </div>
  );
};

interface Top10CardProps {
  item: Memory;
  index: number;
  items: Memory[];
  stats: { views: number; likes: number };
  isLiked: boolean;
  onLike: () => void;
  onView?: () => void;
  onSelect: () => void;
}

const Top10Card: React.FC<Top10CardProps> = ({
  item,
  index,
  stats,
  isLiked,
  onLike,
  onView,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Volume & Speed
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_card_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_card_speed');
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = !!item.videoUrl;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed, hasVideo]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && isHovered) {
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isHovered, hasVideo]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('millisbu_card_volume', newVol.toString());
    if (newVol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Real view count starting at 0, incremented only when full screen is clicked
  const totalViews = stats.views || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 50 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (hasVideo) setIsPlaying(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPlaying(false);
        setShowSpeedMenu(false);
        setCurrentTime(0);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className="flex-shrink-0 relative w-[240px] sm:w-[290px] md:w-[330px] max-w-full group cursor-pointer select-none"
    >
      {/* Massive Number */}
      <div className="absolute -left-6 sm:-left-8 md:-left-12 bottom-0 text-[100px] sm:text-[140px] md:text-[200px] font-black leading-none text-bg-deep select-none outline-text transition-all group-hover:text-accent/20 z-0 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none">
        {index + 1}
      </div>
      
      {/* Card Content */}
      <div 
        onClick={() => {
          onView?.();
          onSelect();
        }}
        className="relative z-10 ml-6 md:ml-12 rounded-lg overflow-hidden shadow-2xl bg-card-bg aspect-video border border-border-subtle group-hover:border-accent/60 transition-all duration-500 flex flex-col"
      >
        {/* Cover image: ALWAYS visible until hovered */}
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            hasVideo && isHovered && isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Video preview: only rendered and played when hovered */}
        {hasVideo && isHovered && isPlaying && (
          <video
            ref={videoRef}
            src={item.videoUrl}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration || 0);
              if (videoRef.current) {
                videoRef.current.volume = volume;
                videoRef.current.muted = isMuted;
                videoRef.current.playbackRate = playbackSpeed;
              }
            }}
            onTimeUpdate={(e) => {
              if (!isSeeking) setCurrentTime(e.currentTarget.currentTime);
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Stats Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
          <div className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/10 shadow flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>{totalViews} {totalViews === 1 ? 'View' : 'Views'}</span>
          </div>
          {hasVideo && (
            <div className="bg-red-600/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow">
              Video
            </div>
          )}
        </div>

        {/* Top Right Maximize Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
            onSelect();
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 hover:bg-accent text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 shadow"
          title="Open Fullscreen"
        >
          <Maximize2 className="w-3 h-3" />
        </button>

        {/* Timeline Scrubber Slider on Card */}
        {hasVideo && (
          <div className="absolute bottom-14 inset-x-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 shadow">
              <span className="text-[8px] font-mono text-zinc-300 min-w-[20px]">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.1}
                value={currentTime}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsSeeking(true);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setIsSeeking(true);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  setIsSeeking(false);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setIsSeeking(false);
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSeek(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1 bg-white/20 hover:bg-white/40 rounded appearance-none cursor-pointer accent-accent"
                title="Slide video timeline"
              />
              <span className="text-[8px] font-mono text-zinc-300 min-w-[20px]">
                {duration > 0 ? formatTime(duration) : '0:00'}
              </span>
            </div>
          </div>
        )}

        {/* Card Overlay Controls & Title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-10 pointer-events-none">
          {/* Card Action Controls */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.();
                  if (hasVideo) {
                    setIsPlaying(!isPlaying);
                  } else {
                    onSelect();
                  }
                }}
                className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center p-1 cursor-pointer hover:bg-accent hover:text-white transition-colors shadow"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                  onView?.();
                }}
                className={`w-7 h-7 rounded-full border ${isLiked ? 'bg-accent/20 border-accent' : 'border-zinc-400'} text-white flex items-center justify-center hover:border-accent transition-colors shadow`}
                title="Favorite"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-accent fill-current' : 'text-white'}`} />
              </button>
            </div>

            {/* Volume & Speed Controls on Card */}
            {hasVideo && (
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                {/* Volume Slider */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3 h-3 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-3 h-3 text-accent" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-accent" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(parseFloat(e.target.value));
                  }}
                  className="w-10 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-accent"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />

                {/* Speed selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeedMenu(!showSpeedMenu);
                    }}
                    className={`flex items-center gap-0.5 px-1 py-0.2 rounded border text-[8px] font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed !== 1.0 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                    }`}
                    title="Playback Speed"
                  >
                    <Gauge className="w-2.5 h-2.5" />
                    <span>{playbackSpeed}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-1 right-0 bg-zinc-900 border border-white/15 rounded shadow-xl p-1 flex flex-col gap-0.5 z-50 min-w-[65px]">
                      {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaybackSpeed(spd);
                            localStorage.setItem('millisbu_card_speed', spd.toString());
                            setShowSpeedMenu(false);
                            if (videoRef.current) {
                              videoRef.current.playbackRate = spd;
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-left text-[8px] font-mono transition-colors cursor-pointer ${
                            playbackSpeed === spd ? 'bg-accent text-white font-bold' : 'text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-0.5 pointer-events-auto">
            <h4 className="text-white font-black text-sm md:text-base leading-tight drop-shadow-lg tracking-tight truncate">
              {item.title}
            </h4>
            <p className="text-text-dim text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] drop-shadow-lg truncate">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Top10Row;

