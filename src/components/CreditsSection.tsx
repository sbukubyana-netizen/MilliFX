import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Clapperboard, Film, Sparkles, 
  Heart, Award, Star, Settings, Image as ImageIcon, Video as VideoIcon,
  Maximize2, Minimize2
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface CreditEntry {
  role: string;
  name: string;
  note?: string;
}

export interface CreditSectionData {
  category: string;
  entries: CreditEntry[];
}

export interface CreditsConfig {
  id: string;
  updatedAt: string;
  bgType?: 'none' | 'video' | 'image';
  bgMediaUrl?: string;
  bgOpacity?: number;
  title?: string;
  subtitle?: string;
  quote?: string;
  sections?: CreditSectionData[];
}

export const DEFAULT_CINEMA_CREDITS: CreditSectionData[] = [
  {
    category: "PRINCIPAL PRODUCTION",
    entries: [
      { role: "DIRECTED BY", name: "Your Favorite Person (Sbu 🤍)", note: "With all my heart & devotion" },
      { role: "EXECUTIVE PRODUCER", name: "Millicent 🤍", note: "Queen of My Heart & Executive Inspiration" },
      { role: "LEADING LADY & STAR", name: "Millicent (Milli 🤍)", note: "The most beautiful woman in the world" },
      { role: "CO-STAR & COMPANION", name: "Sbu (Fix 🤍)", note: "Always by your side" },
      { role: "SCREENPLAY & STORY", name: "Our True Love Story", note: "Written in the stars, Jan 18 to Infinity" }
    ]
  },
  {
    category: "CREATIVE & HAPPINESS DEPARTMENT",
    entries: [
      { role: "DIRECTOR OF PHOTOGRAPHY", name: "Every Candid Smile & Memory", note: "Captured through our lenses" },
      { role: "CHIEF HAPPINESS OFFICER", name: "Milli 🤍", note: "Bringer of warm laughter & light" },
      { role: "HEAD OF WARM HUGS", name: "Sbu 🤍", note: "Guaranteed comfort 24/7/365" },
      { role: "PASSENGER PRINCESS", name: "Milli 🤍", note: "Chief playlist curator & co-pilot" },
      { role: "LATE NIGHT SNACK COORDINATOR", name: "Both of Us 🍕", note: "Midnight cravings & sweetest treats" },
      { role: "INSIDE JOKE ARCHITECT", name: "Milli & Sbu 🤍", note: "Nobody understands our comedy but us" }
    ]
  },
  {
    category: "ATMOSPHERE & SOUNDSTAGE",
    entries: [
      { role: "ORIGINAL SOUNDTRACK SUPERVISOR", name: "Taylor Swift, Stephen Sanchez & Our Playlist", note: "Songs that define us" },
      { role: "LIGHTING & RADIANCE", name: "Her Incredible Smile", note: "Lit with pure golden hour sunshine" },
      { role: "SPECIAL EFFECTS (VFX)", name: "Butterfly Feelings", note: "Felt whenever our hands touch" },
      { role: "STUNT DOUBLES", name: "None — All Love Done 100% Real", note: "Raw, pure, authentic devotion" }
    ]
  },
  {
    category: "FILMED ON LOCATION",
    entries: [
      { role: "LOCATIONS", name: "Every Cozy Cafe, Sunset Drive, & Living Room Couch", note: "Wherever we are together is home" },
      { role: "CHOSEN HORIZON", name: "Future Road Trips & Adventures", note: "The best chapters are yet to come" }
    ]
  },
  {
    category: "SPECIAL ACKNOWLEDGMENTS",
    entries: [
      { role: "SPECIAL THANKS TO", name: "God, Fate, & Destiny", note: "For orchestrating our paths to cross" },
      { role: "SUPPORTING FAMILY", name: "Friends, Loved Ones, & Guardian Angels", note: "Who blessed our journey" },
      { role: "DEDICATION", name: "To Millicent — My Forever Valentine", note: "Season 1 was incredible, and Season 2 will be legendary" }
    ]
  }
];

interface CreditsSectionProps {
  onOpenSettings?: (tab?: string) => void;
}

