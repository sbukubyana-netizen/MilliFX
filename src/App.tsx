/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppStage, EPISODES, RAW_MEMORIES, CATEGORIES, Memory, Episode } from './constants';
import ProfileSelector from './components/ProfileSelector';
import TrailerPlayer from './components/TrailerPlayer';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import { ContentRow } from './components/ContentRow';
import Top10Row from './components/Top10Row';
import InteractiveQuiz from './components/InteractiveQuiz';
import CreditsSection from './components/CreditsSection';
import ImageModal from './components/ImageModal';
import CountdownPage from './components/CountdownPage';
import BackgroundMusic from './components/BackgroundMusic';
import Notification from './components/Notification';
import CountdownBox from './components/CountdownBox';
import CelebrationPortal from './components/CelebrationPortal';
import LoveLetter from './components/LoveLetter';
import LoveNotesBoard from './components/LoveNotesBoard';
import WhatToDoTogether from './components/WhatToDoTogether';
import LoveJar from './components/LoveJar';
import SoundtrackVinylPlayer from './components/SoundtrackVinylPlayer';
import AdminMediaSettings from './components/AdminMediaSettings';
import LiveLocationTracker from './components/LiveLocationTracker';
import AppBackground from './components/AppBackground';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PlayCircle } from 'lucide-react';

