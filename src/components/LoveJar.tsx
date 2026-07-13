import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Heart, Send, BookOpen, Lock, Unlock, Plus, AlertCircle, History, Trash2 } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface LoveJarNote {
  id: string;
  text: string;
  sender: string; // "Milli 🤍" or "Sbu 🤍"
  createdAt: string; // ISO string
  opened: boolean;
  openedAt?: string; // ISO string
  recipient?: string; // "Milli 🤍" or "Sbu 🤍"
}

interface LoveJarProps {
  currentUserProfile?: 'Girlfriend' | 'Boyfriend' | 'Us';
}

export default function LoveJar({ currentUserProfile = 'Girlfriend' }: LoveJarProps) {
  const [notes, setNotes] = useState<LoveJarNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedSender, setSelectedSender] = useState<string>(
    currentUserProfile === 'Boyfriend' ? 'Sbu 🤍' : 'Milli 🤍'
  );
  
  // Dialog / Modal states
  const [revealedNote, setRevealedNote] = useState<LoveJarNote | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDrop, setSuccessDrop] = useState(false);
  
  // Real time calculation for countdown
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Sync sender option with selected profile
  useEffect(() => {
    setSelectedSender(currentUserProfile === 'Boyfriend' ? 'Sbu 🤍' : 'Milli 🤍');
  }, [currentUserProfile]);

  // Real-time Firestore sync
  useEffect(() => {
    const collRef = collection(db, 'love_jar_notes');
    const unsub = onSnapshot(
      collRef,
      (snapshot) => {
        const fetched: LoveJarNote[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as LoveJarNote);
        });
        setNotes(fetched);
      },
      (error) => {
        console.error('Error syncing love_jar_notes:', error);
        handleFirestoreError(error, OperationType.LIST, 'love_jar_notes');
      }
    );
    return () => unsub();
  }, []);

  const viewerName = currentUserProfile === 'Boyfriend' ? 'Sbu 🤍' : 'Milli 🤍';
  const partnerName = currentUserProfile === 'Boyfriend' ? 'Milli 🤍' : 'Sbu 🤍';

  // Extract relevant state sets
  const sealedPartnerNotes = notes.filter(n => !n.opened && n.sender === partnerName);
  const totalSealedInJar = notes.filter(n => !n.opened).length;

  // Most recent note opened by the current viewer within the last 24 hours
  const lastOpenedByMe = notes
    .filter(n => n.opened && n.recipient === viewerName && n.openedAt)
    .sort((a, b) => new Date(b.openedAt!).getTime() - new Date(a.openedAt!).getTime())[0];

  useEffect(() => {
    if (!lastOpenedByMe || !lastOpenedByMe.openedAt) {
      setTimeRemaining(null);
      setCooldownSeconds(0);
      return;
    }

    const calculateTime = () => {
      const openedTime = new Date(lastOpenedByMe.openedAt!).getTime();
      const now = new Date().getTime();
      const diffMs = (openedTime + 24 * 60 * 60 * 1000) - now;

      if (diffMs <= 0) {
        setTimeRemaining(null);
        setCooldownSeconds(0);
      } else {
        const hours = Math.floor(diffMs / (3200 * 1000) % 24); // Wait, typical calculation:
        const totalSecs = Math.floor(diffMs / 1000);
        setCooldownSeconds(totalSecs);

        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        setTimeRemaining(`${h}h ${m}m ${s}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [lastOpenedByMe]);

  // Drop a note into the digital corked jar
  const handleDropNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const id = 'jarnote_' + Date.now();
    const newNote: LoveJarNote = {
      id,
      text: newNoteText.trim(),
      sender: selectedSender,
      createdAt: new Date().toISOString(),
      opened: false
    };

    try {
      setErrorMessage(null);
      await setDoc(doc(db, 'love_jar_notes', id), newNote);
      setNewNoteText('');
      setSuccessDrop(true);
      setTimeout(() => setSuccessDrop(false), 3000);
    } catch (err) {
      console.error('Failed to drop note into Love Jar:', err);
      setErrorMessage('Failed to drop your note into the secret space jar.');
    }
  };

  // Uncork the jar (Shake, trigger popping cork, reveal a note)
  const handleUncork = async () => {
    if (cooldownSeconds > 0) return;
    if (sealedPartnerNotes.length === 0) {
      setErrorMessage(`No unopened notes left for you in the jar! Ask ${partnerName} to drop a secret!`);
      return;
    }

    // Trigger responsive shaking
    setIsShaking(true);
    setErrorMessage(null);

    setTimeout(async () => {
      setIsShaking(false);
      // Select the oldest note from partner to reveal in sequence
      const noteToReveal = [...sealedPartnerNotes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

      if (!noteToReveal) return;

      try {
        const updatedFields = {
          opened: true,
          openedAt: new Date().toISOString(),
          recipient: viewerName
        };

        await updateDoc(doc(db, 'love_jar_notes', noteToReveal.id), updatedFields);
        setRevealedNote({ ...noteToReveal, ...updatedFields });
      } catch (err) {
        console.error('Error uncorking note:', err);
        setErrorMessage('Failed to uncork and read note from the database.');
      }
    }, 1500); // Shaking animation duration
  };

  const openedNotesHistory = notes
    .filter(n => n.opened)
    .sort((a, b) => new Date(b.openedAt || '').getTime() - new Date(a.openedAt || '').getTime());

  // For administrative or cleanup purposes if someone wants to wipe opened notes
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this letter from our space journal?')) return;
    try {
      await deleteDoc(doc(db, 'love_jar_notes', id));
    } catch (err) {
      console.error('Error deleting letter:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" id="love-jar-container-outer">
      <div className="relative rounded-2xl md:rounded-3xl bg-zinc-950/60 border border-white/5 backdrop-blur-xl p-6 md:p-10 shadow-2xl space-y-8 overflow-hidden">
        {/* Cosmos background decoration */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full" />
        
        {/* Floating Stars particles inside container */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white rounded-full"
              style={{
                top: `${15 + i * 14}%`,
                left: `${10 + (i * 23) % 80}%`,
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">🍯</span>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                The Cosmic Love Jar
                <span className="text-accent">✨</span>
              </h2>
            </div>
            <p className="text-xs text-text-dim max-w-lg leading-relaxed">
              Pour your love letters, sweet confessions, or cute secrets inside. Shake and uncork only once every 24 hours to read a surprise note!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-text-dim hover:text-white bg-black/20 border border-white/5 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer transition-all min-h-[44px]"
            >
              <History className="w-3.5 h-3.5 text-accent" />
              <span>{showHistory ? 'Close Memories' : 'Opened Letters'}</span>
            </button>
          </div>
        </div>

        {/* Cooldown Alert / Indicator */}
        {cooldownSeconds > 0 && (
          <div className="p-3.5 bg-accent/10 border border-accent/20 text-accent text-xs rounded-xl flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>You have already uncorked a message today! Access next letter in:</span>
            </div>
            <span className="font-mono font-black text-white bg-accent px-3 py-1 rounded-md text-[11px] uppercase tracking-normal">
              {timeRemaining}
            </span>
          </div>
        )}

        {/* Error message alerting */}
        {errorMessage && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success animation backdrop alert */}
        {successDrop && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Swirl! Letter dropped into the cosmic bottle successfully 💌</span>
          </motion.div>
        )}

        {/* Main Grid: Jar View on Left, Dropping letters on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="love-jar-grid">
          
          {/* LEFT: Interactive Jar Visual Representation */}
          <div className="col-span-1 md:col-span-12 lg:col-span-5 flex flex-col items-center justify-center space-y-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
              animate={isShaking ? {
                x: [-12, 12, -12, 12, -6, 6, -3, 3, 0],
                y: [-6, 6, -6, 6, -3, 3, -1, 1, 0],
                rotate: [-8, 8, -8, 8, -4, 4, -2, 2, 0]
              } : {
                y: [-6, 6, -6],
              }}
              transition={isShaking ? {
                duration: 1.5,
                ease: 'easeInOut'
              } : {
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative w-48 h-64 md:w-52 md:h-72 cursor-pointer flex flex-col items-center select-none touch-manipulation"
              onClick={handleUncork}
              id="interactive-love-jar-graphic"
            >
              {/* Glass reflection glow */}
              <div className="absolute inset-x-4 top-10 bottom-4 bg-gradient-to-r from-white/5 to-transparent rounded-3xl pointer-events-none" />

              {/* Cork top */}
              <div className="w-16 h-8 bg-amber-800/80 rounded-t-lg border-b border-amber-999 shadow-md flex items-center justify-center relative z-20">
                <div className="w-12 h-1 bg-amber-700/60 rounded" />
              </div>

              {/* Neck segment */}
              <div className="w-20 h-6 bg-zinc-300/15 border-x-2 border-white/10 rounded-sm relative z-10" />

              {/* Jar Glass Body */}
              <div className="w-full h-48 bg-white/[0.04] border-2 border-white/20 rounded-b-4xl rounded-t-2xl shadow-[inset_0_0_30px_rgba(255,255,255,0.08)] flex flex-col items-center justify-center relative py-6">
                
                {/* Floating paper heart/stars inside the jar based on sealed amount */}
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
                  {totalSealedInJar > 0 ? (
                    [...Array(Math.min(totalSealedInJar, 12))].map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="absolute text-pink-500/40"
                        style={{
                          bottom: `${15 + (idx * 13) % 55}%`,
                          left: `${15 + (idx * 27) % 70}%`,
                          fontSize: `${12 + (idx * 4) % 12}px`
                        }}
                        animate={{
                          y: [-3, 3, -3],
                          rotate: [-15, 15, -15],
                        }}
                        transition={{
                          duration: 3 + idx,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        ❤️
                      </motion.div>
                    ))
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Empty Jar</span>
                    </div>
                  )}
                </div>

                {/* Classic Heart tag on a string hanging on jar neck */}
                <div className="absolute top-[4px] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                  <div className="w-[1px] h-10 bg-amber-700/60" />
                  <div className="px-2.5 py-1 bg-pink-500/95 border border-pink-600 rounded-md text-[9px] font-black uppercase text-white shadow-md select-none transform rotate-3 flex items-center gap-1">
                    <span>Milli & Sbu</span>
                    <Heart className="w-2 h-2 fill-white stroke-none" />
                  </div>
                </div>

                {/* Content info */}
                <div className="z-10 text-center space-y-1 select-none">
                  <span className="block text-2xl font-mono text-white font-extrabold shadow-sm">
                    {totalSealedInJar}
                  </span>
                  <span className="block text-[8px] tracking-widest uppercase font-black text-text-dim">
                    Sealed Secrets
                  </span>
                </div>
              </div>

              {/* Base glass reflection */}
              <div className="w-36 h-3 bg-white/10 blur-[1px] rounded-full mt-1.5 opacity-40" />
            </motion.div>

            {/* Uncork trigger button status display */}
            <div className="text-center space-y-2 w-full max-w-xs">
              <button
                onClick={handleUncork}
                disabled={cooldownSeconds > 0 || sealedPartnerNotes.length === 0}
                className={`w-full py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  cooldownSeconds > 0
                    ? 'bg-zinc-900 border border-white/5 text-zinc-500 cursor-not-allowed'
                    : sealedPartnerNotes.length === 0
                    ? 'bg-zinc-800 border border-white/5 text-zinc-400'
                    : 'bg-accent text-white scale-100 hover:scale-[1.03] active:scale-[0.98] shadow-accent/20 border border-accent/10'
                }`}
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Lock className="w-4 h-4 text-zinc-500 animate-pulse" />
                    <span>Locked for 24h</span>
                  </>
                ) : sealedPartnerNotes.length === 0 ? (
                  <>
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <span>No letters left to reveal</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-white animate-bounce" />
                    <span>Uncork Surprise ({sealedPartnerNotes.length} Left)</span>
                  </>
                )}
              </button>
              
              {sealedPartnerNotes.length > 0 && cooldownSeconds === 0 && (
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider animate-pulse">
                  👉 Click the Jar or Press Uncork to Pop!
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: Drop customized love letters */}
          <div className="col-span-1 md:col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 md:p-6 space-y-5">
              <p className="text-xs uppercase font-extrabold tracking-wider text-text-dim flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-accent" />
                <span>Drop a Cosmic Message</span>
              </p>

              <form onSubmit={handleDropNote} className="space-y-4">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`Write a romantic text, deep secret, customized confession, or loving note for ${partnerName}...`}
                  maxLength={1000}
                  className="w-full h-32 bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-accent/50 focus:ring-1 focus:ring-accent/10 transition-all leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Sender selecting checkmark label */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-[10px] uppercase font-black tracking-widest text-text-dim">From:</span>
                    <div className="flex gap-1.5">
                      {['Milli 🤍', 'Sbu 🤍'].map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setSelectedSender(name)}
                          className={`px-4 py-2.5 min-h-[44px] min-w-[80px] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                            selectedSender === name
                              ? 'bg-pink-500 text-white shadow-md'
                              : 'bg-zinc-900/50 text-text-dim hover:text-white border border-white/5'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {newNoteText.length}/1000
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className={`py-2.5 px-5 min-h-[44px] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                        newNoteText.trim()
                          ? 'bg-accent text-white hover:bg-accent/90'
                          : 'bg-zinc-800 border border-white/5 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Drop Secret</span>
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Short guidelines */}
            <div className="p-4 bg-zinc-900/20 border border-white/5 rounded-xl space-y-1.5 leading-relaxed">
              <span className="text-[10px] uppercase font-black tracking-widest text-accent flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Space Rules
              </span>
              <p className="text-[11px] text-text-dim font-medium">
                When you cork a letter, it drops into orbit immediately. The receiving partner checks back here every 24 hours to uncork a note, which triggers a complete immersive space-particle backdrop full screen display!
              </p>
            </div>
          </div>
        </div>

        {/* History Archive Drawer */}
        {showHistory && (
          <div className="border-t border-white/5 pt-6 space-y-4 animate-fadeIn" id="opened-love-notes-history">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-text-dim flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span>Unveiled Confessions Ledger ({openedNotesHistory.length})</span>
            </h3>

            {openedNotesHistory.length === 0 ? (
              <p className="text-xs text-text-dim italic py-4">No secrets have been uncorked yet from our digital jar. Pop your first cork to build memory journal! 📜</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {openedNotesHistory.map((note) => {
                  const isSbu = note.sender.includes('Sbu');
                  const formattedDate = note.openedAt
                    ? new Date(note.openedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'A long time ago';

                  return (
                    <div
                      key={note.id}
                      className="p-4 bg-zinc-900/40 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between group"
                    >
                      <p className="text-xs text-white leading-relaxed whitespace-pre-line flex-1">
                        "{note.text}"
                      </p>
                      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px] font-bold text-text-dim">
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSbu ? 'bg-violet-400' : 'bg-pink-400'
                            }`}
                          />
                          From {note.sender}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Uncorked: {formattedDate}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL SCREEN SURPRISE UNCORKED MODAL WITH SOFT PARTICLE BACKDROP */}
      <AnimatePresence>
        {revealedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl overflow-y-auto"
            id="fullscreen-uncorked-revelation-backdrop"
          >
            {/* Custom soft-focus canvas layout particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Soft pink energy dust */}
              {[...Array(15)].map((_, index) => (
                <motion.div
                  key={`dust-${index}`}
                  className="absolute rounded-full bg-pink-500/10 blur-xl"
                  style={{
                    width: `${50 + (index * 8) % 120}px`,
                    height: `${50 + (index * 8) % 120}px`,
                    top: `${(index * 17) % 100}%`,
                    left: `${(index * 23) % 100}%`,
                  }}
                  animate={{
                    y: [-40, 40],
                    x: [-20, 20],
                    scale: [0.9, 1.2, 0.9],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{
                    duration: 10 + (index % 5) * 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              ))}

              {/* GORGEOUS SOFT-FOCUS FLOATING LOVE LETTERS & ENVELOPES */}
              {[...Array(20)].map((_, index) => {
                const noteType = index % 3; // envelope, card, or heart
                const delay = index * 0.45;
                const duration = 14 + (index % 8) * 3;
                const startX = (index * 13) % 95;
                const size = 36 + (index % 4) * 8; // 36px to 68px
                const blurClass = index % 3 === 0 ? 'blur-[1.5px]' : index % 3 === 1 ? 'blur-[0.5px]' : 'blur-[2.5px]';
                const opacity = 0.2 + (index % 4) * 0.08; // 0.2 to 0.52
                
                return (
                  <motion.div
                    key={`love-note-${index}`}
                    className={`absolute rounded-xl border border-white/10 bg-white/5 backdrop-blur-xs flex items-center justify-center p-2 shadow-xl ${blurClass}`}
                    style={{
                      width: `${size * 1.3}px`,
                      height: `${size}px`,
                      left: `${startX}%`,
                      top: '100%',
                    }}
                    animate={{
                      y: ['0vh', '-130vh'],
                      x: [0, (index % 2 === 0 ? 60 : -60) * Math.sin(index)],
                      rotate: [index * 20, index * 20 + (index % 2 === 0 ? 360 : -360)],
                    }}
                    transition={{
                      duration: duration,
                      repeat: Infinity,
                      delay: delay,
                      ease: 'linear',
                    }}
                  >
                    {noteType === 0 ? (
                      // Beautiful sealed envelope visual
                      <svg className="w-full h-full text-pink-400/35 fill-current" viewBox="0 0 24 24" style={{ opacity }}>
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    ) : noteType === 1 ? (
                      // Heart Post-it note visual
                      <div className="w-full h-full flex flex-col items-center justify-center bg-pink-500/10 rounded-lg border border-pink-500/20" style={{ opacity }}>
                        <span className="text-sm">💌</span>
                      </div>
                    ) : (
                      // Sealed heart parchment paper
                      <div className="w-full h-full flex items-center justify-center bg-violet-500/10 rounded-lg border border-violet-500/20" style={{ opacity }}>
                        <span className="text-base animate-pulse">💖</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Glowing cosmic stars */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute text-yellow-300/40 text-lg"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + (index % 5),
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  ✨
                </motion.span>
              ))}
            </div>

            {/* Main Interactive Floating Display Letter Board */}
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: -30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="relative w-full max-w-xl bg-zinc-950/80 border border-white/15 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,45,85,0.25)] text-center space-y-8 backdrop-blur-xl"
              id="revelation-message-board"
            >
              {/* Top cork ribbon ribbon banner */}
              <div className="flex justify-center flex-col items-center space-y-2">
                <span className="text-4xl animate-bounce">🍾✨</span>
                <div className="bg-pink-500/10 border border-pink-500/20 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-pink-300">
                  Uncorked Confession
                </div>
              </div>

              {/* Message text with beautiful typography */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto px-2">
                <blockquote className="text-lg md:text-xl font-medium text-white italic tracking-wide leading-relaxed whitespace-pre-line font-serif">
                  "{revealedNote.text}"
                </blockquote>
              </div>

              {/* Footer signature */}
              <div className="border-t border-white/5 pt-6 flex flex-col items-center justify-center space-y-1">
                <span className="text-xs text-text-dim uppercase font-black tracking-widest">
                  Sent deep in stars from:
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5 uppercase hover:scale-105 transition-all">
                  {revealedNote.sender} <Heart className="w-4 h-4 text-accent fill-accent" />
                </span>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                <button
                  onClick={() => setRevealedNote(null)}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent text-white text-xs font-black uppercase tracking-wider shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer w-full sm:w-auto"
                >
                  Close & Seal Till Tomorrow 💌
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
