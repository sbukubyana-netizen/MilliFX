import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, Sun, Moon, ChevronDown, Settings, Volume2, VolumeX, Sparkles, Download, Menu, X, Sliders, ArrowRight } from 'lucide-react';
import { TARGET_DATE, CATEGORIES } from '../constants';
import WhatsNewModal, { APP_UPDATES, UpdateItem } from './WhatsNewModal';
import InstallPromptModal from './InstallPromptModal';

const NAVBAR_THEMES = [
  { id: 'romantic', name: 'Romantic Pink', hex: '#ff2d55' },
  { id: 'sunset', name: 'Sunset Orange', hex: '#f97316' },
  { id: 'royal', name: 'Royal Velvet Purple', hex: '#8b5cf6' },
  { id: 'nostalgia', name: 'Golden Nostalgia', hex: '#eab308' },
  { id: 'rose', name: 'Deep Midnight Rose', hex: '#e11d48' },
  { id: 'teal', name: 'Ocean Teal', hex: '#0d9488' },
  { id: 'emerald', name: 'Emerald Green', hex: '#059669' },
];

interface NavbarProps {
  theme: 'dark' | 'light';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin: () => void;
  onOpenCustomizer?: () => void;
  selectedProfile: 'Girlfriend' | 'Boyfriend' | 'Us';
  onProfileSwitch: (profile: 'Girlfriend' | 'Boyfriend' | 'Us') => void;
  girlfriendImage?: string;
  boyfriendImage?: string;
  usImage?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  colorTheme?: string;
  onChangeColorTheme?: (theme: string) => void;
}

