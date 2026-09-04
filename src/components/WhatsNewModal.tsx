import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Tv, MapPin, Calendar, Volume2, Flame, Heart, Film, Radio, Mic, Clapperboard, Music } from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface UpdateItem {
  icon: React.ReactNode;
  tag: string;
  title: string;
  desc: string;
}

export const APP_UPDATES: UpdateItem[] = [
  {
    icon: <Clapperboard className="w-5 h-5 text-amber-400" />,
    tag: "Cinema Studio",
    title: "Customizable Movie Credits & Ambient Video/Image Backgrounds",
    desc: "Fully configure the Hollywood movie end credits inside Settings! Add custom categories, edit cast and crew roles, update the romantic closing quote, and choose background media (custom video loops or high-res photos) with live opacity controls."
  },
  {
    icon: <Radio className="w-5 h-5 text-accent" />,
    tag: "Soundstage",
    title: "Track Dedications Quick-Inserter & Auto-Thumbnails",
    desc: "Accepts Spotify & YouTube links, voice memo recordings, and love letters. Clicking any card opens directly in Spotify or YouTube with auto-detected high-res thumbnails and dynamic cloud persistence."
  },
  {
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
    tag: "Navbar",
    title: "Live-Synced Updates Search & Streamlined Header",
    desc: "The search bar in the top navigation is now fully synced with all new releases and moments. Removed unnecessary notifications icon for an ultra-clean, distraction-free cinema aesthetic."
  },
  {
    icon: <Mic className="w-5 h-5 text-emerald-400" />,
    tag: "Voice Notes",
    title: "Microphone Voice Memo Recordings & Player",
    desc: "Record live voice notes with real-time waveform visualizers, elapsed timers, and instant playback previews. Synchronized live in the cloud for your partner to listen to anytime."
  },
  {
    icon: <Tv className="w-5 h-5 text-accent" />,
    tag: "Mini Player",
    title: "Floatable Mini Player with Live Border Resize",
    desc: "Switch the active video frame into a beautiful, picture-in-picture floatable modal. Drag it anywhere around the screen using its top/bottom handles, or resize its width/height dynamically by dragging on either of the side borders!"
  },
  {
    icon: <Film className="w-5 h-5 text-violet-400" />,
    tag: "Studio",
    title: "Commas-Separated Multiple Media Backdrops",
    desc: "Easily input multiple, customizable background loops (supporting video links, direct images, or YouTube URLs) as a simple comma-separated list! Includes multi-file drag-and-drop support and automatic smart client-side photo compression."
  },
  {
    icon: <Calendar className="w-5 h-5 text-emerald-400" />,
    tag: "Timeline",
    title: "Multiple Milestone Countdown Tracker",
    desc: "Enables partners to monitor separate count timelines simultaneously: our official Anniversary (Jan 18), Sbu's Birthday (Jan 26), and Milli's Birthday (July 8). Switch active timelines instantly from the dashboard."
  }
];

export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const updates = APP_UPDATES;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Dark overlay background for theater depth */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal itself */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="relative bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl z-30 flex flex-col max-h-[85vh]"
        >
          {/* Top aesthetic accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-accent via-pink-600 to-violet-600" />

          {/* Close trigger button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Dismiss what's new"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="p-6 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Version 2.5 Update Live</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              What's New in MilliSbu? 🎬
            </h2>
            <p className="text-xs text-text-dim mt-1.5 font-bold tracking-wide">
              Here is a log of beautiful features and updates designed to make our movie memories flawless.
            </p>
          </div>

          {/* Updates Scrollable Content List */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
            {updates.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={index}
                className="flex gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
              >
                <div className="p-2 sm:p-3 bg-white/5 rounded-xl flex items-center justify-center self-start shadow-inner">
                  {item.icon}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-black tracking-widest bg-white/10 text-white px-2 py-0.5 rounded-md">
                      {item.tag}
                    </span>
                    <span className="text-xs font-bold text-white tracking-tight">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Modal Footer actions */}
          <div className="p-6 pt-3 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto flex-1 bg-accent text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-widest hover:bg-hover active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Loving the updates!</span>
            </button>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-dim text-center">
              MilliSbu Season 2 • Forever 🤍
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