export default function CreditsSection({ onOpenSettings }: CreditsSectionProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 1.5 | 2>(1);
  const [mode, setMode] = useState<'crawl' | 'grid'>('crawl');
  const [restartKey, setRestartKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Credits Configuration from Firestore
  const [creditsConfig, setCreditsConfig] = useState<CreditsConfig>({
    id: 'main',
    updatedAt: new Date().toISOString(),
    bgType: 'none',
    bgMediaUrl: '',
    bgOpacity: 0.35,
    title: 'MilliSbu Original Production',
    subtitle: 'Season 1: Still deeply in love with you 🤍',
    quote: 'Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.',
    sections: DEFAULT_CINEMA_CREDITS
  });

  // Listen for real-time changes to credits_config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'credits_config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CreditsConfig;
        setCreditsConfig({
          id: 'main',
          updatedAt: data.updatedAt || new Date().toISOString(),
          bgType: data.bgType || 'none',
          bgMediaUrl: data.bgMediaUrl || '',
          bgOpacity: typeof data.bgOpacity === 'number' ? data.bgOpacity : 0.35,
          title: data.title || 'MilliSbu Original Production',
          subtitle: data.subtitle || 'Season 1: Still deeply in love with you 🤍',
          quote: data.quote || 'Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.',
          sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : DEFAULT_CINEMA_CREDITS
        });
      }
    }, (err) => {
      console.warn("Credits config fallback listener:", err);
    });

    return () => unsub();
  }, []);

  // Speed calculation in seconds
  // Standard speed = 40 seconds; 0.5x = 75s (slower); 1.5x = 28s; 2x = 20s (faster)
  const durationSeconds = speed === 0.5 ? 75 : speed === 1.5 ? 28 : speed === 2 ? 20 : 40;

  const handleRestart = () => {
    setRestartKey(prev => prev + 1);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Lock body scroll and listen for Escape key when expanded to whole screen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullscreen]);

  const handleOpenEditSettings = () => {
    if (onOpenSettings) {
      onOpenSettings('credits_config');
    } else {
      window.dispatchEvent(new CustomEvent('open_admin_credits_settings'));
    }
  };

  const sectionsToRender = creditsConfig.sections && creditsConfig.sections.length > 0 
    ? creditsConfig.sections 
    : DEFAULT_CINEMA_CREDITS;

  const renderCrawlViewport = (isWholeScreen: boolean) => (
    <div 
      className={
        isWholeScreen
          ? "fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-black overflow-hidden flex items-center justify-center select-none"
          : "relative w-full max-w-3xl h-[520px] sm:h-[640px] mx-auto rounded-2xl bg-black border border-white/15 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] flex items-center justify-center select-none transition-all duration-500"
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Custom Background Media (Image or Video) */}
      {creditsConfig.bgType === 'image' && creditsConfig.bgMediaUrl && (
        <div 
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700"
          style={{ opacity: creditsConfig.bgOpacity ?? 0.35 }}
        >
          <img 
            src={creditsConfig.bgMediaUrl} 
            alt="Credits Atmosphere Background" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {creditsConfig.bgType === 'video' && creditsConfig.bgMediaUrl && (
        <div 
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700"
          style={{ opacity: creditsConfig.bgOpacity ?? 0.35 }}
        >
          <video 
            src={creditsConfig.bgMediaUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Dark vignette backdrop gradient overlay for perfect contrast */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none z-10" />

      {/* Projector Light Beam Cone Effect from Top */}
      <div className={`absolute top-0 inset-x-12 bg-gradient-to-b from-white/10 via-accent/5 to-transparent rounded-full blur-2xl pointer-events-none z-10 ${isWholeScreen ? 'h-96' : 'h-64'}`} />

      {/* Top & Bottom Cinematic Vignette Fade Masks */}
      <div className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black via-black/95 to-transparent z-20 pointer-events-none ${isWholeScreen ? 'h-36 sm:h-48' : 'h-28 sm:h-36'}`} />
      <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/95 to-transparent z-20 pointer-events-none ${isWholeScreen ? 'h-36 sm:h-48' : 'h-28 sm:h-36'}`} />

      {/* Film Sprocket Perforation Borders (Left & Right) */}
      <div className="absolute left-2 sm:left-4 inset-y-0 w-3 flex flex-col justify-between py-4 z-20 opacity-25 pointer-events-none">
        {Array.from({ length: isWholeScreen ? 28 : 18 }).map((_, i) => (
          <div key={i} className="w-2.5 h-3.5 rounded-xs border border-white/60 bg-transparent" />
        ))}
      </div>
      <div className="absolute right-2 sm:right-4 inset-y-0 w-3 flex flex-col justify-between py-4 z-20 opacity-25 pointer-events-none">
        {Array.from({ length: isWholeScreen ? 28 : 18 }).map((_, i) => (
          <div key={i} className="w-2.5 h-3.5 rounded-xs border border-white/60 bg-transparent" />
        ))}
      </div>

      {/* Floating Sparkle Particles */}
      <div className="absolute inset-0 z-12 pointer-events-none overflow-hidden opacity-35">
        <div className="cinema-particle cp-1" />
        <div className="cinema-particle cp-2" />
        <div className="cinema-particle cp-3" />
      </div>

      {/* Hover indication tag */}
      {isHovered && (
        <div className="absolute top-6 right-6 z-30 px-2.5 py-1 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-zinc-400 backdrop-blur-md">
          Paused on Hover
        </div>
      )}

      {/* Fullscreen whole-screen Top Floating Controls HUD */}
      {isWholeScreen && (
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 z-30 flex items-center justify-between pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="px-3.5 sm:px-4 py-2 rounded-full bg-black/75 hover:bg-black/95 border border-white/20 hover:border-white/40 text-white backdrop-blur-md cursor-pointer transition-all shadow-xl flex items-center gap-2 text-xs uppercase font-bold tracking-wider hover:scale-105 active:scale-95"
            title="Exit Fullscreen Theater (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-accent" />
            <span>Exit Fullscreen</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/20">Esc</kbd>
          </button>

          {/* Quick Playback HUD Controls in Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/80 border border-white/20 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-2xl">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying ? 'bg-accent text-white' : 'text-zinc-300 hover:text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <div className="h-4 w-px bg-white/20" />

            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              {([0.5, 1, 1.5, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd)}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    speed === spd ? 'bg-white/25 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Restart Roll"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTINUOUS ROLLING CONTENT */}
      <div
        key={restartKey}
        style={{
          animation: `cinemaScroll ${durationSeconds}s linear infinite`,
          animationPlayState: (!isPlaying || isHovered) ? 'paused' : 'running',
        }}
        className={`w-full ${isWholeScreen ? 'max-w-2xl sm:max-w-3xl' : ''} px-5 sm:px-12 md:px-16 py-12 space-y-12 sm:space-y-16 absolute top-0 z-15`}
      >
        {/* Cinema Production Header Logo */}
        <div className="space-y-3 sm:space-y-4 pt-12 pb-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full border border-accent/40 flex items-center justify-center text-accent bg-black/40 backdrop-blur-sm shadow-md">
            <Film className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-lg sm:text-2xl font-serif tracking-[0.25em] sm:tracking-[0.3em] font-black text-white uppercase drop-shadow-md px-2">
            {creditsConfig.title || "A MilliSbu Pictures Production"}
          </h4>
          <div className="w-24 h-0.5 bg-accent mx-auto shadow-sm" />
          <p className="text-[11px] sm:text-xs font-mono tracking-widest text-zinc-300 uppercase drop-shadow-sm px-2">
            {creditsConfig.subtitle || "Season 1 • Master Copy"}
          </p>
        </div>

        {/* Rolling Credit Categories */}
        {sectionsToRender.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6 sm:space-y-8">
            {/* Category Header */}
            <div className="space-y-1">
              <h5 className="text-[10px] sm:text-[11px] font-black tracking-[0.3em] sm:tracking-[0.35em] text-accent uppercase drop-shadow-md">
                {section.category}
              </h5>
              <div className="w-12 h-px bg-white/20 mx-auto" />
            </div>

            {/* Responsive Two Column Hollywood Layout */}
            <div className="space-y-4 sm:space-y-5 max-w-xl mx-auto px-2">
              {section.entries.map((entry, eIdx) => (
                <div key={eIdx} className="flex flex-col xs:flex-row xs:items-baseline justify-between gap-1 xs:gap-3 text-left">
                  {/* Role on Left */}
                  <div className="xs:w-5/12 text-left xs:text-right font-mono text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider drop-shadow-sm">
                    {entry.role}
                  </div>

                  {/* Dot separator */}
                  <div className="hidden xs:block text-center text-zinc-500 text-xs font-mono px-1">
                    •
                  </div>

                  {/* Name on Right */}
                  <div className="xs:w-6/12 space-y-0.5">
                    <span className="text-xs sm:text-sm font-black text-white tracking-wide block drop-shadow-md">
                      {entry.name}
                    </span>
                    {entry.note && (
                      <span className="text-[9px] sm:text-[10px] text-zinc-300 italic block drop-shadow-sm">
                        {entry.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Romantic Closing Quotation */}
        <div className="pt-16 pb-24 space-y-6 max-w-md mx-auto text-center border-t border-white/10 px-4">
          <p className="text-xs sm:text-base font-serif italic text-zinc-100 leading-relaxed drop-shadow-md">
            "{creditsConfig.quote || 'Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.'}"
          </p>

          {/* Rating Seal */}
          <div className="inline-block p-3.5 sm:p-4 border border-white/30 rounded-lg bg-black/50 backdrop-blur-md space-y-1 shadow-lg">
            <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center justify-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-accent fill-current animate-pulse" />
              <span>RATED BY YOUR FAVORITE PERSON</span>
              <Heart className="w-3.5 h-3.5 text-accent fill-current animate-pulse" />
            </div>
            <div className="text-[8px] font-mono text-zinc-300 tracking-wider uppercase">
              Approved for Unconditional Devotion & Lifetime Memories
            </div>
          </div>

          <div className="pt-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            © 2026 MILLISBU ENTERTAINMENT • ALL RIGHTS RESERVED
          </div>
        </div>

      </div>

    </div>
  );

  return (
    <div className="py-16 sm:py-24 px-3 sm:px-6 md:px-12 bg-black text-center border-t border-white/10 relative overflow-hidden" id="credits-section">
      
      {/* Film grain / stars background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Cinema Title Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Clapperboard className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">
              The Grand Finale • Movie Credits
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            {creditsConfig.title || "MilliSbu Original Production"}
          </h3>
          <p className="text-text-dim text-xs md:text-sm font-medium tracking-wide max-w-xl mx-auto">
            {creditsConfig.subtitle || '"Season 1: Still deeply in love with you 🤍" — Watch our real cinema credit crawl just like in the movies.'}
          </p>
        </div>

        {/* Cinema Control Bar */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 py-2">
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 sm:px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-accent/20 border-accent text-accent shadow-sm'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold">
            {([0.5, 1, 1.5, 2] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all cursor-pointer ${
                  speed === spd ? 'bg-accent text-white font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Restart Roll from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle between Cinema Crawl & Cast Grid */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold">
            <button
              onClick={() => setMode('crawl')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'crawl' ? 'bg-white/20 text-white font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Crawl</span>
            </button>
            <button
              onClick={() => setMode('grid')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'grid' ? 'bg-white/20 text-white font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>

          {/* Fullscreen Theater Button */}
          {mode === 'crawl' && (
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                isFullscreen
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/30'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
              title={isFullscreen ? "Exit Fullscreen Theater (Esc)" : "Theater Fullscreen (Whole Screen)"}
              aria-label={isFullscreen ? "Exit Fullscreen Theater" : "Theater Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit Credits & Background in Settings Button */}
          <button
            onClick={handleOpenEditSettings}
            className="px-3.5 sm:px-4 py-2 rounded-full bg-white/10 hover:bg-accent hover:text-white border border-white/15 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            title="Customize cast, titles, and background video/image in Settings"
          >
            <Settings className="w-3.5 h-3.5 text-accent group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Edit in Settings</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>

        {/* CINEMA VIEWPORT (AUTHENTIC MOVIE CREDIT ROLLING SCREEN WITH CUSTOM BG VIDEO/IMAGE) */}
        {mode === 'crawl' ? (
          <>
            {isFullscreen ? (
              <>
                {/* In-page Placeholder while expanded in Fullscreen Whole-Screen Theater */}
                <div className="relative w-full max-w-3xl h-[400px] sm:h-[480px] mx-auto rounded-2xl bg-black/60 border border-white/15 overflow-hidden flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
                  <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-accent animate-pulse shadow-lg shadow-accent/20">
                    <Film className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                      Theater Fullscreen Active
                    </h4>
                    <p className="text-zinc-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      Movie credits are currently taking over the whole screen. Press <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs border border-white/20">Esc</kbd> or use the button below to return.
                    </p>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-accent" />
                    <span>Exit Fullscreen</span>
                  </button>
                </div>

                {/* Whole-screen Portal to document.body */}
                {createPortal(renderCrawlViewport(true), document.body)}
              </>
            ) : (
              renderCrawlViewport(false)
            )}
          </>
        ) : (
          /* ALTERNATIVE VIEW: STATIC HIGH-CONTRAST BENTO CAST BOARD */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left max-w-5xl mx-auto pt-4">
            {sectionsToRender.flatMap(s => s.entries).map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-accent/40 transition-all space-y-2"
              >
                <div className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
                  {item.role}
                </div>
                <div className="text-sm font-black text-white tracking-tight">
                  {item.name}
                </div>
                {item.note && (
                  <div className="text-[10px] text-zinc-400 italic">
                    {item.note}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom subtle quote */}
        <div className="pt-6 text-center">
          <p className="text-zinc-500 text-xs italic">
            "To infinity and beyond, in every universe 🤍"
          </p>
        </div>

      </div>

      {/* Embedded CSS Keyframes for Cinema Crawl and Particles */}
      <style>{`
        @keyframes cinemaScroll {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(-100%);
          }
        }
        @keyframes floatDust {
          0% {
            transform: translateY(100%) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-20%) translateX(25px);
            opacity: 0;
          }
        }
        .cinema-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #ff2d55;
          border-radius: 50%;
          filter: blur(0.5px);
          animation: floatDust 14s infinite linear;
        }
        .cp-1 {
          left: 20%;
          animation-duration: 12s;
          animation-delay: 0s;
        }
        .cp-2 {
          left: 55%;
          animation-duration: 16s;
          animation-delay: 4s;
          width: 3px;
          height: 3px;
          background: #ffd700;
        }
        .cp-3 {
          left: 80%;
          animation-duration: 15s;
          animation-delay: 7s;
        }
      `}</style>
    </div>
  );
}
