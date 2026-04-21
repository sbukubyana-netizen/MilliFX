import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Calendar, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Memory } from '../constants';

interface ImageModalProps {
  item: Memory | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function ImageModal({ item, onClose, onNext, onPrev, isPaused, onTogglePause, hasNext, hasPrev }: ImageModalProps) {
  const [videoDuration, setVideoDuration] = useState(0);

  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none"
        >
          {/* Navigation Controls Overlay */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-50 pointer-events-none">
            {hasPrev ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="pointer-events-auto bg-black/40 text-white p-4 rounded-full hover:bg-accent/80 transition-all border border-white/10 backdrop-blur-md group"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
              </button>
            ) : <div />}
            {hasNext ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="pointer-events-auto bg-black/40 text-white p-4 rounded-full hover:bg-accent/80 transition-all border border-white/10 backdrop-blur-md group"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : <div />}
          </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="pointer-events-auto absolute top-4 md:top-8 right-4 md:right-8 z-50 bg-black/40 text-white p-3 rounded-full hover:bg-red-500 transition-colors backdrop-blur-md border border-white/10"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onTogglePause?.(); }}
              className="pointer-events-auto absolute top-4 md:top-8 right-20 md:right-24 z-50 bg-black/40 text-white p-3 rounded-full hover:bg-accent transition-colors backdrop-blur-md border border-white/10"
              title={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
            >
              {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
            </button>

          <div className="w-full h-full flex items-center justify-center pointer-events-auto overflow-hidden bg-black select-none">
            <AnimatePresence mode="wait">
              {item.videoUrl ? (
                <motion.video
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  onEnded={onNext}
                  key={item.videoUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={item.videoUrl}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full max-h-screen object-contain"
                />
              ) : (
                <motion.img 
                  key={item.imageUrl}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full max-h-screen object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </AnimatePresence>
            
            {/* Immersive Overlay Info */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none">
              {/* Autoplay Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <motion.div 
                  key={`${item.id}-${isPaused}-${videoDuration}`}
                  initial={{ width: 0 }}
                  animate={{ width: isPaused ? '0%' : '100%' }}
                  transition={{ duration: isPaused ? 0 : (item.videoUrl ? videoDuration : 5), ease: "linear" }}
                  className="h-full bg-accent shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.8)]"
                />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.title}
                className="max-w-4xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-accent font-black uppercase tracking-[0.4em] text-[10px]">Cinema Mode</span>
                  <div className="h-px w-8 bg-accent/30" />
                </div>
                <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl leading-none">{item.title}</h2>
                <div className="flex items-center gap-6 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2"><Heart className="w-3 h-3 text-accent fill-current" /> Moment Captured</span>
                  <span>MilliFix Original</span>
                  <span className="text-white/20 whitespace-nowrap hidden sm:inline">18 JANUARY 2027</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
