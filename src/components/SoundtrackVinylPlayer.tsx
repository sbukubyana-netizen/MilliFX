import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Music, Disc, Sparkles, Heart, Plus, Trash2, Send } from 'lucide-react';

interface SoundtrackTrack {
  id: number;
  title: string;
  url: string;
  genre: string;
  duration: string;
  story: string;
  coverColor: string;
}

const VINYL_PLAYLIST: SoundtrackTrack[] = [
  { 
    id: 1, 
    title: "Our Theme 🤍", 
    url: "music/1.mp3",
    genre: "Acoustic / Warm Classical",
    duration: "2:45",
    story: "The track that started it all. The warmth of lazy brunch mornings, home-cooked dinners, and quiet gazes.",
    coverColor: "from-rose-500 to-pink-600"
  },
  { 
    id: 2, 
    title: "Sweet Memories 🍬", 
    url: "music/2.mp3",
    genre: "Lo-Fi Sweet Pop",
    duration: "3:12",
    story: "Spontaneous cozy dates, sweet whispers, inside jokes, and laughing until our lungs gave out.",
    coverColor: "from-amber-400 to-orange-500"
  },
  { 
    id: 3, 
    title: "Afternoon Glow ☀️", 
    url: "music/3.mp3",
    genre: "Warm Golden-Hour Dream",
    duration: "2:50",
    story: "Driving with the windows down, hand in hand, letting the sunny breeze fill our hearts with gold.",
    coverColor: "from-amber-500 to-rose-500"
  },
  { 
    id: 4, 
    title: "Midnight Whispers 🌙", 
    url: "music/4.mp3",
    genre: "Late-Night Cozy R&B",
    duration: "3:30",
    story: "Deep pillow talk sessions talking about the universe, our future, and realizing we are written in the stars.",
    coverColor: "from-violet-600 to-purple-800"
  },
  { 
    id: 5, 
    title: "Playful Vibes 🎈", 
    url: "music/5.mp3",
    genre: "Upbeat Acoustic Indie",
    duration: "2:25",
    story: "The soundtrack to pillow fights, playful teasing, and being absolute goofballs together forever.",
    coverColor: "from-emerald-400 to-teal-600"
  },
  { 
    id: 6, 
    title: "The Journey 🎞️", 
    url: "music/6.mp3",
    genre: "Cinematic Dreamscape",
    duration: "4:00",
    story: "From our very first 'hello' to this beautiful live digital archive. Every single chapter is written in pure love.",
    coverColor: "from-cyan-500 to-blue-600"
  }
];

interface SongDedication {
  id: string;
  songTitle: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  sticker: 'heart' | 'star' | 'rose' | 'fire';
}

