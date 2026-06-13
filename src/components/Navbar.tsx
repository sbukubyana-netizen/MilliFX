import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, Clock, Sun, Moon, ChevronDown, Settings, Volume2, VolumeX, Sparkles, Download, Menu, X } from 'lucide-react';
import { TARGET_DATE, CATEGORIES } from '../constants';
import WhatsNewModal from './WhatsNewModal';
import InstallPromptModal from './InstallPromptModal';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin: () => void;
  selectedProfile: 'Girlfriend' | 'Boyfriend' | 'Us';
  onProfileSwitch: (profile: 'Girlfriend' | 'Boyfriend' | 'Us') => void;
  girlfriendImage?: string;
  boyfriendImage?: string;
  usImage?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function Navbar({ 
  theme, 
  toggleTheme, 
  searchQuery, 
  setSearchQuery, 
  onOpenAdmin, 
  selectedProfile, 
  onProfileSwitch, 
  girlfriendImage, 
  boyfriendImage,
  usImage,
  soundEnabled,
  onToggleSound
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                    {cat.replace(' in MilliSbu', '')}
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

      <div className="hidden md:flex items-center gap-3 md:gap-6">
        {/* Dynamic Video Sound/Autoplay Bypass Toggle */}
        <button
          onClick={onToggleSound}
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-[10.5px] font-black uppercase tracking-widest ${
            soundEnabled
              ? 'bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.35)]'
              : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
          }`}
          title={soundEnabled ? "Mute backdrop trailer" : "Unmute / Play backdrop trailer with design-first sound"}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Sound Muted</span>
            </>
          )}
        </button>

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-card-bg border border-border-subtle rounded px-2 py-1 text-[11px] focus:outline-none focus:border-accent text-text-main transition-all ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                }`}
                autoFocus
                onBlur={() => {
                  if (!searchQuery) setIsSearchOpen(false);
                }}
              />
            )}
          </AnimatePresence>
          <Search 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) {
                setSearchQuery('');
              }
            }}
            className={`w-4 h-4 md:w-5 md:h-5 cursor-pointer ml-1.5 ${theme === 'dark' ? 'text-text-dim hover:text-white' : 'text-zinc-600 hover:text-black'}`} 
          />
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
                className={`absolute top-full right-0 mt-4 p-4 rounded-lg shadow-2xl border min-w-[290px] z-50 ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-main">Notifications</span>
                  <span className="text-[10px] text-accent font-bold uppercase">2 NEW</span>
                </div>
                <div className="space-y-3.5">
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

                  <div 
                    onClick={() => {
                      setShowNotifications(false);
                      setIsWhatsNewOpen(true);
                    }}
                    className="flex gap-3 items-start group cursor-pointer pt-3.5 border-t border-white/5 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center text-pink-500 flex-shrink-0 animate-bounce">
                      🚀
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-text-main leading-tight text-white group-hover:text-accent transition-colors">MilliSbu Version 2.4 Update Live!</p>
                      <p className="text-[10px] text-text-dim mt-1">Multiple Countdowns, Celebration portal & Auto-size trailers.</p>
                      <p className="text-[9px] text-[#ff2d55] mt-1.5 font-bold uppercase">Just now</p>
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
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-text-dim" />
              <input
                placeholder="Search cinematic moments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-xs border border-border-subtle rounded-xl focus:outline-none focus:border-accent text-text-main transition-colors ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                }`}
              />
            </div>

            {/* Quick Actions Bento-style adaptive grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5 w-full">
              {/* Theme Selector */}
              <button
                onClick={toggleTheme}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' 
                    : 'bg-black/5 border-black/5 text-black hover:bg-black/10'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>Theme</span>
              </button>

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

              {/* Notifications / Inbox with counts */}
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer w-full h-auto min-h-[44px] ${
                  showNotifications
                    ? 'bg-accent/15 border-accent text-accent'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:text-white'
                      : 'bg-black/5 border-black/5 text-zinc-600 hover:bg-black/10 hover:text-black'
                }`}
              >
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-accent rounded-full" />
                </div>
                <span>Inbox</span>
              </button>
            </div>

            {/* Notifications panel in menu block, styled if active */}
            {showNotifications && (
              <div className={`p-4 rounded-xl border w-full text-left space-y-3.5 ${
                theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'
              }`}>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-main">Selected Notifications</span>
                  <span className="text-[8px] text-accent font-extrabold uppercase bg-accent/10 px-1.5 py-0.5 rounded">2 New</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 items-start">
                    <span className="text-xs shrink-0 pt-0.5">🤍</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-text-main leading-tight">Milli, you have a new memory review!</p>
                      <p className="text-[9px] text-text-dim leading-snug mt-0.5">"The Story of Us" just hit 98% critical acclaim.</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      setIsWhatsNewOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex gap-2 items-start cursor-pointer hover:opacity-85"
                  >
                    <span className="text-xs shrink-0 pt-0.5 animate-bounce">🚀</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-text-main leading-tight text-white">MilliSbu Version 2.4 Update Live!</p>
                      <p className="text-[9px] text-text-dim leading-snug mt-0.5">Multiple Countdowns, Celebration portal & Auto-size trailers.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Browse Categories inside mobile menu */}
            <div className="w-full border-t border-white/5 pt-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d55] block px-1">Cinematic Genres</span>
              <div className="flex flex-col gap-1 w-full">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      scrollToCategory(cat);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-[10.5px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                      theme === 'dark' ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-700 hover:text-black'
                    }`}
                  >
                    <span>{cat.replace(' in MilliSbu', '')}</span>
                    <span className="text-accent">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation links inside mobile menu */}
            <div className="w-full border-t border-white/5 pt-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent block px-1">Quick Travel</span>
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={() => {
                    scrollToTop();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
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
                  className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-black/5 border-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => {
                    scrollToCategory('Our Watchlist (Future Seasons)');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full text-center ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-black/5 border-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  Collection
                </button>
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
