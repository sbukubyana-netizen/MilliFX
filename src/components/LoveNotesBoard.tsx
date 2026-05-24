import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface StickyNote {
  id: string;
  text: string;
  sender: 'Milli 🤍' | 'Fix 🤍' | 'Us 🤍';
  color: string;
  createdAt: string;
  tilt: number;
}

const PRESET_NOTES: StickyNote[] = [
  {
    id: 'preset-1',
    text: "Thank you for always putting a huge smile on my face! You are my absolute favorite routine 🤍",
    sender: "Fix 🤍",
    color: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
    createdAt: '24 May 2026',
    tilt: -2
  },
  {
    id: 'preset-2',
    text: "Can we talk about the cozy dinner nights? Pizza + your warm laughter = absolute perfection.",
    sender: "Milli 🤍",
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    createdAt: '18 May 2026',
    tilt: 3
  },
  {
    id: 'preset-3',
    text: "Every frame of the future watch-list is going to be a pure cinematic masterpiece with you! ✈️🌍",
    sender: "Us 🤍",
    color: 'bg-violet-500/10 border-violet-500/30 text-violet-200',
    createdAt: '01 May 2026',
    tilt: -1
  },
  {
    id: 'preset-4',
    text: "I hope you have clicked around the MilliFix app and found all the sweet surprises hidden for you! 😍",
    sender: "Fix 🤍",
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    createdAt: '12 April 2026',
    tilt: 2
  }
];

