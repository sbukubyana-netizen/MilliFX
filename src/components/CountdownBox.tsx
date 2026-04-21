import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TARGET_DATE } from '../constants';

export default function CountdownBox() {
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
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-8 right-8 z-[100] bg-card-bg/40 backdrop-blur-xl border border-border-subtle p-6 rounded-lg text-right shadow-2xl space-y-2 pointer-events-none md:pointer-events-auto group hover:bg-card-bg/60 transition-colors"
    >
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
          Our Next Anniversary In
        </div>
        <div className="text-xs font-bold text-text-main tracking-wide">
          18 January {TARGET_DATE.getFullYear()}
        </div>
      </div>
      <div className="flex items-end gap-3 text-text-main transition-colors">
        <TimeUnit value={timeLeft.days} label="d" />
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.mins} label="m" />
        <TimeUnit value={timeLeft.secs} label="s" />
      </div>
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-3xl md:text-4xl font-bold text-accent font-mono tracking-tighter tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs font-bold text-text-dim uppercase tracking-widest">{label}</span>
    </div>
  );
}
