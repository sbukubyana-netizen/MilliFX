import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TARGET_DATE } from '../constants';
import { ChevronLeft, Calendar, Heart } from 'lucide-react';

interface CountdownPageProps {
  onBack: () => void;
}

export default function CountdownPage({ onBack }: CountdownPageProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const diff = TARGET_DATE.getTime() - now.getTime();

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

  return (
    <div className="fixed inset-0 z-[300] bg-bg-deep flex flex-col items-center justify-center overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0">
        <img 
          src="https://picsum.photos/seed/milli-countdown-bg/1920/1080?blur=10" 
          alt="Cinematic Background" 
          className="w-full h-full object-cover opacity-30 grayscale scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-bg-deep via-transparent to-bg-deep" />
        <div className="absolute inset-0 atmosphere opacity-40" />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="absolute top-10 left-10 z-50 flex items-center gap-2 text-text-dim hover:text-text-main transition-colors font-bold uppercase tracking-[0.3em] text-xs"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Home
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-12 px-6"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="p-4 bg-accent/20 rounded-full border border-accent/30 shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]">
              <Calendar className="w-10 h-10 text-accent" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-accent font-black uppercase tracking-[0.5em] text-sm md:text-base">
              The Next Chapter Begins
            </h2>
            <h1 className="text-5xl md:text-8xl font-black text-text-main tracking-tighter italic">
              Season 2: Forever
            </h1>
          </div>
          <p className="text-text-dim text-lg md:text-xl font-medium tracking-wide max-w-2xl mx-auto">
            The most anticipated sequel in cinematic history. Returning to our favorite location on 18 January {TARGET_DATE.getFullYear()}.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-4xl mx-auto">
          <TimeBox value={timeLeft.days} label="Days" />
          <TimeBox value={timeLeft.hours} label="Hours" />
          <TimeBox value={timeLeft.mins} label="Minutes" />
          <TimeBox value={timeLeft.secs} label="Seconds" />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center gap-4 pt-12"
        >
          <div className="flex items-center gap-3 text-text-dim font-bold uppercase tracking-[0.2em] text-[10px]">
             <span className="w-12 h-[1px] bg-border-subtle" />
             A Netflix Original Mystery
             <span className="w-12 h-[1px] bg-border-subtle" />
          </div>
          <p className="text-text-dim text-xs italic opacity-60">"The plot thickens with every beat of my heart."</p>
          <Heart className="w-6 h-6 text-accent animate-pulse" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-card-bg/40 backdrop-blur-md border border-border-subtle p-6 md:p-10 rounded-sm shadow-2xl space-y-2 transition-colors hover:bg-card-bg/60 min-w-[120px] md:min-w-[180px]"
    >
      <div className="text-5xl md:text-7xl font-black text-text-main font-mono tabular-nums tracking-tighter">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] md:text-xs font-bold text-accent uppercase tracking-[0.3em]">
        {label}
      </div>
    </motion.div>
  );
}
