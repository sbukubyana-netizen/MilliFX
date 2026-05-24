import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, Clock, Sun, Moon, ChevronDown } from 'lucide-react';
import { TARGET_DATE, CATEGORIES } from '../constants';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  mood: string;
  setMood: (mood: string) => void;
}

export default function Navbar({ theme, toggleTheme, mood, setMood }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const moods = [
    { id: 'romantic', label: 'Romantic', color: 'bg-[#ff2d55]' },
    { id: 'playful', label: 'Playful', color: 'bg-[#ff8c00]' },
    { id: 'nostalgic', label: 'Nostalgic', color: 'bg-[#d4af37]' },
    { id: 'cinematic', label: 'Cinematic', color: 'bg-[#7c3aed]' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const diff = TARGET_DATE.getTime() - now.getTime();
      setCurrentTime(now);
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        });
      }
    };
    
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToCategory = (category: string) => {
    const id = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-100 transition-all duration-500 flex items-center justify-between px-4 md:px-12 py-3.5 md:py-5 ${
        isScrolled 
          ? 'bg-bg-deep/95 shadow-2xl border-b border-border-subtle' 
          : 'bg-linear-to-b from-bg-deep/20 to-transparent'
      }`}
    >
      <div className="flex items-center gap-3 md:gap-10">
        <h1 
          onClick={scrollToTop}
          className="text-accent text-xl md:text-3xl font-bold tracking-tighter cursor-pointer flex items-center gap-1 select-none"
        >
          Milli<span className="text-text-main transition-colors">Fix 🤍</span>
        </h1>
        <div className="relative">
          <button 
            onMouseEnter={() => setShowBrowseMenu(true)}
            onClick={() => setShowBrowseMenu(!showBrowseMenu)}
            className="flex items-center gap-1 text-xs md:text-sm font-medium text-text-dim hover:text-text-main transition-colors"
          >
            Browse <ChevronDown className={`w-4 h-4 transition-transform ${showBrowseMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showBrowseMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onMouseLeave={() => setShowBrowseMenu(false)}
                className={`absolute top-full left-0 mt-4 p-5 rounded-lg bg-bg-deep border border-border-subtle shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[280px] w-max z-[110] grid grid-cols-1 gap-1`}
              >
                <div className="absolute -top-2 left-4 w-4 h-4 bg-bg-deep border-t border-l border-border-subtle rotate-45" />
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      scrollToCategory(cat);
                      setShowBrowseMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-md text-[11px] font-black text-text-dim hover:text-accent hover:bg-white/5 transition-all uppercase tracking-[0.2em] whitespace-nowrap"
                  >
                    {cat.replace(' in MilliFix', '')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ul className="hidden lg:flex gap-6 text-[13px] font-bold text-text-dim uppercase tracking-wider">
          <li 
            onClick={scrollToTop}
            className="text-text-main hover:text-accent cursor-pointer transition-colors"
          >
            Home
          </li>
          <li 
            onClick={() => scrollToCategory('My Favorite Moments')}
            className="hover:text-accent cursor-pointer transition-colors whitespace-nowrap"
          >
            Favorites
          </li>
          <li 
            onClick={() => scrollToCategory('Our Watchlist (Future Seasons)')}
            className="hover:text-accent cursor-pointer transition-colors whitespace-nowrap"
          >
            Collection
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Mood Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowMoodMenu(!showMoodMenu)}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            <div className={`w-2 h-2 rounded-full bg-accent pr-0`} />
            <span className="hidden sm:inline">{mood}</span>
          </button>
          
          <AnimatePresence>
            {showMoodMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full right-0 mt-4 p-2 rounded-lg shadow-2xl border min-w-[140px] z-50 ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'
                }`}
              >
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMood(m.id);
                      setShowMoodMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold uppercase transition-colors ${
                      mood === m.id ? 'bg-accent/10 text-accent' : 'hover:bg-accent/5'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${m.color}`} />
                    {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div 
          onClick={toggleTheme}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: window.innerWidth < 640 ? 90 : 180, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                placeholder="Search..."
                className={`bg-card-bg border border-border-subtle rounded px-2 py-1 text-[11px] focus:outline-none focus:border-accent text-text-main transition-all ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                }`}
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            )}
          </AnimatePresence>
          <Search 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ml-1.5 ${theme === 'dark' ? 'text-text-dim hover:text-white' : 'text-zinc-600 hover:text-black'}`} 
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Bell 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ${theme === 'dark' ? 'text-text-dim hover:text-white' : 'text-zinc-600 hover:text-black'}`} 
          />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full border border-bg-deep shadow-[0_0_5px_var(--color-accent)]" />
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full right-0 mt-4 p-4 rounded-lg shadow-2xl border min-w-[280px] z-50 ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-main">Notifications</span>
                  <span className="text-[10px] text-accent font-bold uppercase">1 NEW</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start group cursor-pointer">
                    <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                      🤍
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-text-main leading-tight">Milli, you have a new memory review!</p>
                      <p className="text-[10px] text-text-dim mt-1">"The Story of Us" just hit 98% critical acclaim.</p>
                      <p className="text-[9px] text-accent mt-2 font-bold uppercase">2 minutes ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="hidden lg:flex flex-col items-end gap-0.5 px-3 border-r border-border-subtle mr-2">
          <span className="text-[14px] font-black text-text-main tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">
            Live Room
          </span>
        </div>

        <div className="w-8 h-8 rounded-sm overflow-hidden cursor-pointer hover:ring-2 ring-accent transition-all bg-linear-to-tr from-accent to-red-900">
          <img 
            src="images/millicent1.jpg" 
            alt="Profile" 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </nav>
  );
}