export default function Navbar({ 
  theme, 
  searchQuery, 
  setSearchQuery, 
  onOpenAdmin, 
  onOpenCustomizer,
  selectedProfile, 
  onProfileSwitch, 
  girlfriendImage, 
  boyfriendImage,
  usImage,
  soundEnabled,
  onToggleSound,
  colorTheme = 'romantic',
  onChangeColorTheme
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync Search Query with App Updates live
  const matchingUpdates = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return APP_UPDATES.filter(u => 
      u.title.toLowerCase().includes(q) || 
      u.desc.toLowerCase().includes(q) || 
      u.tag.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

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
          Milli<span className="text-text-main transition-colors">Sbu 🤍</span>
        </h1>
        <div className="relative hidden md:block">
          <button 
            onMouseEnter={() => setShowBrowseMenu(true)}
            onClick={() => setShowBrowseMenu(!showBrowseMenu)}
            className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-text-dim hover:text-text-main transition-colors select-none"
          >
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span>Themes</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showBrowseMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showBrowseMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onMouseLeave={() => setShowBrowseMenu(false)}
                className="absolute top-full left-0 mt-4 p-5 rounded-2xl bg-zinc-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] min-w-[320px] max-w-[360px] z-[120] space-y-4"
              >
                <div className="absolute -top-2 left-6 w-4 h-4 bg-zinc-950 border-t border-l border-white/10 rotate-45" />
                <div className="space-y-1 text-left">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Color Palette & Themes</h3>
                  <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                    Select a custom dynamic color theme. This instantly changes the main accents, gradients, glows, and branding across the entire experience.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {NAVBAR_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (onChangeColorTheme) onChangeColorTheme(t.id);
                        setShowBrowseMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        colorTheme === t.id 
                          ? 'bg-accent/15 text-accent border border-accent/20' 
                          : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                          style={{ backgroundColor: t.hex, boxShadow: `0 0 8px ${t.hex}` }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {colorTheme === t.id && (
                        <span className="text-[10px] uppercase font-black tracking-widest text-accent animate-pulse">Active</span>
                      )}
                    </button>
                  ))}
                </div>
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
            onClick={() => scrollToCategory('Her Smile Collection 😍')}
            className="hover:text-accent cursor-pointer transition-colors whitespace-nowrap"
          >
            Collection
          </li>
        </ul>
      </div>

      <div className="hidden md:flex items-center gap-3 md:gap-6">
        {/* Customize Sections & Animations Trigger */}
        {onOpenCustomizer && (
          <div 
            onClick={onOpenCustomizer}
            className={`p-2 rounded-full cursor-pointer transition-colors relative group ${
              theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
            }`}
            title="Customize Sections & Animations"
            id="customize-sections-nav-btn"
          >
            <Sliders className="w-4 h-4 md:w-5 md:h-5 text-accent hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Studio Dashboard Settings Trigger */}
        <div 
          onClick={onOpenAdmin}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
          title="Studio Media Dashboard"
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5 text-accent hover:scale-110 hover:rotate-45 transition-all duration-300" />
        </div>

        {/* Search with Live Sync to New Updates */}
        <div className="relative flex items-center" id="navbar-search-container">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: window.innerWidth < 640 ? 110 : 210, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <input
                  ref={searchInputRef}
                  placeholder="Search moments, music, updates..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      const target = document.getElementById('search-results-row') || document.getElementById('episodes-categories-section');
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setIsSearchDropdownOpen(false);
                      }
                    }
                  }}
                  className={`w-full bg-card-bg border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent text-text-main transition-all ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                  }`}
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Search 
            onClick={() => {
              if (!isSearchOpen) {
                setIsSearchOpen(true);
                setIsSearchDropdownOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 60);
              } else if (searchQuery.trim()) {
                const target = document.getElementById('search-results-row') || document.getElementById('episodes-categories-section');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setIsSearchDropdownOpen(false);
                }
              } else {
                setIsSearchOpen(false);
                setIsSearchDropdownOpen(false);
              }
            }}
            title="Search moments & sync with new updates"
            className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ml-2 transition-transform hover:scale-110 ${theme === 'dark' ? 'text-text-dim hover:text-white' : 'text-zinc-600 hover:text-black'}`} 
          />

          {/* Real-time Search Sync with New Updates Dropdown */}
          <AnimatePresence>
            {isSearchOpen && isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className={`absolute top-full right-0 mt-3 p-3.5 rounded-2xl shadow-2xl border min-w-[310px] sm:min-w-[340px] z-[200] backdrop-blur-xl ${
                  theme === 'dark' ? 'bg-zinc-950/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search Synced with Updates</span>
                  </span>
                  <button 
                    onClick={() => setIsSearchDropdownOpen(false)}
                    className="text-zinc-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Matching New Updates */}
                {matchingUpdates.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                      Matching New Updates ({matchingUpdates.length})
                    </div>
                    {matchingUpdates.slice(0, 3).map((up, uIdx) => (
                      <div
                        key={uIdx}
                        onClick={() => {
                          setIsWhatsNewOpen(true);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-accent/15 border border-white/5 hover:border-accent/30 transition-all cursor-pointer flex items-start gap-2.5 group"
                      >
                        <div className="p-1 rounded-lg bg-accent/20 text-accent shrink-0 mt-0.5">
                          {up.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate group-hover:text-accent transition-colors">
                            {up.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                            {up.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400 italic px-1 py-1 mb-2">
                    No changelog updates match "{searchQuery}"
                  </div>
                )}

                {/* Jump to Moments & Media in App */}
                <button
                  onClick={() => {
                    const target = document.getElementById('search-results-row') || document.getElementById('episodes-categories-section');
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setIsSearchDropdownOpen(false);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-accent text-white font-bold text-xs flex items-center justify-between hover:bg-accent/90 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Jump to Moments Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* What's New / Updates Sparkles Trigger */}
        <div 
          onClick={() => setIsWhatsNewOpen(true)}
          className={`p-2 rounded-full cursor-pointer transition-colors relative flex items-center justify-center ${
            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
          title="What's New in MilliSbu"
          id="whats-new-nav-btn"
        >
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#ff2d55] rounded-full animate-ping" />
        </div>

        {/* Download App Trigger */}
        <div 
          onClick={() => setIsInstallModalOpen(true)}
          className={`p-2 rounded-full cursor-pointer transition-colors relative flex items-center justify-center ${
            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
          title="Download App"
          id="download-app-nav-btn"
        >
          <Download className="w-4 h-4 md:w-5 md:h-5 text-accent" />
        </div>
        
        <div className="hidden lg:flex flex-col items-end gap-0.5 px-3 border-r border-border-subtle mr-2">
          <span className="text-[14px] font-black text-text-main tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">
            Live Room
          </span>
        </div>

        <div 
          onClick={() => onProfileSwitch(selectedProfile === 'Girlfriend' ? 'Boyfriend' : (selectedProfile === 'Boyfriend' ? 'Us' : 'Girlfriend'))}
          className="w-10 h-10 rounded-sm overflow-hidden cursor-pointer hover:ring-2 ring-accent transition-all bg-radial-gradient from-accent to-red-900 flex items-center justify-center relative group"
          title={`Switch to ${
            selectedProfile === 'Girlfriend' 
              ? 'Boyfriend (Sbu)' 
              : selectedProfile === 'Boyfriend' 
                ? 'Us Together 🤍' 
                : 'Girlfriend (Milli)'
          }`}
        >
          {selectedProfile === 'Girlfriend' ? (
            girlfriendImage || 'images/millicent1.jpg' ? (
              <img 
                src={girlfriendImage || 'images/millicent1.jpg'} 
                alt="Milli" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-xs font-black">M</span>
            )
          ) : selectedProfile === 'Boyfriend' ? (
            boyfriendImage ? (
              <img 
                src={boyfriendImage} 
                alt="Sbu" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-xs font-black">S</span>
            )
          ) : (
            usImage ? (
              <img 
                src={usImage} 
                alt="Us" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-xs font-black">M🤍S</span>
            )
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200 pointer-events-none" />
        </div>
      </div>

      {/* Mobile-Only Action Toolbar */}
      <div className="flex md:hidden items-center gap-3 select-none">
        {/* Switch Profile Avatar */}
        <div 
          onClick={() => onProfileSwitch(selectedProfile === 'Girlfriend' ? 'Boyfriend' : (selectedProfile === 'Boyfriend' ? 'Us' : 'Girlfriend'))}
          className="w-8.5 h-8.5 rounded-sm overflow-hidden cursor-pointer hover:ring-2 ring-accent transition-all bg-radial-gradient from-accent to-red-900 flex items-center justify-center relative group"
          title="Switch Profile"
        >
          {selectedProfile === 'Girlfriend' ? (
            girlfriendImage || 'images/millicent1.jpg' ? (
              <img 
                src={girlfriendImage || 'images/millicent1.jpg'} 
                alt="Milli" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-[10px] font-black">M</span>
            )
          ) : selectedProfile === 'Boyfriend' ? (
            boyfriendImage ? (
              <img 
                src={boyfriendImage} 
                alt="Sbu" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-[10px] font-black">S</span>
            )
          ) : (
            usImage ? (
              <img 
                src={usImage} 
                alt="Us" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white text-[10px] font-black">M🤍S</span>
            )
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Toggle mobile menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 rounded-full cursor-pointer transition-colors relative flex items-center justify-center ${
            theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'
          }`}
          title="Menu Options"
          id="mobile-menu-toggle-btn"
        >
          {isMobileMenuOpen ? (
            <X className="w-4.5 h-4.5 text-accent" />
          ) : (
            <Menu className="w-4.5 h-4.5 text-accent" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Dropdown Menu (Glass Morphism Blur and Fluid Sizes) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute top-full left-0 right-0 w-full max-h-[85vh] overflow-y-auto z-[150] px-4 py-6 border-b flex flex-col gap-6 md:hidden ${
              theme === 'dark' 
                ? 'bg-zinc-950/85 backdrop-blur-xl border-white/5 shadow-[0_22px_50px_rgba(0,0,0,0.85)]' 
                : 'bg-white/85 backdrop-blur-xl border-black/5 shadow-[0_22px_50px_rgba(0,0,0,0.15)]'
            }`}
            id="mobile-navigation-dropdown-menu"
          >
            {/* Search Input */}
            <div className="relative w-full flex flex-col gap-1.5">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-text-dim" />
                <input
                  placeholder="Search cinematic moments & updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs border border-border-subtle rounded-xl focus:outline-none focus:border-accent text-text-main transition-colors ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                  }`}
                />
              </div>

              {/* Mobile Matching Updates quick pill */}
              {matchingUpdates.length > 0 && (
                <div 
                  onClick={() => {
                    setIsWhatsNewOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-between text-[11px] font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{matchingUpdates.length} update{matchingUpdates.length > 1 ? 's' : ''} match "{searchQuery}"</span>
                  </span>
                  <span className="text-[10px] uppercase underline shrink-0">View</span>
                </div>
              )}
            </div>

            {/* Quick Actions Bento-style adaptive grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5 w-full">
              {/* Soundtrack sound toggle */}
              <button
                onClick={onToggleSound}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  soundEnabled
                    ? 'bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(255,45,85,0.2)]'
                    : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-text-main'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-accent animate-bounce" /> : <VolumeX className="w-4 h-4 text-text-dim" />}
                <span>{soundEnabled ? "Sound On" : "Sound Muted"}</span>
              </button>

              {/* Studio Settings Dashboard */}
              <button
                onClick={() => {
                  onOpenAdmin();
                  setIsMobileMenuOpen(false);
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-white'
                    : 'bg-black/5 border-black/5 text-zinc-600 hover:bg-black/10 hover:text-black'
                }`}
              >
                <Settings className="w-4 h-4 text-accent hover:rotate-45 transition-transform" />
                <span>Studio</span>
              </button>

              {/* Updates Sparkles */}
              <button
                onClick={() => {
                  setIsWhatsNewOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-white'
                    : 'bg-black/5 border-black/5 text-zinc-600 hover:bg-black/10 hover:text-black'
                }`}
              >
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                <span>Updates</span>
              </button>

              {/* Install Prompt App Link */}
              <button
                onClick={() => {
                  setIsInstallModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-white'
                    : 'bg-black/5 border-black/5 text-zinc-600 hover:bg-black/10 hover:text-black'
                }`}
              >
                <Download className="w-4 h-4 text-accent" />
                <span>App Link</span>
              </button>
            </div>

            {/* Color Palette & Themes inside mobile menu */}
            <div className="w-full border-t border-white/5 pt-4 space-y-3">
              <div className="space-y-1 px-1 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-accent block">Color Palette & Themes</span>
                <p className="text-[9px] text-zinc-400 leading-normal font-medium">
                  Select a custom dynamic color theme. This instantly changes the main accents, gradients, glows, and branding across the entire experience.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {NAVBAR_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (onChangeColorTheme) onChangeColorTheme(t.id);
                    }}
                    className={`text-left p-3 rounded-xl text-[11px] font-bold transition-all flex flex-col gap-1.5 cursor-pointer border ${
                      colorTheme === t.id 
                        ? 'bg-accent/15 text-accent border-accent/30 shadow-[0_0_12px_rgba(255,45,85,0.15)]' 
                        : 'bg-zinc-900/40 border-white/5 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: t.hex, boxShadow: `0 0 6px ${t.hex}` }}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation links inside mobile menu */}
            <div className="w-full border-t border-white/5 pt-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent block px-1">Quick Travel & Customizer</span>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => {
                    scrollToTop();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2.5 px-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-black/5 border-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    scrollToCategory('My Favorite Moments');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2.5 px-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-black/5 border-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => {
                    scrollToCategory('Her Smile Collection 😍');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2.5 px-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-black/5 border-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  Collection
                </button>
                {onOpenCustomizer && (
                  <button
                    onClick={() => {
                      onOpenCustomizer();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full text-center bg-accent text-white border-accent/20 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Layout</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Clock block */}
            <div className="w-full border-t border-white/5 pt-4 flex items-center justify-between px-1 text-text-dim text-[11px] select-none">
              <span className="font-extrabold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent animate-spin" style={{ animationDuration: '6s' }} /> Live Room Access
              </span>
              <span className="font-black text-white font-mono tracking-widest bg-black/40 px-2 py-1 rounded">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WhatsNewModal 
        isOpen={isWhatsNewOpen} 
        onClose={() => setIsWhatsNewOpen(false)} 
      />

      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </nav>
  );
}
