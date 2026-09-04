import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Plus, Trash2, Send, ExternalLink, Play, Pause, 
  Mic, Square, RotateCcw, Youtube, Disc, Heart, Sparkles, 
  Volume2, Share2, Copy, Check, Filter, MessageSquareHeart, Radio
} from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface MediaDedication {
  id: string;
  songTitle: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  sticker: string;
  type?: 'link' | 'voice' | 'text';
  linkUrl?: string;
  thumbnailUrl?: string;
  audioData?: string;
  audioDuration?: number;
  mediaPlatform?: 'youtube' | 'spotify' | 'other';
}

const DEFAULT_DEDICATIONS: MediaDedication[] = [
  {
    id: 'ded-default-1',
    songTitle: 'Lover — Taylor Swift',
    from: 'Sbu 🤍',
    to: 'Milli 🤍',
    message: 'Can I go where you go? Can we always be this close forever and ever? My heart beats for you everyday.',
    timestamp: '18 Jan 2026',
    sticker: 'heart',
    type: 'link',
    linkUrl: 'https://open.spotify.com/track/1r9xUipOqo4mfgg00qeyAb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
    mediaPlatform: 'spotify'
  },
  {
    id: 'ded-default-2',
    songTitle: 'Until I Found You — Stephen Sanchez',
    from: 'Milli 🤍',
    to: 'Sbu 🤍',
    message: 'I used to say I would never fall in love until I found you. You are the safest and sweetest person in my universe.',
    timestamp: '14 Feb 2026',
    sticker: 'rose',
    type: 'link',
    linkUrl: 'https://www.youtube.com/watch?v=GxldQ9eX2wo',
    thumbnailUrl: 'https://img.youtube.com/vi/GxldQ9eX2wo/hqdefault.jpg',
    mediaPlatform: 'youtube'
  },
  {
    id: 'ded-default-3',
    songTitle: 'A Thousand Years — Christina Perri',
    from: 'Sbu 🤍',
    to: 'Milli 🤍',
    message: 'I have loved you for a thousand years, and I will love you for a thousand more. You make ordinary moments feel cinematic.',
    timestamp: '20 Jul 2026',
    sticker: 'star',
    type: 'text',
    mediaPlatform: 'other'
  }
];

// Helper to extract YouTube video ID
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

// Helper to identify platform
export function detectPlatform(url: string): 'youtube' | 'spotify' | 'other' {
  if (!url) return 'other';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  return 'other';
}

interface TrackDedicationsProps {
  currentUserProfile?: string;
}