export default function App() {
  const [stage, setStage] = useState<AppStage>('profile-selection');
  const [selectedProfile, setSelectedProfile] = useState<'Girlfriend' | 'Boyfriend' | 'Us'>(() => {
    const saved = localStorage.getItem('millifix_profile');
    return (saved as 'Girlfriend' | 'Boyfriend' | 'Us') || 'Girlfriend';
  });
  const [celebrationEvent, setCelebrationEvent] = useState<{ title: string; body: string; name: string } | null>(null);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [currentCollection, setCurrentCollection] = useState<Memory[]>([]);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [isMusicPaused, setIsMusicPaused] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);
  const [showTbaEpisode, setShowTbaEpisode] = useState<Episode | null>(null);

  // Predefined customizable theme presets
  const COLOR_THEMES = [
    { id: 'romantic', name: 'Romantic Pink/Red', hex: '#ff2d55', rgb: '255, 45, 85' },
    { id: 'sunset', name: 'Sunset Warm Orange', hex: '#ff8c00', rgb: '255, 140, 0' },
    { id: 'royal', name: 'Royal Velvet Purple', hex: '#7c3aed', rgb: '124, 58, 237' },
    { id: 'gold', name: 'Golden Retro Nostalgia', hex: '#d4af37', rgb: '212, 175, 55' },
    { id: 'rose', name: 'Deep Midnight Rose', hex: '#e11d48', rgb: '225, 29, 72' },
    { id: 'teal', name: 'Ocean Breathe Teal', hex: '#0d9488', rgb: '13, 148, 136' },
    { id: 'emerald', name: 'Emerald Forest Green', hex: '#059669', rgb: '5, 150, 105' },
  ];

  // Synchronized Dynamic Settings states
  const [customEpisodes, setCustomEpisodes] = useState<Episode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminSuccessMessage, setAdminSuccessMessage] = useState<string | null>(null);

  const [studioSettings, setStudioSettings] = useState<{
    trailerVideoUrl: string;
    boyfriendProfileImage: string;
    girlfriendProfileImage: string;
    usProfileImage?: string;
    bannerVideos: string[];
    boyfriendBannerVideos: string[];
    girlfriendBannerVideos: string[];
    usBannerVideos?: string[];
    backgroundSoundEnabled?: boolean;
    colorTheme?: string;
  }>({
    trailerVideoUrl: '/videos/8.mp4',
    boyfriendProfileImage: '',
    girlfriendProfileImage: 'images/millicent1.jpg',
    usProfileImage: '',
    bannerVideos: ['videos/6.mp4', 'videos/7.mp4'],
    boyfriendBannerVideos: [],
    girlfriendBannerVideos: [],
    usBannerVideos: [],
    backgroundSoundEnabled: false,
    colorTheme: 'romantic'
  });

  // Subscribe to real-time studio customizations in Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'studio_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStudioSettings({
          trailerVideoUrl: data.trailerVideoUrl || '/videos/8.mp4',
          boyfriendProfileImage: data.boyfriendProfileImage || '',
          girlfriendProfileImage: data.girlfriendProfileImage || 'images/millicent1.jpg',
          usProfileImage: data.usProfileImage || '',
          bannerVideos: data.bannerVideos || ['videos/6.mp4', 'videos/7.mp4'],
          boyfriendBannerVideos: data.boyfriendBannerVideos || [],
          girlfriendBannerVideos: data.girlfriendBannerVideos || [],
          usBannerVideos: data.usBannerVideos || [],
          backgroundSoundEnabled: data.backgroundSoundEnabled ?? false,
          colorTheme: data.colorTheme || 'romantic'
        });
      }
    }, (error) => {
      console.error('Error fetching studio customizations:', error);
    });
    return () => unsub();
  }, []);

  const handleUpdateStudioSettings = async (settings: {
    trailerVideoUrl: string;
    boyfriendProfileImage: string;
    girlfriendProfileImage: string;
    usProfileImage: string;
    bannerVideos: string[];
    boyfriendBannerVideos: string[];
    girlfriendBannerVideos: string[];
    usBannerVideos: string[];
    backgroundSoundEnabled: boolean;
    colorTheme: string;
  }) => {
    try {
      await setDoc(doc(db, 'studio_settings', 'config'), {
        id: 'config',
        ...settings
      });
    } catch (error) {
      console.error('Error updating studio settings:', error);
      throw error;
    }
  };

  // View & Like Tracking State
  const [userStats, setUserStats] = useState<{ [key: string]: { views: number, likes: number } }>(() => {
    const saved = localStorage.getItem('millifix_stats');
    return saved ? JSON.parse(saved) : {};
  });

  const [continueWatching, setContinueWatching] = useState<{ episodeId: string, index: number, timestamp: number }[]>(() => {
    const saved = localStorage.getItem('millifix_continue');
    return saved ? JSON.parse(saved) : [];
  });

  // Subscribe to real-time custom episodes in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_episodes'), (snapshot) => {
      const list: Episode[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Episode);
      });
      setCustomEpisodes(list);
    }, (error) => {
      console.error('Error fetching custom episodes:', error);
    });
    return () => unsub();
  }, []);

  const allEpisodes = useMemo(() => {
    if (selectedProfile === 'Girlfriend') {
      const merged = [...EPISODES];
      customEpisodes.forEach(customEp => {
        if (!customEp.profile || customEp.profile === 'Girlfriend') {
          const idx = merged.findIndex(e => e.id === customEp.id);
          if (idx !== -1) {
            merged[idx] = customEp;
          } else {
            merged.push(customEp);
          }
        }
      });
      return merged;
    } else if (selectedProfile === 'Boyfriend') {
      // Boyfriend: starts fresh (empty). Only matching Boyfriend profile
      return customEpisodes.filter(e => e.profile === 'Boyfriend');
    } else {
      // Us Together: starts fresh (blank slate) for media the user uploads
      return customEpisodes.filter(e => e.profile === 'Us');
    }
  }, [customEpisodes, selectedProfile]);

  const combinedCategories = useMemo(() => {
    const activeCustom = selectedProfile === 'Girlfriend'
      ? customEpisodes.filter(ep => !ep.profile || ep.profile === 'Girlfriend')
      : selectedProfile === 'Boyfriend'
        ? customEpisodes.filter(ep => ep.profile === 'Boyfriend')
        : customEpisodes.filter(ep => ep.profile === 'Us');

    const customCats: string[] = activeCustom.map(ep => ep.category);
    const uniqueCustomCats: string[] = Array.from(new Set<string>(customCats.filter(c => !(CATEGORIES as string[]).includes(c))));
    
    if (selectedProfile === 'Boyfriend' || selectedProfile === 'Us') {
      // For Boyfriend and Us, just give custom categories + future watchlist
      return [...uniqueCustomCats, 'Our Watchlist (Future Seasons)'];
    }

    const result: string[] = [...CATEGORIES];
    const futureIndex = result.indexOf('Our Watchlist (Future Seasons)');
    if (futureIndex !== -1) {
      result.splice(futureIndex, 0, ...uniqueCustomCats);
    } else {
      result.push(...uniqueCustomCats);
    }
    return result;
  }, [customEpisodes, selectedProfile]);

  // Dynamic Search Filtering
  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allEpisodes.filter(ep => 
      ep.title.toLowerCase().includes(query) ||
      ep.description.toLowerCase().includes(query) ||
      ep.category.toLowerCase().includes(query) ||
      ep.images.some(img => 
        img.title.toLowerCase().includes(query) ||
        (img.description && img.description.toLowerCase().includes(query))
      )
    );
  }, [searchQuery, allEpisodes]);

  useEffect(() => {
    localStorage.setItem('millifix_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('millifix_continue', JSON.stringify(continueWatching));
  }, [continueWatching]);

  const updateContinueWatching = useCallback((episodeId: string, index: number) => {
    setContinueWatching(prev => {
      const filtered = prev.filter(item => item.episodeId !== episodeId);
      // Only add if not at the end of the collection
      const episode = allEpisodes.find(e => e.id === episodeId);
      if (episode && index < episode.images.length - 1) {
        return [{ episodeId, index, timestamp: Date.now() }, ...filtered].slice(0, 10);
      }
      return filtered;
    });
  }, [allEpisodes]);

  const clearContinueWatching = useCallback((episodeId: string) => {
    setContinueWatching(prev => prev.filter(item => item.episodeId !== episodeId));
  }, []);

  const handleLike = useCallback((id: string) => {
    setUserStats(prev => ({
      ...prev,
      [id]: {
        views: prev[id]?.views || 0,
        likes: (prev[id]?.likes || 0) === 1 ? 0 : 1 // Toggle like (0 or 1)
      }
    }));
  }, []);

  const handleView = useCallback((id: string) => {
    setUserStats(prev => ({
      ...prev,
      [id]: {
        views: (prev[id]?.views || 0) + 1,
        likes: prev[id]?.likes || 0
      }
    }));
  }, []);

  const handlePlayAll = useCallback(() => {
    const allMemories = allEpisodes.reduce((acc, ep) => [...acc, ...ep.images], [] as Memory[]);
    if (allMemories.length > 0) {
      setCurrentCollection(allMemories);
      setSelectedMemoryIndex(0);
      setIsSlideshowPaused(false);
      handleView(allMemories[0].id);
    }
  }, [allEpisodes, handleView]);

  const selectedMemory = selectedMemoryIndex !== null ? currentCollection[selectedMemoryIndex] : null;

  const dailyTop10 = useMemo(() => {
    return [...RAW_MEMORIES]
      .map(item => {
        const stats = userStats[item.id] || { views: 0, likes: 0 };
        // Popularity formula: Views + (Likes * 20)
        // Add a small stable random factor so new items appear too
        const stableRandom = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
        const score = stats.views + (stats.likes * 20) + stableRandom;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ item }) => item);
  }, [userStats]);

  const handleToggleSound = useCallback(async () => {
    const newSoundEnabled = !studioSettings.backgroundSoundEnabled;
    try {
      await handleUpdateStudioSettings({
        ...studioSettings,
        backgroundSoundEnabled: newSoundEnabled
      });
      // Fire custom events so the media container reacts instantly on same machine
      window.dispatchEvent(new CustomEvent('millifix-play-backdrop-audio', { 
        detail: { play: newSoundEnabled, soundEnabled: newSoundEnabled } 
      }));
    } catch (err) {
      console.error("Failed to toggle backdrop sound:", err);
    }
  }, [studioSettings, handleUpdateStudioSettings]);

  const handleProfileSelect = useCallback((profile: 'Girlfriend' | 'Boyfriend') => {
    setSelectedProfile(profile);
    localStorage.setItem('millifix_profile', profile);
    setStage('trailer');
    setIsMusicPaused(true); // Pause music while trailer intro is waiting for play
  }, []);

  const handleTrailerComplete = useCallback(() => {
    setStage('home');
    setIsMusicPaused(false); // Resume music for home
  }, []);

  const handleSelectMemory = useCallback((item: Memory, collection: Memory[], episodeId?: string) => {
    const index = collection.findIndex(m => m.id === item.id);
    setCurrentCollection(collection);
    setSelectedMemoryIndex(index);
    setActiveEpisodeId(episodeId || null);
    setIsSlideshowPaused(false); // Reset pause state when starting new
    handleView(item.id); // Track view
  }, [handleView]);

  const handleSelectEpisode = useCallback((episode: Episode) => {
    if (episode.images.length === 0) {
      setShowTbaEpisode(episode);
      return;
    }
    
    // Check if we have progress for this episode
    const progress = continueWatching.find(p => p.episodeId === episode.id);
    const startIndex = progress ? progress.index : 0;
    
    handleSelectMemory(episode.images[startIndex], episode.images, episode.id);
  }, [continueWatching, handleSelectMemory]);

  const handleNextMemory = useCallback(() => {
    if (selectedMemoryIndex !== null && selectedMemoryIndex < currentCollection.length - 1) {
      const nextIndex = selectedMemoryIndex + 1;
      setSelectedMemoryIndex(nextIndex);
      if (activeEpisodeId) {
        updateContinueWatching(activeEpisodeId, nextIndex);
      }
    } else if (selectedMemoryIndex === currentCollection.length - 1) {
      if (activeEpisodeId) {
        clearContinueWatching(activeEpisodeId);
      }
    }
  }, [selectedMemoryIndex, currentCollection.length, activeEpisodeId, updateContinueWatching, clearContinueWatching]);

  const handlePrevMemory = useCallback(() => {
    if (selectedMemoryIndex !== null && selectedMemoryIndex > 0) {
      const nextIndex = selectedMemoryIndex - 1;
      setSelectedMemoryIndex(nextIndex);
      if (activeEpisodeId) {
        updateContinueWatching(activeEpisodeId, nextIndex);
      }
    }
  }, [selectedMemoryIndex, activeEpisodeId, updateContinueWatching]);

  // Autoplay Effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // Only auto-advance if not paused and current item is NOT a video
    // Videos will trigger onNext via their own onEnded event in ImageModal
    if (selectedMemoryIndex !== null && !isSlideshowPaused && !selectedMemory?.videoUrl) {
      timer = setTimeout(() => {
        if (selectedMemoryIndex < currentCollection.length - 1) {
          handleNextMemory();
        } else {
          setSelectedMemoryIndex(0);
        }
      }, 5000); // 5 seconds for images
    }
    return () => clearTimeout(timer);
  }, [selectedMemoryIndex, currentCollection.length, handleNextMemory, isSlideshowPaused, selectedMemory?.videoUrl]);

  // Scroll Lock Effect
  useEffect(() => {
    if (selectedMemoryIndex !== null || isQuizOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedMemoryIndex, isQuizOpen]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-mode');
    if (theme === 'light') root.classList.add('light-mode');
    
    // Dynamically apply selected colorTheme properties
    const activeTheme = COLOR_THEMES.find(t => t.id === studioSettings.colorTheme) || COLOR_THEMES[0];
    root.style.setProperty('--accent-main', activeTheme.hex);
    root.style.setProperty('--accent-rgb', activeTheme.rgb);
  }, [theme, studioSettings.colorTheme]);

  useEffect(() => {
    // Hidden keyboard trigger: Press 'H' for secret message
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        alert("🤍 Message from the Developer: You are absolutely incredible, Milli. 🤍");
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getActiveBackdropUrls = () => {
    const urls = selectedProfile === 'Boyfriend'
      ? studioSettings.boyfriendBannerVideos
      : studioSettings.girlfriendBannerVideos;
    if (urls && urls.length > 0) return urls;
    if (studioSettings.bannerVideos && studioSettings.bannerVideos.length > 0) return studioSettings.bannerVideos;
    return [];
  };
  const activeBackdrops = getActiveBackdropUrls();
  const hasBg = activeBackdrops.length > 0;

  return (
    <div 
      id="app-root-container"
      data-has-bg={stage === 'home' && hasBg ? "true" : "false"}
      className="min-h-screen font-sans selection:bg-accent selection:text-white bg-bg-deep overflow-x-hidden"
    >
      <div className="atmosphere" />
      {stage === 'home' && (
        <AppBackground 
          backdropUrls={activeBackdrops} 
          soundEnabled={studioSettings.backgroundSoundEnabled}
        />
      )}
      <AnimatePresence mode="wait">
        {stage === 'profile-selection' && (
          <motion.div
            key="profile-selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
          >
            <ProfileSelector 
              onSelect={handleProfileSelect} 
              boyfriendImage={studioSettings.boyfriendProfileImage}
              girlfriendImage={studioSettings.girlfriendProfileImage}
              usImage={studioSettings.usProfileImage}
            />
          </motion.div>
        )}

        {stage === 'trailer' && (
          <motion.div
            key="trailer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <TrailerPlayer onComplete={handleTrailerComplete} videoUrl={studioSettings.trailerVideoUrl} />
          </motion.div>
        )}

        {stage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <Navbar 
              theme={theme} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              onOpenAdmin={() => setIsAdminOpen(true)} 
              selectedProfile={selectedProfile}
              onProfileSwitch={(profile) => {
                setSelectedProfile(profile);
                localStorage.setItem('millifix_profile', profile);
              }}
              girlfriendImage={studioSettings.girlfriendProfileImage}
              boyfriendImage={studioSettings.boyfriendProfileImage}
              usImage={studioSettings.usProfileImage}
              soundEnabled={studioSettings.backgroundSoundEnabled}
              onToggleSound={handleToggleSound}
            />
            
            <main>
              <HeroBanner 
                onPlayAll={handlePlayAll} 
                profile={selectedProfile} 
                soundEnabled={studioSettings.backgroundSoundEnabled}
                bannerVideos={
                  selectedProfile === 'Boyfriend'
                    ? (studioSettings.boyfriendBannerVideos && studioSettings.boyfriendBannerVideos.length > 0
                        ? studioSettings.boyfriendBannerVideos
                        : studioSettings.bannerVideos)
                    : selectedProfile === 'Us'
                      ? (studioSettings.usBannerVideos && studioSettings.usBannerVideos.length > 0
                          ? studioSettings.usBannerVideos
                          : studioSettings.bannerVideos)
                      : (studioSettings.girlfriendBannerVideos && studioSettings.girlfriendBannerVideos.length > 0
                          ? studioSettings.girlfriendBannerVideos
                          : studioSettings.bannerVideos)
                }
              />
              
              <div className="relative mt-12 md:mt-16 z-20 pb-20">
                {/* Custom Profile empty state hint for Boyfriend */}
                {selectedProfile === 'Boyfriend' && allEpisodes.length === 0 && (
                  <div className="max-w-2xl mx-auto px-6 py-12 mb-12 rounded-2xl bg-zinc-950/70 border border-violet-500/15 text-center space-y-5 shadow-2xl animate-fadeIn">
                    <div className="w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 border border-violet-500/20 shadow-inner text-2xl">
                      🎬
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Welcome To Sbu's Cinematic Space</h3>
                      <p className="text-xs text-text-dim max-w-md mx-auto leading-relaxed">
                        This workspace starts completely fresh so you can upload your custom photo reels, video clips and captioned slideshows without affecting the Girlfriend timeline settings. Get started by clicking the button below!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAdminOpen(true)}
                      className="px-6 py-3 rounded-lg bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/25 cursor-pointer"
                    >
                      Open Media Production Studio
                    </motion.button>
                  </div>
                )}

                {/* Custom Profile empty state hint for Us */}
                {selectedProfile === 'Us' && allEpisodes.length === 0 && (
                  <div className="max-w-2xl mx-auto px-6 py-12 mb-12 rounded-2xl bg-zinc-950/70 border border-pink-500/15 text-center space-y-5 shadow-2xl animate-fadeIn">
                    <div className="w-14 h-14 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto text-pink-400 border border-pink-500/20 shadow-inner text-2xl animate-pulse">
                      🤍
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Welcome To Our Shared Album Space</h3>
                      <p className="text-xs text-text-dim max-w-md mx-auto leading-relaxed">
                        This space is for Us together! It starts completely blank so you can upload your favorite photos and videos of Milli and Sbu side-by-side. Get started by clicking the button below!
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAdminOpen(true)}
                      className="px-6 py-3 rounded-lg bg-pink-600 text-white text-xs font-black uppercase tracking-widest hover:bg-pink-500 transition-all shadow-lg shadow-pink-500/25 cursor-pointer"
                    >
                      Open Media Production Studio
                    </motion.button>
                  </div>
                )}
                {/* Dynamic Search Results Section */}
                {searchQuery.trim() !== '' && (
                  <div className="border border-accent/20 bg-accent/5 backdrop-blur-md rounded-lg mx-6 md:mx-12 p-2 mb-8 animate-fadeIn">
                    <ContentRow 
                      id="search-results-row"
                      title={`Search Results for "${searchQuery}"`}
                      episodes={filteredEpisodes}
                      onSelectEpisode={handleSelectEpisode} 
                    />
                  </div>
                )}

                {combinedCategories.map((category) => {
                  const categoryId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  if (category === 'Global Top 10 in MilliSbu') {
                    return (
                      <Top10Row 
                        key={category} 
                        id={categoryId} 
                        items={dailyTop10} 
                        userStats={userStats}
                        onLike={handleLike}
                        onSelect={(item) => handleSelectMemory(item, RAW_MEMORIES)} 
                      />
                    );
                  }
                  
                  const episodes = allEpisodes.filter(ep => ep.category === category);
                  if (episodes.length === 0) return null;
                  return (
                    <ContentRow 
                      key={category} 
                      id={categoryId}
                      title={category} 
                      episodes={episodes} 
                      onSelectEpisode={handleSelectEpisode} 
                    />
                  );
                })}

                {/* Dynamic Continue Watching Section */}
                {continueWatching.length > 0 && (
                  <div className="py-6 space-y-3" id="continue-watching">
                    <h3 className="text-lg md:text-xl font-bold px-6 md:px-12 text-text-main">
                      Continue Watching
                    </h3>
                    <div className="px-6 md:px-12 flex gap-4 overflow-x-auto no-scrollbar pb-4">
                      {continueWatching.map((item) => {
                        const episode = allEpisodes.find(e => e.id === item.episodeId);
                        if (!episode) return null;
                        const progressPercent = Math.round(((item.index + 1) / episode.images.length) * 100);
                        
                        return (
                          <motion.div 
                            key={item.episodeId}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleSelectEpisode(episode)}
                            className="group relative flex-shrink-0 w-64 md:w-80 h-36 md:h-44 rounded shadow-lg overflow-hidden bg-card-bg cursor-pointer border border-white/5"
                          >
                            <img 
                              src={episode.images[item.index]?.imageUrl || episode.previewImageUrl} 
                              alt={episode.title} 
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                              <h4 className="text-white font-bold text-xs mb-0.5">{episode.title} – Slide {item.index + 1}</h4>
                              <p className="text-text-dim text-[10px] mb-2 font-medium">{episode.images.length - item.index - 1} frames remaining</p>
                              <div className="w-full h-[3px] bg-zinc-700/50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  className="h-full bg-accent shadow-[0_0_8px_var(--color-accent)]" 
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <LoveJar currentUserProfile={selectedProfile} />

              <WhatToDoTogether currentUserProfile={selectedProfile} />

              <LoveNotesBoard />

              <LiveLocationTracker 
                boyfriendImage={studioSettings.boyfriendProfileImage}
                girlfriendImage={studioSettings.girlfriendProfileImage}
                currentUserProfile={selectedProfile}
              />

              <SoundtrackVinylPlayer />

              <CreditsSection />

              <footer className="py-20 text-center space-y-6 border-t border-border-subtle bg-card-bg/20 transition-colors">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight italic text-text-main">"Season 1: Still in love with you 🤍"</h2>
                  <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Directed by Your Favorite Person</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStage('countdown')}
                    className="bg-card-bg/50 text-text-main px-8 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-card-bg transition-colors border border-border-subtle"
                    id="important-dates-btn"
                  >
                    Important Dates
                  </motion.button>
                  <p className="text-text-dim text-[10px] font-bold tracking-tighter">© 2026 MILLISBU ORIGINALS. ALL RIGHTS RESERVED.</p>
                </div>
              </footer>
            </main>

            <ImageModal 
              item={selectedMemory} 
              onClose={() => {
                setSelectedMemoryIndex(null);
                setActiveEpisodeId(null);
              }}
              onNext={handleNextMemory}
              onPrev={handlePrevMemory}
              isPaused={isSlideshowPaused}
              onTogglePause={() => setIsSlideshowPaused(!isSlideshowPaused)}
              hasNext={selectedMemoryIndex !== null && selectedMemoryIndex < currentCollection.length - 1}
              hasPrev={selectedMemoryIndex !== null && selectedMemoryIndex > 0}
            />

            {/* TBA / Coming Soon Modal */}
            <AnimatePresence>
              {showTbaEpisode && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={() => setShowTbaEpisode(null)}
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-bg-deep border border-white/10 p-12 rounded-lg shadow-2xl max-w-xl w-full text-center space-y-8"
                  >
                    <div className="space-y-2">
                       <span className="text-accent font-black uppercase tracking-[0.4em] text-[10px]">MilliSbu Originals</span>
                       <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{showTbaEpisode.title}</h2>
                       <p className="text-text-dim text-xs font-bold uppercase tracking-widest italic">{showTbaEpisode.description}</p>
                    </div>

                    <div className="py-12 border-y border-white/5 space-y-4">
                       <div className="text-6xl md:text-8xl font-black text-white/5 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 tracking-tighter">TBA</div>
                       <p className="text-white text-xl md:text-2xl font-light tracking-tight italic">
                         "The best stories are worth waiting for..."
                       </p>
                       <div className="flex items-center justify-center gap-3">
                         <div className="h-0.5 w-12 bg-accent/50" />
                         <span className="text-accent font-bold uppercase tracking-widest text-[9px] animate-pulse">Coming Soon</span>
                         <div className="h-0.5 w-12 bg-accent/50" />
                       </div>
                    </div>

                    <p className="text-text-dim text-sm leading-relaxed max-w-sm mx-auto">
                      Production for this episode is currently in progress. Stay tuned for the release in the next season!
                    </p>

                    <button 
                      onClick={() => setShowTbaEpisode(null)}
                      className="bg-white text-black px-10 py-3 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-colors"
                    >
                      Return to Gallery
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isQuizOpen && (
                <InteractiveQuiz onClose={() => setIsQuizOpen(false)} />
              )}
            </AnimatePresence>

            <BackgroundMusic isVisible={stage === 'home'} />
            <Notification />
            <CountdownBox onTriggerCelebration={(title, body, name) => setCelebrationEvent({ title, body, name })} />
            <LoveLetter isVisible={stage === 'home'} profile={selectedProfile} />

            {/* Admin Media Dashboard Settings Overlay */}
            <AnimatePresence>
              {isAdminOpen && (
                <AdminMediaSettings 
                  isOpen={isAdminOpen} 
                  onClose={() => setIsAdminOpen(false)} 
                  allEpisodes={allEpisodes}
                  selectedProfile={selectedProfile}
                  onSuccess={(msg) => {
                    setAdminSuccessMessage(msg);
                    setTimeout(() => setAdminSuccessMessage(null), 5000);
                  }}
                  studioSettings={studioSettings}
                  onUpdateStudioSettings={handleUpdateStudioSettings}
                />
              )}
            </AnimatePresence>

            {/* Dashboard Operation Toast */}
            <AnimatePresence>
              {adminSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-6 right-6 z-[500] bg-zinc-950 border border-emerald-500/30 text-white p-4 rounded-lg shadow-2xl flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Database Sync Active</p>
                    <p className="text-[11px] text-zinc-300 font-bold mt-0.5">{adminSuccessMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {stage === 'countdown' && (
          <motion.div
            key="countdown-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <CountdownPage 
              onBack={() => setStage('home')} 
              onTriggerCelebration={(title, body, name) => setCelebrationEvent({ title, body, name })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <CelebrationPortal
        isOpen={!!celebrationEvent}
        onClose={() => setCelebrationEvent(null)}
        title={celebrationEvent?.title || ''}
        body={celebrationEvent?.body || ''}
        eventName={celebrationEvent?.name || ''}
      />

      {/* Persistence / Global Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        #my-favorite-moments {
          padding-top: 2rem;
          padding-bottom: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: linear-gradient(to right, rgba(0,0,0,0.2), transparent);
        }
        #her-smile-collection--- {
          padding-top: 3rem;
          padding-bottom: 3rem;
          background: linear-gradient(180deg, transparent, rgba(255, 0, 100, 0.03), transparent);
        }
        #can-t-stop-looking-at-you {
          padding-top: 2rem;
          padding-bottom: 4rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        #global-top-10-in-millisbu {
          padding-top: 4rem;
          padding-bottom: 4rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
          background: linear-gradient(90deg, rgba(255, 45, 85, 0.08) 0%, transparent 50%, rgba(255, 45, 85, 0.08) 100%);
          position: relative;
        }
        #global-top-10-in-millisbu::before {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        #future-watchlist {
          padding-top: 2rem;
          padding-bottom: 4rem;
          background: linear-gradient(to right, transparent, rgba(var(--color-accent-rgb), 0.03), transparent);
        }
        #continue-watching {
          padding-top: 2rem;
          padding-bottom: 4rem;
          background: linear-gradient(to right, rgba(255,255,255,0.02), transparent);
        }
      `}</style>
    </div>
  );
}
