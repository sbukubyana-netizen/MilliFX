import { motion } from 'motion/react';
import { CAST_AND_CREDITS } from '../constants';

export default function CreditsSection() {
  return (
    <div className="py-32 px-6 md:px-12 text-center bg-bg-deep/50 border-t border-border-subtle overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-16"
      >
        <div className="space-y-4">
          <h4 className="text-accent font-black uppercase tracking-[0.4em] text-sm md:text-base">
            MilliFix Essentials
          </h4>
          <p className="text-text-dim text-xs md:text-sm font-medium tracking-widest uppercase">
            Special Edition Original Series
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 max-w-5xl mx-auto">
          {CAST_AND_CREDITS.map((credit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="space-y-1"
            >
              <p className="text-text-dim text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{credit.role}</p>
              <h5 className="text-text-main text-lg md:text-xl font-bold italic tracking-tight">{credit.name}</h5>
            </motion.div>
          ))}
        </div>

        <div className="pt-20 space-y-6">
          <p className="text-text-dim italic text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            "Every frame of this website was built with you in mind. Thank you for being the leading lady in my life's favorite production."
          </p>
          <div className="flex justify-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
