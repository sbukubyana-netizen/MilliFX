import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Trash2, Edit2, Check, X, Mic, Square, Play, Pause, Volume2, Upload, AlertCircle, Music } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface StickyNote {
  id: string;
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  sender: 'Milli 🤍' | 'Sbu 🤍';
  color: string;
  createdAt: string;
  tilt: number;
}

const PRESET_NOTES: StickyNote[] = [
  {
    id: 'preset-1',
    text: "Thank you for always putting a huge smile on my face! You are my absolute favorite routine 🤍",
    sender: "Sbu 🤍",
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
    sender: "Sbu 🤍",
    color: 'bg-violet-500/10 border-violet-500/30 text-violet-200',
    createdAt: '01 May 2026',
    tilt: -1
  },
  {
    id: 'preset-4',
    text: "I hope you have clicked around the MilliSbu app and found all the sweet surprises hidden for you! 😍",
    sender: "Sbu 🤍",
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

// Helper to convert audio files to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to calculate audio file duration safely
const getAudioDurationFile = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      resolve(0); // fallback if metadata fails
    });
  });
};

/* ==========================================
   POLISHED RESPONSIVE AUDIO PLAYER
   ========================================== */
function LoveNoteAudioPlayer({ audioUrl, duration }: { audioUrl: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(audioUrl);
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const curr = audioRef.current.currentTime;
        setCurrentTime(curr);
        setProgress(duration > 0 ? (curr / duration) * 100 : 0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioUrl, duration]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card container link trigger
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error('Audio play failed', err));
      setIsPlaying(true);
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = Math.max(0, Math.min(1, clickX / width));
    audioRef.current.currentTime = newPercentage * duration;
    setProgress(newPercentage * 100);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full mt-2 bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center gap-3 select-none">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-accent/20 hover:bg-accent/40 text-accent flex items-center justify-center shrink-0 transition-all cursor-pointer border border-accent/20"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current text-white shrink-0" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current text-white ml-0.5 shrink-0" />
        )}
      </button>

      <div className="flex-1 space-y-1 overflow-hidden min-w-0">
        {/* Progress scrub */}
        <div 
          onClick={handleProgressChange} 
          className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
        >
          <div 
            className="absolute top-0 left-0 h-full bg-accent transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-white/50 tracking-wider">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 text-accent/60" />
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   MAIN LOVE NOTES BOARD COMPONENT
   ========================================== */
