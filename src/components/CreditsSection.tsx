import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Clapperboard, Film, Sparkles, 
  Heart, Award, Star, Settings, Image as ImageIcon, Video as VideoIcon
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
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [mode, setMode] = useState<'crawl' | 'grid'>('crawl');
  const [restartKey, setRestartKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
  // Standard speed = 40 seconds; 0.5x = 75s (slower); 2x = 20s (faster)
  const durationSeconds = speed === 0.5 ? 75 : speed === 2 ? 20 : 40;

  const handleRestart = () => {
    setRestartKey(prev => prev + 1);
    setIsPlaying(true);
  };

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

  return (
    <div className="py-24 px-4 sm:px-6 md:px-12 bg-black text-center border-t border-white/10 relative overflow-hidden" id="credits-section">
      
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
        <div className="flex items-center justify-center flex-wrap gap-3 py-2">
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-accent/20 border-accent text-accent shadow-sm'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "Pause Roll" : "Play Roll"}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold">
            {([0.5, 1, 2] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
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
              <span>Movie Crawl</span>
            </button>
            <button
              onClick={() => setMode('grid')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                mode === 'grid' ? 'bg-white/20 text-white font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Full Cast Board</span>
            </button>
          </div>

          {/* Edit Credits & Background in Settings Button */}
          <button
            onClick={handleOpenEditSettings}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-accent hover:text-white border border-white/15 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            title="Customize cast, titles, and background video/image in Settings"
          >
            <Settings className="w-3.5 h-3.5 text-accent group-hover:text-white transition-colors" />
            <span>Edit in Settings</span>
          </button>
        </div>

        {/* CINEMA VIEWPORT (AUTHENTIC MOVIE CREDIT ROLLING SCREEN WITH CUSTOM BG VIDEO/IMAGE) */}
        {mode === 'crawl' ? (
          <div 
            className="relative w-full max-w-3xl mx-auto h-[550px] sm:h-[640px] rounded-2xl bg-black border border-white/15 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center select-none"
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
            <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />

            {/* Top & Bottom Cinematic Vignette Fade Masks */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black via-black/90 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pointer-events-none" />

            {/* Film Sprocket Perforation Borders (Left & Right) */}
            <div className="absolute left-2 inset-y-0 w-3 flex flex-col justify-between py-4 z-20 opacity-25 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-2.5 h-3.5 rounded-xs border border-white/60 bg-transparent" />
              ))}
            </div>
            <div className="absolute right-2 inset-y-0 w-3 flex flex-col justify-between py-4 z-20 opacity-25 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-2.5 h-3.5 rounded-xs border border-white/60 bg-transparent" />
              ))}
            </div>

            {/* Hover indication tag */}
            {isHovered && (
              <div className="absolute top-6 right-6 z-30 px-2.5 py-1 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-zinc-400 backdrop-blur-md">
                Paused on Hover
              </div>
            )}

            {/* CONTINUOUS ROLLING CONTENT */}
            <div
              key={restartKey}
              style={{
                animation: `cinemaScroll ${durationSeconds}s linear infinite`,
                animationPlayState: (!isPlaying || isHovered) ? 'paused' : 'running',
              }}
              className="w-full px-8 sm:px-16 py-12 space-y-16 absolute top-0 z-15"
            >
              {/* Cinema Production Header Logo */}
              <div className="space-y-4 pt-12 pb-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border border-accent/40 flex items-center justify-center text-accent bg-black/40 backdrop-blur-sm">
                  <Film className="w-6 h-6" />
                </div>
                <h4 className="text-xl sm:text-2xl font-serif tracking-[0.3em] font-black text-white uppercase drop-shadow-md">
                  {creditsConfig.title || "A MilliSbu Pictures Production"}
                </h4>
                <div className="w-24 h-0.5 bg-accent mx-auto shadow-sm" />
                <p className="text-xs font-mono tracking-widest text-zinc-300 uppercase drop-shadow-sm">
                  {creditsConfig.subtitle || "Season 1 • Master Copy"}
                </p>
              </div>

              {/* Rolling Credit Categories */}
              {sectionsToRender.map((section, sIdx) => (
                <div key={sIdx} className="space-y-8">
                  {/* Category Header */}
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black tracking-[0.35em] text-accent uppercase drop-shadow-md">
                      {section.category}
                    </h5>
                    <div className="w-12 h-px bg-white/20 mx-auto" />
                  </div>

                  {/* Two Column Hollywood Layout */}
                  <div className="space-y-5 max-w-xl mx-auto">
                    {section.entries.map((entry, eIdx) => (
                      <div key={eIdx} className="grid grid-cols-12 gap-3 sm:gap-6 items-baseline text-left">
                        {/* Role on Left */}
                        <div className="col-span-5 text-right font-mono text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider drop-shadow-sm">
                          {entry.role}
                        </div>

                        {/* Dot separator */}
                        <div className="col-span-1 text-center text-zinc-500 text-xs font-mono">
                          •
                        </div>

                        {/* Name on Right */}
                        <div className="col-span-6 space-y-0.5">
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
              <div className="pt-16 pb-24 space-y-6 max-w-md mx-auto text-center border-t border-white/10">
                <p className="text-sm sm:text-base font-serif italic text-zinc-100 leading-relaxed drop-shadow-md">
                  "{creditsConfig.quote || 'Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.'}"
                </p>

                {/* Rating Seal */}
                <div className="inline-block p-4 border border-white/30 rounded-lg bg-black/50 backdrop-blur-md space-y-1 shadow-lg">
                  <div className="text-[10px] font-black tracking-widest text-white uppercase">
                    RATED ❤️ BY YOUR BOYFRIEND
                  </div>
                  <div className="text-[8px] font-mono text-zinc-300 tracking-wider uppercase">
                    Approved for Unconditional Love & Lifetime Cuddles
                  </div>
                </div>

                <div className="pt-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  © 2026 MILLISBU ENTERTAINMENT • ALL RIGHTS RESERVED
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ALTERNATIVE VIEW: STATIC HIGH-CONTRAST BENTO CAST BOARD */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto pt-4">
            {sectionsToRender.flatMap(s => s.entries).map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-accent/40 transition-all space-y-2"
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

      {/* Embedded CSS Keyframes for Cinema Crawl */}
      <style>{`
        @keyframes cinemaScroll {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(-100%);
          }
        }
      `}</style>
    </div>
  );
}
