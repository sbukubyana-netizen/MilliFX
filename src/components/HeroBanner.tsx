import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';

const HERO_VIDEOS = ['videos/6.mp4', 'videos/7.mp4'];

interface HeroBannerProps {
  onPlayAll: () => void;
}

export default function HeroBanner({ onPlayAll }: HeroBannerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, 10000); // Switch every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const scrollToContent = () => {
    const content = document.querySelector('main > div');
    if (content) content.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative aspect-video md:max-h-[650px] md:h-auto mx-4 md:mx-12 mt-20 md:mt-24 rounded-lg shadow-2xl overflow-hidden z-10">
      {/* Cinematic Background Video Slideshow */}
      <div className="absolute inset-0 bg-[#050505]">
        <AnimatePresence mode="wait">
          <motion.video
            key={HERO_VIDEOS[currentVideoIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            src={HERO_VIDEOS[currentVideoIndex]}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        </AnimatePresence>
        {/* Force a dark gradient even in light mode for the cinematic hero look */}
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20 opacity-100" />
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 h-full flex flex-col justify-center max-w-2xl px-8 md:px-12 space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-accent font-bold tracking-[0.2em] uppercase text-xs md:text-sm">
            Starring: Millicent
          </h2>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-none text-white transition-colors">
            The Story of Us
          </h1>
          <p className="text-base md:text-lg text-white/70 font-medium leading-relaxed max-w-lg mb-6">
            A cinematic collection of memories, smiles, and the small moments that mean everything.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onPlayAll(); }}
            className="flex items-center gap-2 bg-white text-black px-4 md:px-6 py-2.5 rounded-sm font-bold text-sm md:text-base hover:bg-zinc-200 transition-colors shadow-2xl"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            Play Memories
          </motion.button>

        </div>
      </motion.div>
    </div>
  );
}
