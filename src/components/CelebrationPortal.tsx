import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Heart, Sparkles, X, Award } from 'lucide-react';

interface CelebrationPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  eventName: string;
}

export default function CelebrationPortal({ isOpen, onClose, title, body, eventName }: CelebrationPortalProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string; scale: number; duration: number }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Generate some fun celebration floaters
    const emojis = ['🎉', '🎂', '💖', '✨', '🎈', '🍫', '💐', '💕', '⭐'];
    const list = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x
      y: 100 + Math.random() * 20, // start below screen
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      scale: 0.5 + Math.random() * 1.5,
      duration: 3 + Math.random() * 5
    }));
    setParticles(list);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Darkened Backdrop with high blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Floating Celebration Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: '110vh', x: `${p.x}vw`, scale: p.scale, opacity: 0 }}
              animate={{ 
                y: '-20vh', 
                opacity: [0, 1, 1, 0],
                x: `${p.x + (Math.random() * 10 - 5)}vw`
              }}
              transition={{ 
                duration: p.duration, 
                ease: "easeOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute text-2xl select-none"
            >
              {p.emoji}
            </motion.div>
          ))}
        </div>

        {/* Celebratory Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
          className="relative bg-[#0d0d12] border-2 border-accent/40 rounded-2xl p-6 sm:p-10 max-w-lg w-full text-center shadow-[0_0_80px_rgba(var(--accent-rgb),0.25)] overflow-hidden z-10"
        >
          {/* Top Decorative Gradient Ring */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/25 rounded-full blur-xl -z-10" />

          {/* Dismiss Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer z-50"
            title="Dismiss Celebration"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/20 text-[10px] md:text-xs font-black uppercase tracking-widest text-accent mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Alert: {eventName}</span>
            </div>

            <div className="flex justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 bg-accent rounded-full border border-white/10 flex items-center justify-center shadow-xl text-white"
              >
                <Gift className="w-8 h-8 fill-current" />
              </motion.div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-sans font-black tracking-tight text-white leading-tight">
                {title}
              </h1>
              <div className="w-16 h-1 bg-accent/80 rounded-full mx-auto" />
            </div>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed tracking-wide font-medium bg-black/40 border border-white/5 p-4 rounded-xl shadow-inner">
              {body}
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={onClose}
                type="button"
                className="w-full bg-white text-black py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-zinc-200 cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current text-accent" />
                <span>Celebrate with Love 🤍</span>
              </button>

              <p className="text-[10px] font-mono tracking-widest text-[#a2a2bc] uppercase">
                Forever In Our Movie Diary 🎬
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