const COLORS = [
  { name: 'Romantic Pink', value: 'bg-rose-500/15 border-rose-500/40 text-rose-100 hover:bg-rose-500/25' },
  { name: 'Warm Amber', value: 'bg-amber-500/15 border-amber-500/40 text-amber-100 hover:bg-amber-500/25' },
  { name: 'Cozy Violet', value: 'bg-violet-500/15 border-violet-500/40 text-violet-100 hover:bg-violet-500/25' },
  { name: 'Fresh Emerald', value: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/25' },
  { name: 'Deep Cyan', value: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/25' },
];

export default function LoveNotesBoard() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Note Form State
  const [inputText, setInputText] = useState('');
  const [sender, setSender] = useState<'Milli 🤍' | 'Fix 🤍' | 'Us 🤍'>('Fix 🤍');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  // Firestore Real-time Sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'love_notes'), (snapshot) => {
      const fetchedNotes: StickyNote[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push(doc.data() as StickyNote);
      });
      
      // Sort notes so new ones are on top (Id-based or date-based fallback sorting)
      fetchedNotes.sort((a, b) => {
        const idA = Number(a.id.replace('note-', '')) || 0;
        const idB = Number(b.id.replace('note-', '')) || 0;
        return idB - idA;
      });

      setNotes(fetchedNotes);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'love_notes');
    });

    return () => unsub();
  }, []);

  const handlePostNote = async () => {
    if (!inputText.trim()) return;

    if (editingId) {
      // Modify existing note in Firestore
      const originalNote = notes.find(n => n.id === editingId);
      const updatedNote: StickyNote = {
        id: editingId,
        text: inputText,
        sender,
        color: selectedColor,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tilt: originalNote ? originalNote.tilt : (Math.random() * 6 - 3)
      };

      try {
        await setDoc(doc(db, 'love_notes', editingId), updatedNote);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `love_notes/${editingId}`);
      }
      setEditingId(null);
    } else {
      // Create a brand new note in Firestore
      const newId = `note-${Date.now()}`;
      const newNote: StickyNote = {
        id: newId,
        text: inputText,
        sender,
        color: selectedColor,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tilt: Math.random() * 6 - 3 // Tilt between -3deg and 3deg
      };

      try {
        await setDoc(doc(db, 'love_notes', newId), newNote);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `love_notes/${newId}`);
      }
    }

    // Reset Form
    setInputText('');
    setIsAdding(false);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'love_notes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `love_notes/${id}`);
    }
  };

  const handleStartEdit = (note: StickyNote, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(note.id);
    setInputText(note.text);
    setSender(note.sender);
    setSelectedColor(note.color);
    setIsAdding(true);
  };

  return (
    <div className="py-24 px-6 md:px-12 bg-bg-deep border-t border-border-subtle relative overflow-hidden" id="love-notes-board">
      {/* Absolute Decorative Glows */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent fill-accent animate-pulse" />
              <span className="text-accent font-black uppercase tracking-[0.3em] text-xs md:text-sm">
                The Cozy Corner
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
              Our Messages Jar
            </h2>
            <p className="text-text-dim text-xs md:text-sm max-w-xl">
              Pin a sweet note, leaves a message of love, write an inside joke, or commit a tiny romantic promise. Completely persistent & beautiful forever 🤍
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingId(null);
              setInputText('');
              setIsAdding(true);
            }}
            className="flex items-center gap-2 self-start md:self-end bg-accent text-white px-5 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:opacity-90 contrast-125 transition-all shadow-[0_4px_20px_rgba(255,45,85,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pick Sticky Note
          </motion.button>
        </div>

        {/* Note Grid / Corkboard Backing */}
        <div className="relative bg-black/30 border border-white/5 rounded-2xl p-6 md:p-10 min-h-[400px]">
          {notes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <span className="text-3xl">🫙</span>
              <p className="text-text-dim text-sm max-w-xs font-light">
                The Message Jar is empty! Be the first to post a sweet note using the button above.
              </p>
            </div>
          ) : (
            <motion.div 
              layout 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <motion.div
                    layout
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.8, rotate: note.tilt - 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: note.tilt }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 10, shadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{ transformOrigin: 'center center' }}
                    className={`relative p-6 rounded-xl border backdrop-blur-md shadow-lg flex flex-col justify-between min-h-[180px] transition-all duration-300 ${note.color} pointer-events-auto group`}
                    id={`sticky-${note.id}`}
                  >
                    {/* Corner Clip / Push Pin effect */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent/40 border border-white/20 shadow-inner" />
                    
                    <div className="space-y-4 pt-3">
                      {/* Note Content */}
                      <p className="text-sm font-medium tracking-tight leading-relaxed italic pr-4">
                        "{note.text}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-[10px] uppercase font-bold tracking-wider text-text-dim/80">
                      <div>
                        <span className="text-text-main font-black lowercase">{note.sender}</span>
                        <span className="mx-1 border-r border-white/10" />
                        <span>{note.createdAt}</span>
                      </div>
                      
                      {/* Mini action triggers */}
                      <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(note, e)}
                          className="hover:text-accent transition-colors cursor-pointer"
                          title="Edit Message"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Write / Edit Modal Custom Form Drawer */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsAdding(false)}
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-bg-deep border border-white/10 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl z-10"
              id="sticky-note-editor"
            >
              {/* Close pin */}
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-text-dim hover:text-white rounded-full p-1.5 hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {editingId ? 'Edit Your Note' : 'New Leaf From The Jar'}
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {editingId ? 'Modify Message' : 'Write Sweet Message'}
                </h3>
              </div>

              {/* Message form */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                    Your True Message
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={140}
                    placeholder="Write a sweet reason, date night memory, or quick appreciation note... (Max 140 letters)"
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent resize-none placeholder:text-zinc-600 leading-relaxed font-medium"
                    autoFocus
                  />
                  <div className="text-right text-[10px] text-text-dim/60">
                    {inputText.length}/140 letters
                  </div>
                </div>

                {/* Sender select */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                    Who Is Posting This?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Milli 🤍', 'Fix 🤍', 'Us 🤍'] as const).map((person) => (
                      <button
                        key={person}
                        type="button"
                        onClick={() => setSender(person)}
                        className={`py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                          sender === person
                            ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(255,45,85,0.15)]'
                            : 'bg-black/30 border-white/5 text-text-dim hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color theme selectors */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                    Pick Paper Style
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-7 h-7 rounded-full border transition-all relative cursor-pointer ${
                          color.value.split(' ')[0] // color base name
                        } ${selectedColor === color.value ? 'scale-110 ring-2 ring-accent border-white/40' : 'border-white/15'}`}
                        title={color.name}
                      >
                        {selectedColor === color.value && (
                          <Check className="w-3.5 h-3.5 absolute inset-0 m-auto text-white contrast-150 drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit controls */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 border border-white/10 rounded font-bold text-xs uppercase tracking-wider text-text-dim hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostNote}
                    disabled={!inputText.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded bg-accent text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? 'Modify' : 'Post Note 🤍'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
