import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Chrome, Share, ArrowDownToLine, Monitor } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any; // Native intercepted beforeinstallprompt
}

export default function InstallPromptModal({ isOpen, onClose, deferredPrompt }: InstallPromptModalProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to installation: ${outcome}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Overlay closer */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 p-6 text-white space-y-4"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-accent flex items-center gap-2">
                  <Download className="w-5 h-5 animate-bounce" /> Install App to Device
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">Get standalone offline access & home screen presence</p>
              </div>
              <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-white hover:bg-white/5 p-1.5 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Logic depending on device and state */}
            {deferredPrompt ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your browser supports direct installation! Click the button below to install <strong>MilliSbu App</strong> directly onto your home screen or desktop taskbar.
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                  <Monitor className="w-8 h-8 text-accent shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-black text-white">Direct Web Installation</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Launches like a real native app with an immersive borderless screen.</p>
                  </div>
                </div>
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 bg-[#ff2d55] font-black uppercase text-xs tracking-widest text-white rounded hover:bg-[#ff2d55]/85 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" /> Confirm Browser Download
                </button>
              </div>
            ) : isIOS || isSafari ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Apple Safari does not allow automatic one-click installation triggers. However, you can add this application to your iPhone/iPad or Mac in under 3 seconds manually:
                </p>
                
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0 mt-0.5">1</span>
                    <span className="leading-normal">Tap on the browser's <strong>Share/Action</strong> icon (<Share className="w-3.5 h-3.5 inline text-blue-400 shrink-0" />) at the bottom or top of the navigation bar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0 mt-0.5">2</span>
                    <span className="leading-normal">Scroll down and tap <strong>"Add to Home Screen"</strong> (<Smartphone className="w-3.5 h-3.5 inline text-zinc-400 shrink-0" />).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0 mt-0.5">3</span>
                    <span className="leading-normal">Enter a name of your choice (e.g. <strong>MilliSbu 🤍</strong>) and press <strong>"Add"</strong>. Awesome, you are loaded!</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 font-extrabold uppercase text-[10px] tracking-widest rounded transition-all text-center"
                >
                  Got It, Thanks!
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  To download this application to your device, please look for the <strong>Install / Download Icon</strong> (a computer monitor with a small arrow, or a plus "+" icon) inside your browser's horizontal address search bar:
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                  <Chrome className="w-8 h-8 text-amber-400 shrink-0" />
                  <div className="text-left text-xs">
                    <p className="font-black text-white text-xs">Desktop Browser Installation</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Chrome, Microsoft Edge, and Brave support standalone desktop rendering instantly from the URL area.</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-zinc-800 font-extrabold uppercase text-[10px] tracking-widest text-zinc-200 rounded hover:bg-zinc-700 transition-all text-center"
                >
                  Close & Ready
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
