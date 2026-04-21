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
import { PlayCircle } from 'lucide-react';

export default function App() {
  const [stage, setStage] = useState<AppStage>('profile-selection');
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number | null>(null);
  const [currentCollection, setCurrentCollection] = useState<Memory[]>([]);
  const [isMusicPaused, setIsMusicPaused] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mood, setMood] = useState('romantic');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);

  // View & Like Tracking State
  const [userStats, setUserStats] = useState<{ [key: string]: { views: number, likes: number } }>(() => {
    const saved = localStorage.getItem('millifix_stats');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('millifix_stats', JSON.stringify(userStats));
  }, [userStats]);

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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleProfileSelect = useCallback(() => {
    setStage('trailer');
    setIsMusicPaused(true); // Pause music while trailer intro is waiting for play
  }, []);

  const handleTrailerComplete = useCallback(() => {
    setStage('home');
    setIsMusicPaused(false); // Resume music for home
  }, []);

  const handleSelectMemory = useCallback((item: Memory, collection: Memory[]) => {
    const index = collection.findIndex(m => m.id === item.id);
    setCurrentCollection(collection);
    setSelectedMemoryIndex(index);
    setIsSlideshowPaused(false); // Reset pause state when starting new
    handleView(item.id); // Track view
  }, [handleView]);

  const handleNextMemory = useCallback(() => {
    if (selectedMemoryIndex !== null && selectedMemoryIndex < currentCollection.length - 1) {
      setSelectedMemoryIndex(prev => prev !== null ? prev + 1 : null);
    }
  }, [selectedMemoryIndex, currentCollection.length]);

  const handlePrevMemory = useCallback(() => {
    if (selectedMemoryIndex !== null && selectedMemoryIndex > 0) {
      setSelectedMemoryIndex(prev => prev !== null ? prev - 1 : null);
    }
  }, [selectedMemoryIndex]);

  // Autoplay Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (selectedMemoryIndex !== null && !isSlideshowPaused) {
      interval = setInterval(() => {
        if (selectedMemoryIndex < currentCollection.length - 1) {
          handleNextMemory();
        } else {
          // Loop back to start or stay? Usually loop for autoplay
          setSelectedMemoryIndex(0);
        }
      }, 5000); // 5 seconds per slide
    }
    return () => clearInterval(interval);
  }, [selectedMemoryIndex, currentCollection.length, handleNextMemory, isSlideshowPaused]);

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
    root.classList.remove('light-mode', 'mood-romantic', 'mood-playful', 'mood-nostalgic', 'mood-cinematic');
    if (theme === 'light') root.classList.add('light-mode');
    root.classList.add(`mood-${mood}`);
  }, [theme, mood]);

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

  return (
    <div className="min-h-screen font-sans selection:bg-accent selection:text-white bg-bg-deep">
      <div className="atmosphere" />
      <AnimatePresence mode="wait">
        {stage === 'profile-selection' && (
          <motion.div
            key="profile-selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
          >
            <ProfileSelector onSelect={handleProfileSelect} />
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
            <TrailerPlayer onComplete={handleTrailerComplete} />
          </motion.div>
        )}

        {stage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <Navbar theme={theme} toggleTheme={toggleTheme} mood={mood} setMood={setMood} />
            
            <main>
              <HeroBanner />
              
              <div className="relative -mt-32 md:-mt-48 z-20 pb-20">
                {CATEGORIES.map((category) => {
                  const categoryId = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  if (category === 'Global Top 10 in MilliFix') {
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
                  
                  const episodes = EPISODES.filter(ep => ep.category === category);
                  if (episodes.length === 0) return null;
                  return (
                    <ContentRow 
                      key={category} 
                      id={categoryId}
                      title={category} 
                      episodes={episodes} 
                      onSelectEpisode={(ep) => handleSelectMemory(ep.images[0], ep.images)} 
                    />
                  );
                })}

                {/* Continue Watching Section */}
                <div className="py-6 space-y-3">
                  <h3 className="text-lg md:text-xl font-bold px-6 md:px-12">
                    Continue Watching
                  </h3>
                  <div className="px-6 md:px-12 flex gap-4 overflow-x-auto no-scrollbar">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="group relative flex-shrink-0 w-64 md:w-80 h-36 md:h-44 rounded shadow-lg overflow-hidden bg-card-bg cursor-pointer"
                    >
                      <img 
                        src="https://picsum.photos/seed/milli-continue/800/400" 
                        alt="Your Smile" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h4 className="text-white font-bold text-xs mb-0.5">Your Smile – Episode 3 (98% match)</h4>
                        <p className="text-text-dim text-[10px] mb-2 font-medium">15m remaining</p>
                        <div className="w-full h-[3px] bg-zinc-700/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '65%' }}
                            transition={{ duration: 2, delay: 1 }}
                            className="h-full bg-accent shadow-[0_0_8px_var(--color-accent)]" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

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
                  >
                    Season 2 coming soon...
                  </motion.button>
                  <p className="text-text-dim text-[10px] font-bold tracking-tighter">© 2026 MILLIFIX ORIGINALS. ALL RIGHTS RESERVED.</p>
                </div>
              </footer>
            </main>

            <ImageModal 
              item={selectedMemory} 
              onClose={() => setSelectedMemoryIndex(null)}
              onNext={handleNextMemory}
              onPrev={handlePrevMemory}
              isPaused={isSlideshowPaused}
              onTogglePause={() => setIsSlideshowPaused(!isSlideshowPaused)}
              hasNext={selectedMemoryIndex !== null && selectedMemoryIndex < currentCollection.length - 1}
              hasPrev={selectedMemoryIndex !== null && selectedMemoryIndex > 0}
            />

            <AnimatePresence>
              {isQuizOpen && (
                <InteractiveQuiz onClose={() => setIsQuizOpen(false)} />
              )}
            </AnimatePresence>

            <BackgroundMusic isVisible={stage === 'home'} isPaused={isMusicPaused || isQuizOpen} mood={mood} />
            <Notification />
            <CountdownBox />
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
            <CountdownPage onBack={() => setStage('home')} />
          </motion.div>
        )}
      </AnimatePresence>

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
        #global-top-10-in-millifix {
          padding-top: 4rem;
          padding-bottom: 4rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
          background: linear-gradient(90deg, rgba(var(--color-accent-rgb), 0.08) 0%, transparent 50%, rgba(var(--color-accent-rgb), 0.08) 100%);
          position: relative;
        }
        #global-top-10-in-millifix::before {
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
      `}</style>
    </div>
  );
}
