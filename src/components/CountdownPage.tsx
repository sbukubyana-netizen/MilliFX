import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IMPORTANT_DATES, getNextOccurrence } from '../constants';
import { ChevronLeft, Calendar, Heart, Sparkles, Gift, Flame } from 'lucide-react';

interface CountdownPageProps {
  onBack: () => void;
  onTriggerCelebration?: (title: string, body: string, name: string) => void;
}

export default function CountdownPage({ onBack, onTriggerCelebration }: CountdownPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  const activeDate = IMPORTANT_DATES[activeIndex];

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const target = getNextOccurrence(activeDate.month, activeDate.day);
      const diff = target.getTime() - now.getTime();

      // Check if it is the birthday/anniversary today!
      const isToday = now.getMonth() === activeDate.month && now.getDate() === activeDate.day;
      
      if (isToday) {
        // Automatically fire celebratory triggers on arrival
        const key = `l_celebrated_page_${activeDate.id}_${now.getFullYear()}`;
        if (localStorage.getItem(key) !== 'true') {
          localStorage.setItem(key, 'true');
          if (onTriggerCelebration) {
            onTriggerCelebration(activeDate.celebrationTitle, activeDate.celebrationBody, activeDate.name);
          }
        }
      }

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [activeIndex, activeDate, onTriggerCelebration]);

  const handleManualCelebrate = () => {
    if (onTriggerCelebration) {
      onTriggerCelebration(activeDate.celebrationTitle, activeDate.celebrationBody, activeDate.name);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-bg-deep flex flex-col items-center justify-start overflow-y-auto pb-16 no-scrollbar pt-24 sm:pt-28">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeDate.id}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 1 }}
            src={`https://picsum.photos/seed/${activeDate.bgSeed}/1920/1080?blur=5`} 
            alt="Cinematic Background" 
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-b from-bg-deep via-bg-deep/50 to-bg-deep" />
        <div className="absolute inset-0 atmosphere opacity-40" />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="absolute top-6 left-6 md:top-10 md:left-10 z-50 flex items-center gap-2 text-text-dim hover:text-text-main transition-colors font-bold uppercase tracking-[0.3em] text-xs"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Home
      </motion.button>

      {/* Modern Horizontal Tabs list */}
      <div className="relative z-50 flex flex-wrap justify-center gap-2 max-w-xl mx-auto px-4 mb-8 sm:mb-12">
        {IMPORTANT_DATES.map((d, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={d.id}
              onClick={() => setActiveIndex(index)}
              className={`px-5 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-2 ${
                isActive 
                  ? 'bg-accent/15 border-accent text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] scale-105' 
                  : 'bg-[#ffffff05] border-white/5 text-text-dim hover:text-white hover:border-white/20'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{d.name.split(' ')[0]} {d.name.split(' ').slice(1).join(' ')}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeDate.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-12 px-6 max-w-4xl w-full"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="p-4 bg-accent/25 rounded-full border border-accent/40 shadow-[0_0_30px_rgba(var(--accent-rgb),0.35)]">
              <Gift className="w-10 h-10 text-accent" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-accent font-black uppercase tracking-[0.5em] text-[10px] sm:text-xs md:text-sm">
              {activeDate.badge} • SPECIAL EDITIONCOUNTDOWN
            </h2>
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-text-main tracking-tighter italic">
              {activeDate.name}
            </h1>
          </div>
          <p className="text-text-dim text-lg md:text-xl font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
            The most anticipated celebration in MilliSbu. Will officially arrive in its beautiful form on <span className="text-white font-bold underline decoration-accent decoration-2 underline-offset-4">{activeDate.dateStr}</span>.
          </p>
        </div>

        {/* Dynamic Countdown clocks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
          <TimeBox value={timeLeft.days} label="Days" />
          <TimeBox value={timeLeft.hours} label="Hours" />
          <TimeBox value={timeLeft.mins} label="Minutes" />
          <TimeBox value={timeLeft.secs} label="Seconds" />
        </div>

        {/* Action triggers and subtext */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-6 pt-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={handleManualCelebrate}
              type="button"
              className="px-8 py-3 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-xs hover:bg-[#e02549] shadow-[0_15px_30px_rgba(var(--accent-rgb),0.4)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Reveal Custom Celebration Party! ✨</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-text-dim font-bold uppercase tracking-[0.2em] text-[10px] pt-4">
             <span className="w-12 h-[1px] bg-border-subtle" />
             An Original Cinematic Date
             <span className="w-12 h-[1px] bg-border-subtle" />
          </div>
          <p className="text-text-dim text-xs italic opacity-60">"Every second of this countdown is a beautiful declaration of our story."</p>
          <Heart className="w-6 h-6 text-accent animate-pulse" />
        </motion.div>
      </motion.div>
    </div>
  );
}

interface TimeBoxProps {
  value: number;
  label: string;
}

function TimeBox({ value, label }: TimeBoxProps) {
  return (
    <motion.div 
      whileHover={{ y: -6, skewX: -1 }}
      className="bg-card-bg/60 backdrop-blur-md border border-white/5 p-6 md:p-8 rounded-2xl shadow-2xl space-y-1.5 transition-all hover:bg-card-bg/85 hover:border-white/10"
    >
      <div className="text-4xl md:text-6xl font-black text-text-main font-mono tabular-nums tracking-tighter">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[9px] md:text-xs font-black text-accent uppercase tracking-[0.3em]">
        {label}
      </div>
    </motion.div>
  );
}