export default function TrackDedications({ currentUserProfile }: TrackDedicationsProps) {
  const [dedications, setDedications] = useState<MediaDedication[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'link' | 'voice' | 'text'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickLinkInput, setQuickLinkInput] = useState('');

  // Active voice player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const activeVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Form states for creation modal
  const [dedType, setDedType] = useState<'link' | 'voice' | 'text'>('link');
  const [songTitle, setSongTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [detectedThumbnail, setDetectedThumbnail] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<'youtube' | 'spotify' | 'other'>('youtube');
  const [message, setMessage] = useState('');
  const [fromUser, setFromUser] = useState<'Sbu 🤍' | 'Milli 🤍'>('Sbu 🤍');
  const [toUser, setToUser] = useState<'Milli 🤍' | 'Sbu 🤍'>('Milli 🤍');
  const [sticker, setSticker] = useState<string>('heart');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize profile default
  useEffect(() => {
    if (currentUserProfile === 'Girlfriend') {
      setFromUser('Milli 🤍');
      setToUser('Sbu 🤍');
    } else if (currentUserProfile === 'Boyfriend') {
      setFromUser('Sbu 🤍');
      setToUser('Milli 🤍');
    }
  }, [currentUserProfile]);

  // Real-time Firestore sync (Dynamic user-provided entries)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'song_dedications'), (snapshot) => {
      const fetched: MediaDedication[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      // Sort newest on top
      fetched.sort((a, b) => {
        const idA = Number(a.id.replace('ded-', '')) || 0;
        const idB = Number(b.id.replace('ded-', '')) || 0;
        return idB - idA;
      });

      setDedications(fetched);
    }, (error) => {
      console.warn("Error loading song dedications:", error);
      handleFirestoreError(error, OperationType.GET, 'song_dedications');
    });

    return () => unsub();
  }, []);

  // Detect link changes to auto-generate thumbnail
  useEffect(() => {
    if (!linkUrl.trim()) {
      setDetectedThumbnail(null);
      return;
    }

    const platform = detectPlatform(linkUrl);
    setDetectedPlatform(platform);

    if (platform === 'youtube') {
      const videoId = extractYouTubeId(linkUrl);
      if (videoId) {
        setDetectedThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        if (!songTitle) {
          setSongTitle(`YouTube Dedication • ${videoId}`);
        }
      }
    } else if (platform === 'spotify') {
      // For Spotify, generate aesthetic high-fidelity card background
      setDetectedThumbnail('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80');
      if (!songTitle) {
        setSongTitle('Spotify Love Track 🎧');
      }
    } else {
      setDetectedThumbnail('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80');
    }
  }, [linkUrl]);

  // Voice recording handlers
  const startRecording = async () => {
    setRecordingError(null);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordedAudioDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access denied or error", err);
      setRecordingError("Microphone access is needed to record voice notes. Please allow permission.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordedAudioDuration(recordingTime);
    }
  };

  const togglePreviewAudio = () => {
    if (!previewAudioRef.current || !recordedAudioUrl) return;
    if (previewAudioPlaying) {
      previewAudioRef.current.pause();
      setPreviewAudioPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setPreviewAudioPlaying(true);
      }).catch(console.error);
    }
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Handle Form Submission
  const handleSaveDedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && dedType === 'text') return;
    if (dedType === 'link' && !linkUrl.trim()) return;
    if (dedType === 'voice' && !recordedAudioBlob) return;

    setIsSubmitting(true);
    const newId = `ded-${Date.now()}`;

    try {
      let audioBase64: string | undefined = undefined;
      if (dedType === 'voice' && recordedAudioBlob) {
        audioBase64 = await blobToBase64(recordedAudioBlob);
      }

      const newDed: MediaDedication = {
        id: newId,
        songTitle: songTitle.trim() || (dedType === 'voice' ? 'Sweet Voice Memo 🎙️' : 'Romantic Dedication 🤍'),
        from: fromUser,
        to: toUser,
        message: message.trim() || (dedType === 'voice' ? 'Listen to this special voice note just for you 🤍' : ''),
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        sticker,
        type: dedType,
        mediaPlatform: dedType === 'link' ? detectPlatform(linkUrl) : 'other'
      };

      if (dedType === 'link' && linkUrl.trim()) {
        newDed.linkUrl = linkUrl.trim();
        if (detectedThumbnail) {
          newDed.thumbnailUrl = detectedThumbnail;
        }
      }

      if (audioBase64) {
        newDed.audioData = audioBase64;
        newDed.audioDuration = recordedAudioDuration || 10;
      }

      await setDoc(doc(db, 'song_dedications', newId), newDed);

      // Reset form
      setIsModalOpen(false);
      setSongTitle('');
      setLinkUrl('');
      setMessage('');
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setRecordingTime(0);
      setRecordingError(null);
    } catch (error) {
      console.error("Failed to save dedication", error);
      handleFirestoreError(error, OperationType.WRITE, `song_dedications/${newId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Dedication
  const handleDeleteDedication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'song_dedications', id));
      setDedications(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `song_dedications/${id}`);
    }
  };

  // Handle clicking link -> takes to YouTube or Spotify
  const handleOpenLink = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Voice note inline player
  const handleToggleVoicePlayback = (ded: MediaDedication) => {
    if (!ded.audioData) return;

    if (playingVoiceId === ded.id) {
      if (activeVoiceAudioRef.current) {
        activeVoiceAudioRef.current.pause();
      }
      setPlayingVoiceId(null);
    } else {
      if (activeVoiceAudioRef.current) {
        activeVoiceAudioRef.current.pause();
      }
      const audio = new Audio(ded.audioData);
      activeVoiceAudioRef.current = audio;
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setVoiceProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setPlayingVoiceId(null);
        setVoiceProgress(0);
      };
      audio.play().then(() => {
        setPlayingVoiceId(ded.id);
      }).catch(console.error);
    }
  };

  // Handle Quick Link Insert
  const handleQuickInsert = () => {
    if (!quickLinkInput.trim()) {
      setDedType('link');
      setIsModalOpen(true);
      return;
    }
    const raw = quickLinkInput.trim();
    setDedType('link');
    setLinkUrl(raw);
    setQuickLinkInput('');
    setIsModalOpen(true);
  };

  // Optional starter tracks loader into Firestore
  const handleSeedStarterTracks = async () => {
    try {
      setIsSubmitting(true);
      for (const item of DEFAULT_DEDICATIONS) {
        await setDoc(doc(db, 'song_dedications', item.id), item);
      }
    } catch (e) {
      console.error("Error seeding starter tracks:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered dedications
  const filteredDedications = dedications.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'link') return d.type === 'link' || (!d.type && Boolean(d.linkUrl));
    if (activeFilter === 'voice') return d.type === 'voice' || Boolean(d.audioData);
    if (activeFilter === 'text') return d.type === 'text' || (!d.linkUrl && !d.audioData);
    return true;
  });

  return (
    <div className="py-16 md:py-28 px-4 sm:px-6 md:px-12 bg-bg-deep border-t border-border-subtle relative overflow-hidden" id="track-dedications">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-accent text-[10px] font-black uppercase tracking-[0.25em]">MilliSbu Soundstage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Track & Media Dedications 💌
            </h2>
            <p className="text-text-dim text-xs md:text-sm leading-relaxed">
              Dedicate your favorite Spotify anthems, YouTube videos, heartfelt voice recordings, and romantic letters. Click any media card to tune in directly!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setLinkUrl('');
                setSongTitle('');
                setMessage('');
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-full bg-accent text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-accent/20 hover:opacity-95 transition-all cursor-pointer"
              id="dedicate-media-btn"
            >
              <Plus className="w-4 h-4" />
              Dedicate Media / Track
            </motion.button>
          </div>
        </div>

        {/* Dedicated Quick Link Inserter Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1.5 text-zinc-400 pointer-events-none">
              <Youtube className="w-4 h-4 text-red-500" />
              <span className="text-zinc-600 text-xs">/</span>
              <Disc className="w-4 h-4 text-[#1DB954]" />
            </div>
            <input
              type="url"
              placeholder="Insert your own Spotify or YouTube link here (e.g., https://open.spotify.com/track/... or https://youtu.be/...)"
              value={quickLinkInput}
              onChange={(e) => setQuickLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickInsert();
              }}
              className="w-full pl-20 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent transition-all"
            />
          </div>
          <button
            onClick={handleQuickInsert}
            className="w-full sm:w-auto px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-lg shadow-accent/25"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Link</span>
          </button>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Dedications', icon: Sparkles, count: dedications.length },
              { id: 'link', label: 'Spotify & YouTube', icon: Music, count: dedications.filter(d => d.type === 'link' || Boolean(d.linkUrl)).length },
              { id: 'voice', label: 'Voice Notes', icon: Mic, count: dedications.filter(d => d.type === 'voice' || Boolean(d.audioData)).length },
              { id: 'text', label: 'Heartfelt Letters', icon: MessageSquareHeart, count: dedications.filter(d => d.type === 'text' || (!d.linkUrl && !d.audioData)).length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-white/10 text-white border-accent shadow-sm'
                      : 'bg-black/30 text-text-dim border-white/5 hover:text-white hover:border-white/15'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'opacity-60'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-accent/20 text-accent font-black' : 'bg-white/5 text-zinc-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-zinc-500 font-medium">
            Showing {filteredDedications.length} shared memory {filteredDedications.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {/* Grid of Dedication Cards */}
        {filteredDedications.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-4 bg-zinc-950/60 border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
              <Music className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-lg font-black text-white">No dedications yet</h3>
            <p className="text-xs text-text-dim max-w-md mx-auto leading-relaxed">
              This space is completely yours! Paste your favorite Spotify tracks or YouTube video links in the bar above, or record a voice note for each other.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setLinkUrl('');
                  setSongTitle('');
                  setMessage('');
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-accent text-white rounded-full text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20"
              >
                Insert Custom Link / Dedication
              </button>
              <button
                onClick={handleSeedStarterTracks}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {isSubmitting ? "Loading..." : "Load Starter Examples"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDedications.map((ded) => {
                const isLink = ded.type === 'link' || Boolean(ded.linkUrl);
                const isVoice = ded.type === 'voice' || Boolean(ded.audioData);
                const isPlayingThisVoice = playingVoiceId === ded.id;
                const platform = ded.mediaPlatform || detectPlatform(ded.linkUrl || '');

                return (
                  <motion.div
                    layout
                    key={ded.id}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-zinc-950/70 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* MEDIA LINK CARD WITH THUMBNAIL (YOUTUBE / SPOTIFY) */}
                      {isLink && ded.thumbnailUrl && (
                        <div 
                          className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer group/thumb"
                          onClick={() => handleOpenLink(ded.linkUrl)}
                        >
                          <img 
                            src={ded.thumbnailUrl} 
                            alt={ded.songTitle} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/20" />

                          {/* Platform Badge (YouTube or Spotify) */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
                            {platform === 'youtube' ? (
                              <span className="bg-red-600 text-white flex items-center gap-1 px-2 py-0.5 rounded-full">
                                <Youtube className="w-3.5 h-3.5 fill-current" /> YouTube
                              </span>
                            ) : platform === 'spotify' ? (
                              <span className="bg-[#1DB954] text-black font-black flex items-center gap-1 px-2 py-0.5 rounded-full">
                                <Disc className="w-3.5 h-3.5" /> Spotify
                              </span>
                            ) : (
                              <span className="bg-accent text-white flex items-center gap-1 px-2 py-0.5 rounded-full">
                                <Music className="w-3.5 h-3.5" /> Media Track
                              </span>
                            )}
                          </div>

                          {/* Hover Play / Open Pill */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                            <div className="px-4 py-2 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl scale-95 group-hover/thumb:scale-100 transition-transform">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open in {platform === 'youtube' ? 'YouTube' : platform === 'spotify' ? 'Spotify' : 'Player'} ↗</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VOICE NOTE HEADER BANNER */}
                      {isVoice && (
                        <div className="p-4 bg-linear-to-r from-accent/20 via-pink-600/15 to-violet-700/20 border-b border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-accent/30 border border-accent/40 flex items-center justify-center text-accent">
                              <Mic className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-accent block">Voice Note Memo</span>
                              <span className="text-xs font-bold text-white">Audio Recording</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleVoicePlayback(ded)}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title={isPlayingThisVoice ? "Pause" : "Play Voice Note"}
                          >
                            {isPlayingThisVoice ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                        </div>
                      )}

                      {/* CARD CONTENT BODY */}
                      <div className="p-5 space-y-4">
                        {/* Title & Sticker */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-white tracking-tight group-hover:text-accent transition-colors">
                              {ded.songTitle}
                            </h4>
                            {ded.linkUrl && (
                              <button
                                onClick={() => handleOpenLink(ded.linkUrl)}
                                className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{ded.linkUrl}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Romantic Sticker */}
                          <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-sm shrink-0 shadow-inner">
                            {ded.sticker === 'heart' && '❤️'}
                            {ded.sticker === 'star' && '⭐️'}
                            {ded.sticker === 'rose' && '🌹'}
                            {ded.sticker === 'fire' && '🔥'}
                            {ded.sticker === 'music' && '🎵'}
                            {ded.sticker === 'love' && '💌'}
                          </div>
                        </div>

                        {/* Voice Note Audio Waveform / Scrubber */}
                        {isVoice && (
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span>🎙️ Recorded Message</span>
                              <span>{ded.audioDuration ? `${Math.floor(ded.audioDuration)}s` : 'Voice'}</span>
                            </div>

                            {/* Equalizer Visualizer */}
                            <div className="flex items-center gap-1 h-6">
                              {[40, 70, 30, 90, 60, 80, 50, 95, 45, 75, 60, 35, 85, 55, 65, 40].map((h, i) => (
                                <motion.div
                                  key={i}
                                  animate={isPlayingThisVoice ? { height: [`${Math.max(15, h * 0.3)}%`, `${h}%`, `${Math.max(15, h * 0.4)}%`] } : { height: `${h * 0.35}%` }}
                                  transition={isPlayingThisVoice ? { repeat: Infinity, duration: 0.6 + (i % 4) * 0.15 } : { duration: 0.2 }}
                                  className={`flex-1 rounded-full ${isPlayingThisVoice ? 'bg-accent' : 'bg-white/20'}`}
                                />
                              ))}
                            </div>

                            {isPlayingThisVoice && (
                              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div className="bg-accent h-full transition-all duration-100" style={{ width: `${voiceProgress}%` }} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Personal Dedication Message */}
                        {ded.message && (
                          <p className="text-xs text-text-dim italic leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5">
                            "{ded.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CARD FOOTER INFO & ACTIONS */}
                    <div className="px-5 py-3.5 border-t border-white/5 bg-black/40 flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1.5 text-text-dim">
                        <span className="text-white font-black">{ded.from}</span>
                        <span>➔</span>
                        <span className="text-white font-black">{ded.to}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono text-[9px]">{ded.timestamp}</span>

                        {ded.linkUrl && (
                          <button
                            onClick={() => handleOpenLink(ded.linkUrl)}
                            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Open link in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteDedication(ded.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer opacity-40 hover:opacity-100"
                          title="Delete dedication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* CREATE DEDICATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
              id="dedication-creator-modal"
            >
              {/* Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-black text-[9px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> New Media Dedication
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Dedicate to Your Partner 🤍</h3>
                <p className="text-xs text-text-dim">
                  Choose Spotify, YouTube, record your live voice, or write a love note.
                </p>
              </div>

              {/* Type Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                {[
                  { id: 'link', label: 'Spotify / YouTube', icon: Music },
                  { id: 'voice', label: 'Voice Note', icon: Mic },
                  { id: 'text', label: 'Normal Text', icon: MessageSquareHeart },
                ].map(t => {
                  const Icon = t.icon;
                  const isSel = dedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDedType(t.id as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSel 
                          ? 'bg-accent text-white shadow-md' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] tracking-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSaveDedication} className="space-y-4">
                {/* TAB 1: SPOTIFY / YOUTUBE LINK */}
                {dedType === 'link' && (
                  <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                        Spotify / YouTube Link
                      </label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://open.spotify.com/track/... or https://youtu.be/..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>

                    {/* Live Thumbnail Preview */}
                    {detectedThumbnail && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                          Auto-Detected Media Thumbnail
                        </span>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/60 max-h-36">
                          <img 
                            src={detectedThumbnail} 
                            alt="Media Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2">
                            {detectedPlatform === 'youtube' ? (
                              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Youtube className="w-3 h-3 fill-current" /> YouTube Video
                              </span>
                            ) : detectedPlatform === 'spotify' ? (
                              <span className="bg-[#1DB954] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Disc className="w-3 h-3" /> Spotify Track
                              </span>
                            ) : (
                              <span className="bg-accent text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                Media Link
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                        Song Title / Video Caption
                      </label>
                      <input
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="e.g. Ed Sheeran - Perfect 🤍"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: VOICE RECORDING */}
                {dedType === 'voice' && (
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-4 text-center">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">Microphone Voice Memo</span>
                      <p className="text-[10px] text-text-dim">Record a personal greeting, audio letter, or sweet whisper.</p>
                    </div>

                    {recordingError && (
                      <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                        {recordingError}
                      </p>
                    )}

                    {/* Record Button & Timer */}
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center shadow-xl shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Mic className="w-7 h-7" />
                        </button>
                      ) : (
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="absolute inset-0 rounded-full bg-red-500"
                          />
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                          >
                            <Square className="w-6 h-6 fill-current" />
                          </button>
                        </div>
                      )}

                      <div className="font-mono text-sm font-black text-white">
                        {isRecording ? (
                          <span className="text-red-400 animate-pulse">Recording: {recordingTime}s / 60s</span>
                        ) : recordedAudioBlob ? (
                          <span className="text-emerald-400">Audio Recorded ({recordedAudioDuration}s)</span>
                        ) : (
                          <span className="text-zinc-500">Tap to start recording</span>
                        )}
                      </div>
                    </div>

                    {/* Playback Preview */}
                    {recordedAudioUrl && (
                      <div className="p-3 bg-zinc-900 rounded-lg border border-white/10 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={togglePreviewAudio}
                          className="flex items-center gap-2 text-xs font-bold text-white hover:text-accent cursor-pointer"
                        >
                          {previewAudioPlaying ? <Pause className="w-4 h-4 text-accent" /> : <Play className="w-4 h-4 text-accent" />}
                          <span>Listen to Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={startRecording}
                          className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Re-record
                        </button>

                        <audio ref={previewAudioRef} src={recordedAudioUrl} onEnded={() => setPreviewAudioPlaying(false)} className="hidden" />
                      </div>
                    )}

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                        Voice Memo Title
                      </label>
                      <input
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="e.g. Good morning love letter ☕"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: NORMAL TEXT DEDICATION */}
                {dedType === 'text' && (
                  <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                        Dedication Title / Song Name
                      </label>
                      <input
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="e.g. Can't Help Falling in Love"
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* SHARED FIELDS: SENDER / RECIPIENT */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">From</label>
                    <select
                      value={fromUser}
                      onChange={(e) => setFromUser(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
                    >
                      <option value="Sbu 🤍">Sbu 🤍</option>
                      <option value="Milli 🤍">Milli 🤍</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">To</label>
                    <select
                      value={toUser}
                      onChange={(e) => setToUser(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
                    >
                      <option value="Milli 🤍">Milli 🤍</option>
                      <option value="Sbu 🤍">Sbu 🤍</option>
                    </select>
                  </div>
                </div>

                {/* Sticker Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Sticker Badge</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { id: 'heart', emoji: '❤️', label: 'love' },
                      { id: 'star', emoji: '⭐️', label: 'star' },
                      { id: 'rose', emoji: '🌹', label: 'rose' },
                      { id: 'fire', emoji: '🔥', label: 'fire' },
                      { id: 'music', emoji: '🎵', label: 'song' },
                      { id: 'love', emoji: '💌', label: 'letter' },
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSticker(st.id)}
                        className={`py-2 rounded-lg border text-base flex flex-col items-center justify-center transition-all cursor-pointer ${
                          sticker === st.id 
                            ? 'bg-accent/20 border-accent text-accent scale-105 shadow-sm' 
                            : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span>{st.emoji}</span>
                        <span className="text-[8px] uppercase tracking-wider opacity-60 mt-0.5">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appreciation Note Message */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                    Personal Message / Letter
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a sweet reason why you're dedicating this to your partner..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || (dedType === 'voice' && !recordedAudioBlob)}
                    className="px-6 py-2.5 rounded-lg bg-accent text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-accent/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting...' : 'Publish Dedication'}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
