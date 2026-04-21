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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full h-full md:max-w-7xl md:max-h-[85vh] flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-bg-deep border border-white/5"
        >
          {/* Navigation Controls Overlay */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-50 pointer-events-none">
            {hasPrev ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="pointer-events-auto bg-black/20 text-white p-4 rounded-full hover:bg-white/10 transition-all border border-white/5 backdrop-blur-sm group"
              >
                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
              </button>
            ) : <div />}
            {hasNext ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="pointer-events-auto bg-black/20 text-white p-4 rounded-full hover:bg-white/10 transition-all border border-white/5 backdrop-blur-sm group"
              >
                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : <div />}
          </div>

            <button 
              onClick={onClose}
              className="absolute top-4 md:top-6 right-4 md:right-6 z-50 bg-black/40 md:bg-black/20 text-white p-2 rounded-full hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onTogglePause?.(); }}
              className="absolute top-4 md:top-6 right-16 md:right-20 z-50 bg-black/40 md:bg-black/20 text-white p-2 rounded-full hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors"
              title={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
            >
              {isPaused ? <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />}
            </button>

          <div className="flex-grow h-full flex items-center justify-center bg-black overflow-hidden group/img">
            <AnimatePresence mode="wait">
              {item.videoUrl ? (
                <motion.video
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  onEnded={onNext}
                  key={item.videoUrl}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.8 }}
                  src={item.videoUrl}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <motion.img 
                  key={item.imageUrl}
                  initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.9 }}
                  transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              )}
            </AnimatePresence>
            
            {/* Immersive Overlay Info (Visible on Hover in desktop, always on mobile) */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 bg-linear-to-t from-black/80 to-transparent flex flex-col justify-end">
              {/* Autoplay Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                <motion.div 
                  key={`${item.id}-${isPaused}-${videoDuration}`}
                  initial={{ width: isPaused ? '0%' : '0%' }}
                  animate={{ width: isPaused ? '0%' : '100%' }}
                  transition={{ duration: isPaused ? 0 : (item.videoUrl ? videoDuration : 5), ease: "linear" }}
                  className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)]"
                />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.title}
                className="max-w-2xl"
              >
                <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Slideshow Mode</span>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">{item.title}</h2>
                <div className="flex items-center gap-4 text-white/60 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Heart className="w-3 h-3 text-accent fill-current" /> Moment Captured</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>MilliFix Original</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
