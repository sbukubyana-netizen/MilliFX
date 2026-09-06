import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Plus, Heart, Volume2, Volume1, VolumeX, 
  Gauge, ChevronLeft, ChevronRight, Clock, Maximize2 
} from 'lucide-react';
import { Episode } from '../constants';

interface ContentRowProps {
  id?: string;
  title: string;
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  userStats?: { [key: string]: { views: number; likes: number } };
  onView?: (id: string) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ 
  id, 
  title, 
  episodes, 
  onSelectEpisode,
  userStats,
  onView
}) => {
  return (
    <div className="py-6 space-y-3" id={id}>
      <div className="px-6 md:px-12 flex items-center justify-between">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight transition-colors">
          {title}
        </h3>
      </div>
      
      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-6 no-scrollbar scroll-smooth">
          {episodes.map((episode) => {
            const stats = userStats?.[episode.id] || { views: 0, likes: 0 };
            return (
              <EpisodeCard 
                key={episode.id} 
                episode={episode} 
                stats={stats}
                onView={() => onView?.(episode.id)}
                onClick={() => onSelectEpisode(episode)} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EpisodeCard: React.FC<{ 
  episode: Episode; 
  onClick: () => void;
  stats?: { views: number; likes: number };
  onView?: () => void;
}> = ({ episode, onClick, stats = { views: 0, likes: 0 }, onView }) => {
  const isComingSoon = episode.images.length === 0;
  const totalSlides = episode.images.length;
  
  // Slide & media states
  const [slideIndex, setSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Volume & Speed states
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_card_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(true); // muted by default on card for pleasant UX
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('millisbu_card_speed');
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [slideSpeedInterval, setSlideSpeedInterval] = useState(4000); // 4s default per slide
  const [showSlideSpeedMenu, setShowSlideSpeedMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Identify current slide memory and video availability
  const currentMemory = totalSlides > 0 ? episode.images[slideIndex] : null;
  const videoInSlide = currentMemory?.videoUrl || (episode.previewImageUrl?.toLowerCase().endsWith('.mp4') ? episode.previewImageUrl : null);
  const isVideo = !!videoInSlide;

  // Auto-slide effect when playing image slideshow
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying && !isVideo && totalSlides > 1 && slideSpeedInterval > 0) {
      timer = setTimeout(() => {
        setSlideIndex((prev) => (prev + 1) % totalSlides);
      }, slideSpeedInterval);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, isVideo, totalSlides, slideSpeedInterval, slideIndex]);

  // Sync volume, mute & speed with HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed, isVideo]);

  // Handle Play/Pause synchronization
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
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
  }, [isPlaying, isVideo, slideIndex]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    localStorage.setItem('millisbu_card_volume', newVol.toString());
    if (newVol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  const handleSpeedSelect = (speed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSpeed(speed);
    localStorage.setItem('millisbu_card_speed', speed.toString());
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalSlides > 0) {
      setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalSlides > 0) {
      setSlideIndex((prev) => (prev + 1) % totalSlides);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, zIndex: 40 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (!isPlaying) setIsPlaying(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPlaying(false);
        setShowSpeedMenu(false);
        setShowSlideSpeedMenu(false);
        setSlideIndex(0);
        setCurrentTime(0);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className="flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] max-w-full rounded-lg shadow-2xl overflow-hidden bg-card-bg relative group flex flex-col border border-border-subtle hover:border-accent/60 transition-all select-none"
    >
      {/* Media Canvas Aspect Box */}
      <div className="aspect-video relative overflow-hidden bg-black">
        {/* Cover Image: ALWAYS shown until hovered */}
        <img
          src={episode.previewImageUrl}
          alt={episode.title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Hover preview: only active when hovered */}
        {isHovered && (
          isVideo ? (
            <video
              ref={videoRef}
              key={videoInSlide}
              src={videoInSlide}
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
                if (!isSeeking) {
                  setCurrentTime(e.currentTarget.currentTime);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              key={currentMemory?.imageUrl || episode.previewImageUrl}
              src={currentMemory?.imageUrl || episode.previewImageUrl}
              alt={episode.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          )
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Badges: Views, Slide Indicator & Mode */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Real View Count Badge (Starts at 0, only increments when fullscreen is clicked) */}
            <div className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/10 shadow flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>{stats.views || 0} {(stats.views || 0) === 1 ? 'View' : 'Views'}</span>
            </div>

            {isVideo ? (
              <span className="bg-red-600/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow">
                Video
              </span>
            ) : totalSlides > 0 ? (
              <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white border border-white/10 shadow">
                Slide {slideIndex + 1}/{totalSlides}
              </span>
            ) : null}

            {playbackSpeed !== 1.0 && isVideo && (
              <span className="bg-accent/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black font-mono text-white">
                {playbackSpeed}x
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
              onClick();
            }}
            className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-accent text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer hover:scale-110 shadow"
            title="Open Fullscreen"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Slide Navigation Buttons (< and >) */}
        {totalSlides > 1 && (
          <div className="absolute inset-y-0 inset-x-1.5 flex items-center justify-between pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-accent text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg hover:scale-110"
              title="Previous Slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-accent text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg hover:scale-110"
              title="Next Slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive Slide / Timeline Scrubber Bar on Card */}
        <div className="absolute bottom-1 inset-x-2 z-30">
          {isVideo ? (
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-mono text-zinc-300 min-w-[22px]">
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
                title="Slide & Seek Timeline"
              />
              <span className="text-[8px] font-mono text-zinc-300 min-w-[22px]">
                {duration > 0 ? formatTime(duration) : '0:00'}
              </span>
            </div>
          ) : totalSlides > 1 ? (
            /* Slide progress dots & scrubber */
            <div className="flex items-center justify-center gap-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {episode.images.slice(0, 10).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIndex(idx);
                  }}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    idx === slideIndex ? 'w-4 bg-accent' : 'w-1.5 bg-white/40 hover:bg-white'
                  }`}
                  title={`Slide to Moment ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Card Controls & Details Section */}
      <div className="p-3.5 bg-bg-deep/95 backdrop-blur-sm flex flex-col gap-2.5 border-t border-border-subtle">
        {/* Card Title & Heart */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-accent truncate block">
              {episode.description}
            </span>
            <h4 className="font-bold text-sm tracking-tight text-text-main truncate mt-0.5">
              {episode.title}
            </h4>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-accent transition-colors shrink-0"
            title="Favorite Episode"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Action Controls Bar on Every Card: Play, Volume, Speed, Slide Controls */}
        <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-white/5 flex-wrap">
          {/* Left: Play/Pause and Watch Now */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 rounded bg-white/10 hover:bg-white text-white hover:text-black transition-all cursor-pointer shadow"
              title={isPlaying ? "Pause Preview" : "Play Preview"}
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView?.();
                onClick();
              }}
              className="bg-accent text-white hover:opacity-90 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider transition-all cursor-pointer shadow"
            >
              Watch Now
            </button>
          </div>

          {/* Right: Volume Control, Video Speed & Slide Speed */}
          <div className="flex items-center gap-1.5">
            {/* Volume Control */}
            <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
              <button
                type="button"
                onClick={toggleMute}
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
                className="w-10 sm:w-12 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-accent"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Video Speed Control */}
            {isVideo && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowSlideSpeedMenu(false);
                  }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    playbackSpeed !== 1.0 
                      ? 'bg-accent/20 border-accent text-accent' 
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                  title="Video Playback Speed"
                >
                  <Gauge className="w-2.5 h-2.5" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full mb-1.5 right-0 bg-zinc-900 border border-white/15 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 z-50 min-w-[70px]">
                    {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={(e) => handleSpeedSelect(spd, e)}
                        className={`px-2 py-0.5 rounded text-left text-[9px] font-mono transition-colors cursor-pointer ${
                          playbackSpeed === spd ? 'bg-accent text-white font-bold' : 'text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slide Cycle Interval for multi-slide moments */}
            {!isVideo && totalSlides > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSlideSpeedMenu(!showSlideSpeedMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[9px] font-mono font-bold transition-all cursor-pointer"
                  title="Slide Transition Speed"
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{slideSpeedInterval / 1000}s</span>
                </button>

                {showSlideSpeedMenu && (
                  <div className="absolute bottom-full mb-1.5 right-0 bg-zinc-900 border border-white/15 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 z-50 min-w-[80px]">
                    {[
                      { l: '2s Fast', v: 2000 },
                      { l: '4s Normal', v: 4000 },
                      { l: '8s Slow', v: 8000 }
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlideSpeedInterval(opt.v);
                          setShowSlideSpeedMenu(false);
                        }}
                        className={`px-2 py-0.5 rounded text-left text-[9px] font-mono transition-colors cursor-pointer ${
                          slideSpeedInterval === opt.v ? 'bg-accent text-white font-bold' : 'text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

