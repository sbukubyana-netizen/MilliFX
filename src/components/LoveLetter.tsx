import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Mail, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface LoveLetterProps {
  isVisible: boolean;
}

const PAGES = [
  {
    title: "Chapter I: The Spark ✨",
    content: `Dear Millicent,

Do you remember how everything started? In a world full of noise, you became my quiet, beautiful refuge. Looking back at the first moments we shared, I realize now that my heart had already chosen you before my mind could even process it. 

Every single video, photograph, and memory on this website exists because you made ordinary days feel like a cinematic masterpiece. You are my Favorite Star in our private cinema, and I would watch our movie over and over again, for a million lifetimes.`
  },
  {
    title: "Chapter II: 5 Things I Adore About You 🌸",
    content: `If I had to list why my heart beats for you, a single lifetime wouldn't be enough. But here are five things that make me fall for you every single day:

1. Your Smile 😍: The absolute light of my life. It heals any shadow in my day within seconds.
2. Your Strength: The graceful, quiet resilience with which you carry your beautiful soul.
3. Your Giggles: Those spontaneous, pure sounds of happiness that double as my favorite soundtrack.
4. Your Eyes: Through them, I see a future full of warmth, peace, and beautiful adventures.
5. Your Heart: The kindest, most generous sanctuary I have ever known.`
  },
  {
    title: "Chapter III: Our Forever Promise 💍",
    content: `As we look toward our next big milestone (and watch that beautiful countdown tick away), I want to make a few solemn promises to you:

I promise to listen to you, not just with my ears, but with my soul. I promise to hold your hand through the stormy seasons and dance with you under the sunny skies. I promise to always remember the magic of how we began, and to actively build a beautiful future together, frame by frame, memory by memory.

You are my today, my tomorrow, and my forever.

With all my love,
Your Favorite Person 🤍`
  }
];

export default function LoveLetter({ isVisible }: LoveLetterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSealed, setIsSealed] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasBeenSeen, setHasBeenSeen] = useState(() => {
    return localStorage.getItem('millifix_loveletter_seen') === 'true';
  });

  const handleClose = () => {
    setIsOpen(false);
    if (!isSealed) {
      setHasBeenSeen(true);
      localStorage.setItem('millifix_loveletter_seen', 'true');
    }
  };

  if (!isVisible || hasBeenSeen) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-50 pointer-events-auto"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_10px_30px_rgba(var(--accent-rgb),0.5)] border border-white/20 cursor-pointer group"
          title="A Letter for Millicent 🤍"
        >
          <Mail className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          
          {/* Pulsing Label Tooltip */}
          <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-bg-deep border border-border-subtle text-[11px] font-bold uppercase tracking-wider text-text-main shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            A Letter for Milli 💌
          </span>
        </motion.button>
      </motion.div>

      {/* Love Letter Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Letter Body Container */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-2xl bg-[#faf6f0] border-2 border-[#e6dfd3] p-6 md:p-12 rounded-lg shadow-2xl flex flex-col items-center justify-center overflow-hidden min-h-[500px]"
              style={{ boxShadow: "0px 30px 100px rgba(0,0,0,0.8)" }}
            >
              {/* Outer Parchment Accent Corner Borders */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#c5bcb0]" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#c5bcb0]" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#c5bcb0]" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#c5bcb0]" />

              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-[#8a7f6e] hover:text-[#ff2d55] transition-colors bg-[#f1eae0] p-1.5 rounded-full border border-[#e0d6c8]"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {isSealed ? (
                  // WAX SEAL PHASE
                  <motion.div
                    key="wax-seal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center space-y-8 text-center"
                  >
                    <div className="space-y-2">
                      <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px] block">MilliFix Private Vault</span>
                      <h3 className="text-2xl md:text-3xl font-serif-casual font-black text-[#564e43] tracking-tight">
                        A Letter Sealed with Love 🤍
                      </h3>
                      <p className="text-[12px] text-[#8a7f6e] max-w-sm font-medium leading-relaxed">
                        To the Executive Producer and Star of my life. Tap the wax seal to unlock our personal memoir letter.
                      </p>
                    </div>

                    {/* Wax Stamp */}
                    <motion.button
                      onClick={() => setIsSealed(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-28 h-28 rounded-full bg-accent flex items-center justify-center shadow-[0_15px_35px_rgba(var(--accent-rgb),0.5)] group/seal border-4 border-white/20 select-none cursor-pointer"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border border-white/20"
                      />
                      <Heart className="w-12 h-12 text-white fill-current group-hover/seal:scale-110 transition-transform" />
                      <span className="absolute bottom-[-24px] text-[10px] font-bold text-accent tracking-widest uppercase animate-pulse">Open Seal</span>
                    </motion.button>
                  </motion.div>
                ) : (
                  // LETTER CONTENT PHASE
                  <motion.div
                    key="letter-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full flex flex-col justify-between flex-grow"
                  >
                    {/* Header with Title and Chapter Book */}
                    <div className="flex items-center justify-between border-b border-[#ebd9c3] pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <span className="text-[10px] uppercase font-black text-[#968671] tracking-widest">
                          {PAGES[currentPage].title}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-[#968671] tracking-widest">
                        PAGE {currentPage + 1} OF {PAGES.length}
                      </div>
                    </div>

                    {/* Letter Body written in handwritten Cursive style */}
                    <div className="flex-grow flex items-center justify-center py-4">
                      <p className="font-cursive text-xl md:text-2xl text-[#4a3e30] leading-relaxed whitespace-pre-wrap select-text selection:bg-accent/20">
                        {PAGES[currentPage].content}
                      </p>
                    </div>

                    {/* Footer Nav and hearts */}
                    <div className="flex items-center justify-between border-t border-[#ebd9c3] pt-6 mt-6">
                      <button
                        onClick={() => setCurrentPage(idx => Math.max(0, idx - 1))}
                        disabled={currentPage === 0}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                          currentPage === 0 
                            ? 'text-[#c5bcb0] cursor-not-allowed' 
                            : 'text-[#8a7f6e] hover:text-accent hover:bg-[#ebd9c3]/20'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>

                      {/* Micro floating hearts element */}
                      <Heart className="w-4 h-4 text-accent fill-current animate-pulse opacity-60" />

                      {currentPage < PAGES.length - 1 ? (
                        <button
                          onClick={() => setCurrentPage(idx => idx + 1)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest text-[#8a7f6e] hover:text-accent hover:bg-[#ebd9c3]/20 transition-all"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            setHasBeenSeen(true);
                            localStorage.setItem('millifix_loveletter_seen', 'true');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded bg-accent text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg cursor-pointer"
                        >
                          Return Home 🤍
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