export default function SoundtrackVinylPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  
  // Dedications storage
  const [dedications, setDedications] = useState<SongDedication[]>(() => {
    const saved = localStorage.getItem('millifix_song_dedications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: 'ded-1',
        songTitle: 'Our Theme 🤍',
        from: 'Fix 🤍',
        to: 'Milli 🤍',
        message: 'This always reminds me of the first time our eyes synced. Play it on repeat! 🥰',
        timestamp: '24 May 2026',
        sticker: 'heart'
      }
    ];
  });

  // Dedication form state
  const [dedFormSong, setDedFormSong] = useState(VINYL_PLAYLIST[0].title);
  const [dedFormFrom, setDedFormFrom] = useState<'Fix 🤍' | 'Milli 🤍' | 'Us 🤍'>('Fix 🤍');
  const [dedFormTo, setDedFormTo] = useState<'Milli 🤍' | 'Fix 🤍' | 'Us 🤍'>('Milli 🤍');
  const [dedFormMsg, setDedFormMsg] = useState('');
  const [dedSticker, setDedSticker] = useState<'heart' | 'star' | 'rose' | 'fire'>('heart');
  const [showDedCreator, setShowDedCreator] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = VINYL_PLAYLIST[currentTrackIndex];

  useEffect(() => {
    localStorage.setItem('millifix_song_dedications', JSON.stringify(dedications));
  }, [dedications]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle source changes
  const handleTrackChange = (index: number, autoPlay: boolean = false) => {
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setIsPlaying(autoPlay);
    
    if (audioRef.current) {
      audioRef.current.src = VINYL_PLAYLIST[index].url;
      audioRef.current.load();
      if (autoPlay) {
        // Wait minor delay to prevent rapid play/pause interrupts
        setTimeout(() => {
          audioRef.current?.play().catch(e => {
            console.log("Audio play deferred until user gesture", e);
            setIsPlaying(false);
          });
        }, 150);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio failed or is blocked by browser autoplay constraints", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleTrackEnded = () => {
    const nextIndex = (currentTrackIndex + 1) % VINYL_PLAYLIST.length;
    handleTrackChange(nextIndex, true);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % VINYL_PLAYLIST.length;
    handleTrackChange(nextIndex, isPlaying);
  };

  const handlePrev = () => {
    const prevIndex = (currentTrackIndex - 1 + VINYL_PLAYLIST.length) % VINYL_PLAYLIST.length;
    handleTrackChange(prevIndex, isPlaying);
  };

  // Dedication posting
  const handlePostDedication = () => {
    if (!dedFormMsg.trim()) return;

    const newDed: SongDedication = {
      id: `ded-${Date.now()}`,
      songTitle: dedFormSong,
      from: dedFormFrom,
      to: dedFormTo,
      message: dedFormMsg,
      timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      sticker: dedSticker
    };

    setDedications(prev => [newDed, ...prev]);
    setDedFormMsg('');
    setShowDedCreator(false);
  };

  const handleDeleteDedication = (id: string) => {
    setDedications(prev => prev.filter(d => d.id !== id));
  };

  // Helper formats
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="py-24 px-4 md:px-12 bg-bg-deep border-t border-border-subtle relative overflow-hidden" id="soundtrack-vinyl-player">
      {/* Dynamic Background Glow representing the cover art */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full filter blur-[140px] pointer-events-none transition-colors duration-1000" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <Music className="w-3.5 h-3.5 text-accent animate-bounce" />
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.25em]">Exclusive Soundtrack</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
            The Soundtrack of Us
          </h2>
          <p className="text-text-dim text-xs md:text-sm">
            Spin our private romantic vinyl! Choose your favorite melody, read the heartfelt memory logs, and drop sweet track dedications directly onto our dashboard memory wall 🤍
          </p>
        </div>

        {/* Player Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: 12-column span -> 5 for Vinyl, 4 for Track details, 3 for list */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-black/40 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
            
            {/* MD-5: The Virtual Turntable Visualizer */}
            <div className="md:col-span-6 flex flex-col items-center justify-center space-y-6">
              
              {/* Turntable Base */}
              <div className="relative aspect-square w-full max-w-[280px] bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Turntable metal ring */}
                <div className="absolute inset-4 rounded-full border border-zinc-700/50 bg-neutral-950/40" />

                {/* Spinning Vinyl */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div
                    animate={isPlaying ? { rotate: 360 } : {}}
                    transition={isPlaying ? { repeat: Infinity, duration: 4.5, ease: "linear" } : { duration: 0 }}
                    className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-full bg-stone-950 flex items-center justify-center shadow-2xl relative select-none"
                    style={{
                      background: 'radial-gradient(circle, #333 2%, #111 6%, #1a1a1a 12%, #0a0a0a 13%, #1a1a1a 25%, #0d0d0d 26%, #1e1e1e 40%, #0d0d0d 41%, #222 65%, #050505 66%, #1c1c1c 85%, #000 100%)'
                    }}
                  >
                    {/* Concentric Grooves */}
                    <div className="absolute inset-2 rounded-full border border-white/5 opacity-40 pointer-events-none" />
                    <div className="absolute inset-6 rounded-full border border-white/5 opacity-30 pointer-events-none" />
                    <div className="absolute inset-10 rounded-full border border-white/5 opacity-40 pointer-events-none" />
                    <div className="absolute inset-14 rounded-full border border-white/5 opacity-30 pointer-events-none" />
                    <div className="absolute inset-18 rounded-full border border-white/5 opacity-40 pointer-events-none" />

                    {/* Disc Center Label */}
                    <div className={`w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-tr ${currentTrack.coverColor} flex items-center justify-center relative p-1 shadow-inner border border-black/30`}>
                      {/* Album Center Spindle hole */}
                      <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 z-10 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-zinc-500" />
                      </div>
                      
                      {/* Interactive decorative sparkles of love */}
                      {isPlaying && (
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 border border-white/10 rounded-full"
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Stylus Needle Needleholder */}
                  {/* Absolute positioning in the top right corner of the player */}
                  <div className="absolute top-0 right-1 z-20 pointer-events-none">
                    <img src="" referrerPolicy="no-referrer" alt="" className="hidden" />
                    <motion.div
                      animate={isPlaying ? { rotate: 22 } : { rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 50, damping: 10 }}
                      className="origin-[30px_10px] relative"
                      style={{ left: '-30px', top: '5px' }}
                    >
                      {/* Arm Base pivot */}
                      <div className="w-[36px] h-[36px] rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      </div>
                      {/* Curved metal tonearm */}
                      <div className="w-2.5 h-20 bg-zinc-400 rounded-full absolute top-[14px] left-[14px] origin-top shadow-md"
                           style={{ transform: 'rotate(-5deg) translate(-2px, -2px)' }}>
                        {/* Stylus cartridge piece at the tip */}
                        <div className="w-4 h-6 bg-zinc-700 rounded absolute bottom-0 -left-1 flex flex-col items-center">
                          <div className="w-1.5 h-2.5 bg-accent/60" /> {/* Stylus tracker highlight */}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating micro animations under the Disc */}
              <div className="h-6 flex items-center gap-1">
                <AnimatePresence>
                  {isPlaying && (
                    <>
                      {['🎵', '🤍', '✨', '🎶'].map((symbol, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ 
                            opacity: [0, 1, 1, 0], 
                            y: [-12, -45], 
                            x: [0, i % 2 === 0 ? 15 : -15, 0],
                            scale: [0.8, 1.1, 1, 0.7] 
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.5 }}
                          className="text-xs text-accent text-center filter drop-shadow-md select-none font-bold"
                        >
                          {symbol}
                        </motion.span>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* MD-6: Audio Controls & Metadata details */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                {/* Playing Metadata */}
                <div>
                  <span className="text-accent text-[9px] font-black uppercase tracking-widest block">Now Playing Chapter</span>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight mt-1">{currentTrack.title}</h3>
                  <div className="flex items-center gap-2 mt-1 px-2.5 py-0.5 self-start bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-wider font-extrabold text-text-dim w-fit mt-2">
                    <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                    {currentTrack.genre}
                  </div>
                </div>

                {/* Track story description */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-text-dim leading-relaxed font-medium italic">
                    "{currentTrack.story}"
                  </p>
                </div>
              </div>

              {/* Slider Progress Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-dim uppercase tracking-wider font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="relative group/progress">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none transition-all group-hover/progress:h-2"
                  />
                  {/* Styled Progress Glow Overlay */}
                  <div 
                    className="absolute top-0 left-0 h-1.5 bg-accent pointer-events-none rounded-l-lg"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Console player controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
                
                {/* Secondary: Skip Back */}
                <button
                  onClick={handlePrev}
                  className="p-3 text-text-dim hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Core Play Center */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlay}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_5px_15px_rgba(255,45,85,0.2)] cursor-pointer ${
                    isPlaying 
                      ? 'bg-zinc-800 border border-zinc-700 text-accent hover:border-accent' 
                      : 'bg-accent text-white hover:opacity-90 contrast-125'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </motion.button>

                {/* Secondary: Skip Forward */}
                <button
                  onClick={handleNext}
                  className="p-3 text-text-dim hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Hidden Core Audio element */}
                <audio
                  ref={audioRef}
                  src={currentTrack.url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleTrackEnded}
                />
              </div>

            </div>

          </div>

          {/* RIGHT: Quick Track List (4 spans) */}
          <div className="lg:col-span-4 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6 h-full max-h-[480px]">
            
            <div className="space-y-4 overflow-y-auto no-scrollbar pr-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">MilliFix Album Tracks</span>
                <span className="text-[10px] font-black tracking-wider text-accent uppercase font-mono">{VINYL_PLAYLIST.length} Chapters</span>
              </div>

              {/* Fast Track list rows */}
              <div className="space-y-2.5">
                {VINYL_PLAYLIST.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <button
                      key={track.id}
                      onClick={() => handleTrackChange(idx, true)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-accent/10 border-accent/40 text-white shadow-[0_0_15px_rgba(255,45,85,0.1)]' 
                          : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-text-dim hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={`text-[10px] font-mono font-black ${isCurrent ? 'text-accent' : 'text-text-dim/50'}`}>
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        
                        <div className="truncate">
                          <p className="text-xs font-bold truncate tracking-tight">{track.title}</p>
                          <p className="text-[9px] opacity-70 mt-0.5 font-medium truncate uppercase tracking-widest">{track.genre}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
                        {isCurrent && isPlaying ? (
                          <div className="flex gap-0.5 items-end h-2.5 shrink-0">
                            <motion.div animate={{ height: [2, 7, 2] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-accent" />
                            <motion.div animate={{ height: [2, 9, 2] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-accent" />
                            <motion.div animate={{ height: [2, 5, 2] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-accent" />
                          </div>
                        ) : (
                          <span className="opacity-60">{track.duration}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro Quick sound indicator helper */}
            <div className="pt-4 border-t border-white/5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center">
              💡 Turn up your speakers & sync with your partner
            </div>

          </div>

        </div>

        {/* BOTTOM DEDICATIONS: Floating Love stickers */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent block">The Lyric Wall</span>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Track Dedications</h3>
              <p className="text-text-dim text-xs">Dedicate a specific chapter story to your partner with a romantic sticker of recognition.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDedCreator(true)}
              className="flex items-center gap-1.5 self-start md:self-end bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-full border border-white/10 font-bold text-xs uppercase tracking-widest cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Write Dedication
            </motion.button>
          </div>

          {/* Sticker display board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {dedications.map((ded) => (
                <motion.div
                  layout
                  key={ded.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="bg-black/30 border border-white/5 hover:border-white/10 rounded-xl p-5 relative flex flex-col justify-between gap-4 backdrop-blur-sm group"
                >
                  {/* Beautiful sticker tag */}
                  <div className="absolute -top-2.5 -right-2.5 bg-accent/20 border border-accent/40 w-8 h-8 rounded-full flex items-center justify-center animate-pulse shadow-lg select-none">
                    {ded.sticker === 'heart' && '❤️'}
                    {ded.sticker === 'star' && '⭐️'}
                    {ded.sticker === 'rose' && '🌹'}
                    {ded.sticker === 'fire' && '🔥'}
                  </div>

                  <div className="space-y-3.5">
                    {/* Track tag */}
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-accent bg-accent/5 border border-accent/20 px-2 py-0.5 rounded w-fit">
                      <Disc className="w-3 h-3 text-accent" />
                      {ded.songTitle}
                    </div>

                    <p className="text-xs text-text-dim font-medium leading-relaxed italic pr-4">
                      "{ded.message}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-[9px] uppercase tracking-wider font-extrabold text-text-dim/80">
                    <div>
                      <span className="text-text-main font-black lowercase">{ded.from}</span>
                      <span className="mx-1">➔</span>
                      <span className="text-text-main font-black lowercase">{ded.to}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>{ded.timestamp}</span>
                      <button
                        onClick={() => handleDeleteDedication(ded.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-0.5 cursor-pointer"
                        title="Remove Dedication"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Write Dedication Stick Dialog popup creator */}
      <AnimatePresence>
        {showDedCreator && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setShowDedCreator(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-bg-deep border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl z-10"
              id="dedication-creator"
            >
              <div className="space-y-1">
                <span className="text-accent text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-3 h-3 fill-current" />
                  Dedicate Love Track
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">Write Your Dedication</h3>
              </div>

              <div className="space-y-4">
                
                {/* Select track to dedicate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">Choose Album Track</label>
                  <select
                    value={dedFormSong}
                    onChange={(e) => setDedFormSong(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent font-medium"
                  >
                    {VINYL_PLAYLIST.map((t) => (
                      <option key={t.id} value={t.title} className="bg-bg-deep">{t.title}</option>
                    ))}
                  </select>
                </div>

                {/* From / To grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">From</label>
                    <select
                      value={dedFormFrom}
                      onChange={(e) => setDedFormFrom(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent font-medium text-center"
                    >
                      <option value="Fix 🤍" className="bg-bg-deep">Fix 🤍</option>
                      <option value="Milli 🤍" className="bg-bg-deep">Milli 🤍</option>
                      <option value="Us 🤍" className="bg-bg-deep">Us 🤍</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">To</label>
                    <select
                      value={dedFormTo}
                      onChange={(e) => setDedFormTo(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent font-medium text-center"
                    >
                      <option value="Milli 🤍" className="bg-bg-deep">Milli 🤍</option>
                      <option value="Fix 🤍" className="bg-bg-deep">Fix 🤍</option>
                      <option value="Us 🤍" className="bg-bg-deep">Us 🤍</option>
                    </select>
                  </div>
                </div>

                {/* Choose a sticker icon */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">Add Sticker Badge</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { id: 'heart', tag: '❤️', label: 'love' },
                      { id: 'star', tag: '⭐️', label: 'special' },
                      { id: 'rose', tag: '🌹', label: 'rose' },
                      { id: 'fire', tag: '🔥', label: 'passion' },
                    ] as const).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDedSticker(st.id)}
                        className={`py-2 rounded-lg border text-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
                          dedSticker === st.id
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-black/30 border-white/5 text-text-dim hover:text-white hover:border-white/10'
                        }`}
                      >
                        <span>{st.tag}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-1 text-text-dim/60">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block block">Appreciation Message</label>
                  <textarea
                    value={dedFormMsg}
                    onChange={(e) => setDedFormMsg(e.target.value)}
                    maxLength={100}
                    rows={3}
                    placeholder="Why are you dedicating this soundtrack chapter to your partner? (Max 100 letters)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-accent resize-none placeholder:text-zinc-600 font-medium leading-relaxed"
                  />
                  <div className="text-right text-[9px] text-text-dim/60">{dedFormMsg.length}/100 letters</div>
                </div>

                {/* Submit triggers */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowDedCreator(false)}
                    className="px-4 py-2 border border-white/10 rounded font-bold text-[10px] uppercase tracking-wider text-text-dim hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostDedication}
                    disabled={!dedFormMsg.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-accent text-white font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Live Dedication
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