export default function LoveNotesBoard() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Note Form State
  const [inputText, setInputText] = useState('');
  const [sender, setSender] = useState<'Milli 🤍' | 'Sbu 🤍'>('Sbu 🤍');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  // Audio Recording / Upload State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [tempAudioBase64, setTempAudioBase64] = useState<string | null>(null);
  const [tempAudioDuration, setTempAudioDuration] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const recorderRef = useRef<any | null>(null);
  const recordingTimerRef = useRef<any | null>(null);

  // Firestore Real-time Sync with Seeding Fallback
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'love_notes'), (snapshot) => {
      const fetchedNotes: StickyNote[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push(doc.data() as StickyNote);
      });

      // If the firestore collections are completely empty, pre-populate them
      if (snapshot.empty) {
        PRESET_NOTES.forEach(async (preset) => {
          try {
            await setDoc(doc(db, 'love_notes', preset.id), preset);
          } catch (e) {
            console.error('Failed to seed preset sticky notes database:', e);
          }
        });
        setNotes(PRESET_NOTES);
        return;
      }
      
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

  // Timer updater for live voice recording
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Audio recorder start
  const startRecording = async () => {
    setUploadError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setUploadError('Your browser does not support audio recording tools.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Calculate dynamic duration via temporary audio object
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        let duration = 0;
        
        await new Promise<void>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            duration = audio.duration;
            resolve();
          });
          audio.addEventListener('error', () => {
            resolve();
          });
          setTimeout(resolve, 600); // safety fallback limit
        });

        // Convert the blob sound file to base64 encoding
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setTempAudioBase64(base64data);
          // Standard fallback to recorded time if audio player metadata fails
          setTempAudioDuration(duration > 0 ? duration : recordingSeconds);
        };

        // Shut down tracks immediately to release the microphone device
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordingSeconds(0);
      mediaRecorder.start();
      recorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
      setUploadError('Microphone permission is required to record a live note.');
    }
  };

  // Audio recorder stop
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Handle uploaded files selectively with highly robust extension checks
  const handleAudioUpload = async (file: File) => {
    setUploadError(null);
    
    const isAudioMime = file.type.startsWith('audio/');
    const hasAudioExt = /\.(mp3|wav|m4a|ogg|aac|webm|mp4)$/i.test(file.name);

    if (!isAudioMime && !hasAudioExt) {
      setUploadError('Please choose or drop a valid audio music/voice file (MP3, WAV, M4A, etc.).');
      return;
    }

    // Direct proactive validation: protect Firestore limit (max 1MB per document, so limit binary base64 to 800KB)
    if (file.size > 800000) {
      setUploadError(`Audio file is too large (${(file.size / 1024).toFixed(0)}KB). Because database sticky notes are limited to 1MB, please choose an audio file smaller than 800KB!`);
      return;
    }

    try {
      const duration = await getAudioDurationFile(file);
      if (duration > 30.5) {
        setUploadError(`Up to 30s messages allowed only. Uploaded audio belongs to a file of ${duration.toFixed(1)}s.`);
        return;
      }

      const base64Str = await convertFileToBase64(file);
      setTempAudioBase64(base64Str);
      setTempAudioDuration(duration > 0 ? duration : 3); // realistic default if metadata load fails
    } catch (err) {
      console.error('Process upload failure:', err);
      setUploadError('Could not process this audio track.');
    }
  };

  const handlePostNote = async () => {
    if (!inputText.trim() && !tempAudioBase64) return;

    if (editingId) {
      // Modify existing note in Firestore
      const originalNote = notes.find(n => n.id === editingId);
      const updatedNote: StickyNote = {
        id: editingId,
        sender,
        color: selectedColor,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tilt: originalNote ? originalNote.tilt : (Math.random() * 6 - 3)
      };

      if (inputText.trim()) {
        updatedNote.text = inputText;
      }
      if (tempAudioBase64) {
        updatedNote.audioUrl = tempAudioBase64;
        updatedNote.audioDuration = tempAudioDuration || 0;
      }

      // Optimistic local update so UI updates immediately
      setNotes(prev => prev.map(n => n.id === editingId ? updatedNote : n));
      // Close editor immediately to feel instantaneous
      setEditingId(null);
      setIsAdding(false);

      try {
        await setDoc(doc(db, 'love_notes', editingId), updatedNote);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `love_notes/${editingId}`);
      }
    } else {
      // Create a brand new note in Firestore
      const newId = `note-${Date.now()}`;
      const newNote: StickyNote = {
        id: newId,
        sender,
        color: selectedColor,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tilt: Math.random() * 6 - 3
      };

      if (inputText.trim()) {
        newNote.text = inputText;
      }
      if (tempAudioBase64) {
        newNote.audioUrl = tempAudioBase64;
        newNote.audioDuration = tempAudioDuration || 0;
      }

      // Optimistic local update so UI updates immediately
      setNotes(prev => [newNote, ...prev]);
      // Close editor immediately to feel instantaneous
      setIsAdding(false);

      try {
        await setDoc(doc(db, 'love_notes', newId), newNote);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `love_notes/${newId}`);
      }
    }

    // Reset All State
    setInputText('');
    setTempAudioBase64(null);
    setTempAudioDuration(null);
    setUploadError(null);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic local update
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      await deleteDoc(doc(db, 'love_notes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `love_notes/${id}`);
    }
  };

  const handleStartEdit = (note: StickyNote, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(note.id);
    setInputText(note.text || '');
    setSender(note.sender);
    setSelectedColor(note.color);
    setTempAudioBase64(note.audioUrl || null);
    setTempAudioDuration(note.audioDuration || null);
    setUploadError(null);
    setIsAdding(true);
  };

  const canSubmit = inputText.trim() !== '' || tempAudioBase64 !== null;

  return (
    <div className="py-24 px-6 md:px-12 bg-bg-deep border-t border-border-subtle relative overflow-hidden" id="love-notes-board">
      {/* Decorative Blur Backings */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent fill-accent animate-pulse" />
              <span className="text-accent font-black uppercase tracking-[0.3em] text-xs md:text-sm shrink-0">
                The Cozy Corner
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter breakdown-words">
              Our Messages Jar
            </h2>
            <p className="text-text-dim text-xs md:text-sm max-w-xl">
              Pin a sweet note, leaves a recorded voice memo, write an inside joke, or commit a tiny romantic promise. Completely persistent & beautiful forever 🤍
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingId(null);
              setInputText('');
              setTempAudioBase64(null);
              setTempAudioDuration(null);
              setUploadError(null);
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
                The Message Jar is empty! Be the first to post a sweet note or voice memory using the button above.
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
                    className={`relative p-6 rounded-xl border backdrop-blur-md shadow-lg flex flex-col justify-between min-h-[190px] transition-all duration-300 ${note.color} pointer-events-auto group w-full`}
                    id={`sticky-${note.id}`}
                  >
                    {/* Push Pin effect */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent/40 border border-white/20 shadow-inner" />
                    
                    <div className="space-y-4 pt-4 min-w-0 w-full flex-1">
                      {/* Text Note Content */}
                      {note.text && (
                        <p className="text-xs sm:text-sm font-medium tracking-tight leading-relaxed italic pr-2 break-words">
                          "{note.text}"
                        </p>
                      )}

                      {/* Optional Voice Memo subplayer */}
                      {note.audioUrl && (
                        <div className="space-y-1.5 w-full">
                          <span className="text-[9px] font-black uppercase text-accent tracking-widest flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" /> Voice memory
                          </span>
                          <LoveNoteAudioPlayer audioUrl={note.audioUrl} duration={note.audioDuration || 0} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-[10px] uppercase font-bold tracking-wider text-text-dim/80 w-full">
                      <div className="truncate min-w-0 flex items-center pr-1">
                        <span className="text-text-main font-black lowercase truncate">{note.sender}</span>
                        <span className="mx-1 border-r border-white/10 h-3 shrink-0" />
                        <span className="shrink-0">{note.createdAt}</span>
                      </div>
                      
                      {/* Mini action triggers */}
                      <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

      {/* Editor Modal custom overlay form */}
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
              className="relative bg-bg-deep border border-white/10 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl z-10 mx-auto"
              id="sticky-note-editor"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 text-text-dim hover:text-white rounded-full p-1.5 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {editingId ? 'Edit Your Note' : 'New Leaf From The Jar'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {editingId ? 'Modify Message' : 'Write Sweet Message'}
                </h3>
              </div>

              {/* Message form modules */}
              <div className="space-y-5">
                
                {/* Module 1: Handwriting Text */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                    Your True Written Message (Optional)
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={140}
                    placeholder="Write a sweet reason, date night memory, or quick appreciation note... (Max 140 letters)"
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent resize-none placeholder:text-zinc-600 leading-relaxed font-medium"
                    autoFocus
                  />
                  <div className="text-right text-[10px] text-text-dim/60">
                    {inputText.length}/140 letters
                  </div>
                </div>

                {/* Module 2: Voice Note Recording and Upload */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                      Voice Message memory (Optional, Max 30s)
                    </label>
                    {tempAudioBase64 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempAudioBase64(null);
                          setTempAudioDuration(null);
                          setUploadError(null);
                        }}
                        className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Voice
                      </button>
                    )}
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/25 rounded-md text-[11px] text-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="leading-snug">{uploadError}</span>
                    </div>
                  )}

                  {!tempAudioBase64 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      {/* Live Recorder Button */}
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-full py-4.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isRecording
                            ? 'bg-red-500/10 border-red-500/40 text-red-200 animate-pulse'
                            : 'bg-black/30 border-white/10 text-text-dim hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4.5 h-4.5 text-red-500 fill-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Stop Recording ({recordingSeconds}s/30s)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4.5 h-4.5 text-accent animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Record Live Voice</span>
                          </>
                        )}
                      </button>

                      {/* File Uploader Drag and Drop Zone */}
                      <div
                        onDragEnter={() => setDragActive(true)}
                        onDragLeave={() => setDragActive(false)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActive(true);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            await handleAudioUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative w-full py-4.5 rounded-xl border border-dashed text-text-dim flex flex-col items-center justify-center gap-2 transition-all group ${
                          dragActive 
                            ? 'border-accent bg-accent/5 text-white scale-[1.02]' 
                            : 'border-white/10 bg-black/30 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              await handleAudioUpload(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Upload audio file"
                        />
                        <Upload className="w-4.5 h-4.5 text-violet-400 group-hover:translate-y-[-2px] transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Upload / Drag Audio</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5 w-full">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-[#ff2d55] uppercase tracking-widest flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Voice Memory Captured
                        </span>
                        <span className="font-mono text-zinc-400 font-bold">
                          {tempAudioDuration ? `${tempAudioDuration.toFixed(1)}s` : '3s'} / 30s max
                        </span>
                      </div>
                      
                      {/* Preview Player */}
                      <LoveNoteAudioPlayer audioUrl={tempAudioBase64} duration={tempAudioDuration || 0} />
                    </div>
                  )}
                </div>

                {/* Module 3: Who Is Posting This? */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <label className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                    Who Is Posting This?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Milli 🤍', 'Sbu 🤍'] as const).map((person) => (
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

                {/* Module 4: Pick Paper Style */}
                <div className="space-y-2 border-t border-white/5 pt-4 font-normal">
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
                          color.value.split(' ')[0]
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

                {/* Submit Controls block */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5 w-full">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2.5 border border-white/10 rounded font-bold text-xs uppercase tracking-wider text-text-dim hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostNote}
                    disabled={!canSubmit}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-accent text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? 'Modify Note' : 'Post Note 🤍'}
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
