import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IMPORTANT_DATES, getNextOccurrence } from '../constants';
import { X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface CountdownBoxProps {
  onTriggerCelebration?: (title: string, body: string, name: string) => void;
}

export default function CountdownBox({ onTriggerCelebration }: CountdownBoxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('millifix_anniversary_dismissed') === 'true';
  });

  const activeDate = IMPORTANT_DATES[activeIndex];

  // Recalculate time left whenever active index changes or seconds tick
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const target = getNextOccurrence(activeDate.month, activeDate.day);
      const diff = target.getTime() - now.getTime();

      // Check if it is the birthday/anniversary today!
      const isToday = now.getMonth() === activeDate.month && now.getDate() === activeDate.day;
      
      if (isToday) {
        // If it is today, check if we've already triggered the notification
        const key = `l_celebrated_${activeDate.id}_${now.getFullYear()}`;
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

  // Handler to manually preview the celebration notification
  const handleTestCelebrate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTriggerCelebration) {
      onTriggerCelebration(activeDate.celebrationTitle, activeDate.celebrationBody, activeDate.name);
    }
  };

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] bg-card-bg/85 backdrop-blur-2xl border border-white/10 p-4 sm:p-5 rounded-2xl text-right shadow-2xl space-y-3.5 pointer-events-auto group hover:bg-card-bg transition-all max-w-[290px] relative overflow-hidden"
    >
      {/* Top background accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent/50 via-accent to-accent/50" />

      {/* Close button with simple hover states */}
      <button
        onClick={() => {
          setIsDismissed(true);
          localStorage.setItem('millifix_anniversary_dismissed', 'true');
        }}
        className="absolute top-3.5 left-3.5 text-text-dim hover:text-accent transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer z-50"
        title="Dismiss Countdowns"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Interactive Tabs Menu to easily switch dates */}
      <div className="flex items-center justify-between gap-1 border-b border-white/5 pb-2">
        <span className="text-[9px] uppercase font-black tracking-widest text-[#a2a2bc] text-left block flex-1">
          📆 Countdown Tracker
        </span>
        <div className="flex gap-0.5">
          {IMPORTANT_DATES.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                activeIndex === idx ? 'bg-accent scale-125' : 'bg-[#ffffff20] hover:bg-white/40'
              }`}
              title={d.name}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1 block text-left">
        <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-black leading-tight flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {activeDate.badge}
        </div>
        <h3 className="text-sm font-black text-white tracking-tight">
          {activeDate.name}
        </h3>
        <p className="text-[10px] text-text-dim font-bold mt-0.5">
          Will land on: {activeDate.dateStr}
        </p>
      </div>

      {/* Main Countdown Clocks */}
      <div className="flex justify-start items-center gap-2.5 text-text-main transition-colors text-left pt-1">
        <TimeUnit value={timeLeft.days} label="d" />
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.mins} label="m" />
        <TimeUnit value={timeLeft.secs} label="s" />
      </div>

      {/* Quick Celebrate interactive launch trigger */}
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider text-left">
          {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.mins === 0 && timeLeft.secs === 0 ? "🌟 Today is the Day!" : "Countdown Active"}
        </span>
        <button
          onClick={handleTestCelebrate}
          type="button"
          className="flex items-center gap-1 bg-accent/20 hover:bg-accent hover:text-white border border-accent/20 text-accent px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
        >
          <Sparkles className="w-3 h-3" />
          <span>Celebrate!</span>
        </button>
      </div>
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-xl sm:text-2xl font-black text-accent font-mono tracking-tighter tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">{label}</span>
    </div>
  );
}
