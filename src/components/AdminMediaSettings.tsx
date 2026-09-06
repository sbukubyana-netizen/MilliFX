import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Video, Image as ImageIcon, Settings, Sparkles, Check, HelpCircle, Upload, Film, Edit, RefreshCw, User, Play, Pause, Zap, HardDrive, CheckCircle2, FolderPlus, Folder, Tag, Layers, Edit3, Clapperboard, LayoutGrid, List, Search, ChevronDown } from 'lucide-react';
import { collection, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestoreData } from '../firebase';
import { Episode, Memory, CATEGORIES, CustomCategory } from '../constants';
import { purgeAllCacheData, CachePurgeResult } from '../utils/cacheManager';
import { expandMediaUrls } from '../utils/urlExpander';
import AdminCreditsSettings from './AdminCreditsSettings';

interface AdminMediaSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  allEpisodes: Episode[];
  selectedProfile: 'Girlfriend' | 'Boyfriend' | 'Us';
  initialTab?: 'create' | 'edit' | 'categories' | 'daily_notes' | 'studio_config' | 'cache_speed' | 'credits_config';
  studioSettings: {
    trailerVideoUrl: string;
    boyfriendProfileImage: string;
    girlfriendProfileImage: string;
    usProfileImage?: string;
    bannerVideos: string[];
    boyfriendBannerVideos?: string[];
    girlfriendBannerVideos?: string[];
    usBannerVideos?: string[];
    backgroundSoundEnabled?: boolean;
    colorTheme?: string;
  };
  onUpdateStudioSettings: (settings: {
    trailerVideoUrl: string;
    boyfriendProfileImage: string;
    girlfriendProfileImage: string;
    usProfileImage: string;
    bannerVideos: string[];
    boyfriendBannerVideos: string[];
    girlfriendBannerVideos: string[];
    usBannerVideos: string[];
    backgroundSoundEnabled: boolean;
    colorTheme: string;
  }) => Promise<void>;
}

const PRESET_COVERS = [
  { name: 'Romantic Sunset', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Golden Hour Sparkle', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cozy Fireplace', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
  { name: 'Night Under Stars', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80' },
];

// Reusable URL range sequence expansion logic (supports up to 10,000 items)
export function expandUrlsForPreview(text: string): string[] {
  return expandMediaUrls(text, 10000);
}

// Reusable Paginated Sequence Preview Grid Component (Scales smoothly up to 10,000 URLs)
function SequencePreviewGrid({ urlsText }: { urlsText: string }) {
  const expandedUrls = useMemo(() => expandUrlsForPreview(urlsText), [urlsText]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState('');
  const itemsPerPage = 24;
  
  if (expandedUrls.length === 0) {
    return (
      <div className="p-4 border border-dashed border-white/5 bg-black/20 rounded-xl text-center text-zinc-500 text-[11px] font-medium">
        No links entered yet to preview
      </div>
    );
  }

  const totalPages = Math.ceil(expandedUrls.length / itemsPerPage);
  
  // Reset page if it exceeds total pages due to updates
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [expandedUrls.length, totalPages, currentPage]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpInput('');
    }
  };

  const displayedUrls = expandedUrls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 space-y-3 transition-all animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase text-accent tracking-widest">
            Sequence Verification Grid
          </span>
          <span className="text-[9px] bg-accent/20 text-accent px-2 py-0.5 rounded font-mono font-black uppercase tracking-wider">
            {expandedUrls.length.toLocaleString()} Expanded Link{expandedUrls.length > 1 ? 's' : ''}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="text-[9px] font-bold px-1.5 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="First Page"
            >
              &laquo;
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="text-[9px] font-bold px-2 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="text-[9px] text-zinc-400 font-mono px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="text-[9px] font-bold px-2 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
            >
              Next
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="text-[9px] font-bold px-1.5 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="Last Page"
            >
              &raquo;
            </button>

            {/* Quick jump */}
            {totalPages > 5 && (
              <form onSubmit={handleJump} className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Go to"
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  className="w-12 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[9px] font-mono text-center text-white focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="text-[9px] px-1.5 py-0.5 bg-accent text-white rounded font-bold hover:opacity-90 cursor-pointer"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[260px] overflow-y-auto pr-1">
        {displayedUrls.map((url, index) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
          const isVideo = url.toLowerCase().endsWith('.mp4') || url.includes('video') || url.startsWith('data:video');
          const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
          
          return (
            <div key={globalIndex} className="bg-zinc-900/60 border border-white/5 rounded-lg overflow-hidden flex flex-col h-24 relative group/item hover:border-accent/30 transition-all">
              <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                <span className="absolute top-1 left-1 z-10 text-[8px] bg-black/85 text-zinc-300 px-1 py-0.5 rounded font-mono font-bold">
                  #{globalIndex}
                </span>
                
                {isYouTube ? (
                  <div className="flex flex-col items-center justify-center text-red-500 gap-1">
                    <Film className="w-5 h-5 animate-pulse" />
                    <span className="font-black uppercase tracking-widest text-[6px] text-zinc-500">YOUTUBE</span>
                  </div>
                ) : isVideo ? (
                  <div className="w-full h-full relative">
                    <video 
                      src={url} 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="flex flex-col items-center justify-center text-accent/80 gap-1 w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7h4"/><path d="M3 13h4"/><path d="M3 17h4"/><path d="M17 17h4"/><path d="M17 13h4"/><path d="M17 7h4"/></svg><span class="text-[6px] text-zinc-500 font-bold uppercase truncate max-w-[80px]">MP4 Asset</span></div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <img 
                    src={url} 
                    alt={`Preview ${globalIndex}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="flex flex-col items-center justify-center text-zinc-600 gap-1 w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[6px] text-zinc-500 font-bold uppercase truncate max-w-[80px]">Image Asset</span></div>`;
                      }
                    }}
                  />
                )}
              </div>
              <div className="p-1 bg-zinc-950 border-t border-white/5 flex items-center min-w-0">
                <span className="text-[7px] font-mono text-zinc-400 truncate w-full block text-center" title={url}>
                  {url.substring(url.lastIndexOf('/') + 1) || url}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminMediaSettings({ 
  isOpen, 
  onClose, 
  onSuccess, 
  allEpisodes, 
  selectedProfile,
  initialTab,
  studioSettings,
  onUpdateStudioSettings
}: AdminMediaSettingsProps) {
  // Current Active Menu Section/Tab
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'categories' | 'daily_notes' | 'studio_config' | 'cache_speed' | 'credits_config'>(initialTab || 'create');
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handler = () => setActiveTab('credits_config');
    window.addEventListener('open_admin_credits_settings', handler);
    return () => window.removeEventListener('open_admin_credits_settings', handler);
  }, []);

  // Real-time custom categories from Firestore
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_categories'), (snapshot) => {
      const list: CustomCategory[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as CustomCategory);
      });
      setCustomCategories(list);
    }, (err) => {
      console.error('Error listening to custom_categories in Admin:', err);
    });
    return () => unsub();
  }, []);

  // Compute all available categories for creation, editing and management
  const allAvailableCategories = useMemo(() => {
    const base = CATEGORIES.filter(c => 
      c !== 'Global Top 10 in MilliSbu' && 
      c !== 'Continue Watching' && 
      c.toLowerCase() !== 'future watchlist' &&
      c !== 'Our Watchlist (Future Seasons)'
    );
    const created = customCategories.map(c => c.name.trim()).filter(Boolean);
    const fromEpisodes = allEpisodes
      .map(ep => ep.category?.trim())
      .filter(c => 
        Boolean(c) && 
        c !== 'Global Top 10 in MilliSbu' && 
        c !== 'Continue Watching' && 
        c.toLowerCase() !== 'future watchlist' &&
        c !== 'Our Watchlist (Future Seasons)'
      );
    return Array.from(new Set<string>([...base, ...created, ...fromEpisodes]));
  }, [customCategories, allEpisodes]);

  // Categories Manager State
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [newCatProfile, setNewCatProfile] = useState<'Girlfriend' | 'Boyfriend' | 'Us' | 'All'>('All');
  const [editingCatDocId, setEditingCatDocId] = useState<string | null>(null);
  const [editingCatOriginalName, setEditingCatOriginalName] = useState('');
  const [editingCatNameValue, setEditingCatNameValue] = useState('');

  // Handler to create category directly in settings
  const handleCreateCategoryDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatNameInput.trim();
    if (!clean) return;

    if (allAvailableCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      alert(`Category "${clean}" already exists!`);
      return;
    }

    setIsSaving(true);
    try {
      const catId = 'cat_' + Date.now();
      const newCat: CustomCategory = {
        id: catId,
        name: clean,
        profile: newCatProfile,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'custom_categories', catId), sanitizeFirestoreData(newCat));
      setNewCatNameInput('');
      onSuccess(`Category "${clean}" created and synced across the app!`);
    } catch (err) {
      console.error('Error creating category:', err);
      handleFirestoreError(err, OperationType.WRITE, 'custom_categories');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to rename a category and update any custom episodes using it
  const handleRenameCategory = async (oldName: string, newName: string, catDocId?: string) => {
    const cleanNew = newName.trim();
    if (!cleanNew || cleanNew === oldName) {
      setEditingCatDocId(null);
      return;
    }

    setIsSaving(true);
    try {
      if (catDocId) {
        const existingCat = customCategories.find(c => c.id === catDocId);
        await setDoc(doc(db, 'custom_categories', catDocId), sanitizeFirestoreData({
          id: catDocId,
          name: cleanNew,
          profile: existingCat?.profile || 'All',
          createdAt: existingCat?.createdAt || new Date().toISOString()
        }));
      } else {
        const catId = 'cat_' + Date.now();
        await setDoc(doc(db, 'custom_categories', catId), sanitizeFirestoreData({
          id: catId,
          name: cleanNew,
          profile: 'All',
          createdAt: new Date().toISOString()
        }));
      }

      // Update matching custom_episodes
      const matching = allEpisodes.filter(ep => ep.category === oldName);
      let updatedCount = 0;
      for (const ep of matching) {
        try {
          await setDoc(doc(db, 'custom_episodes', ep.id), sanitizeFirestoreData({
            ...ep,
            category: cleanNew
          }));
          updatedCount++;
        } catch (epErr) {
          console.warn('Error syncing category on episode', ep.id, epErr);
        }
      }

      setEditingCatDocId(null);
      setEditingCatOriginalName('');
      setEditingCatNameValue('');
      onSuccess(`Category renamed to "${cleanNew}"! ${updatedCount > 0 ? `Synced ${updatedCount} episode card${updatedCount !== 1 ? 's' : ''} in cloud.` : ''}`);
    } catch (err) {
      console.error('Error renaming category:', err);
      handleFirestoreError(err, OperationType.WRITE, 'custom_categories');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to delete a category
  const handleDeleteCategory = async (catName: string, catDocId?: string) => {
    const matching = allEpisodes.filter(ep => ep.category === catName);
    const confirmMsg = matching.length > 0
      ? `Are you sure you want to remove category "${catName}"? Note: ${matching.length} episode card(s) are currently in this row.`
      : `Are you sure you want to remove category "${catName}"?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      if (catDocId) {
        await deleteDoc(doc(db, 'custom_categories', catDocId));
      }
      onSuccess(`Category "${catName}" removed from custom categories.`);
    } catch (err) {
      console.error('Error deleting category:', err);
      handleFirestoreError(err, OperationType.DELETE, `custom_categories/${catDocId}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cache purge state
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [purgeResult, setPurgeResult] = useState<CachePurgeResult | null>(null);

  const handlePurgeAllCaches = async () => {
    setIsPurgingCache(true);
    try {
      const result = await purgeAllCacheData();
      setPurgeResult(result);
      onSuccess("Cache data removed successfully! The app will now open and load faster.");
    } catch (err) {
      console.error('Failed to purge cache data:', err);
      alert('Failed to clear cache data completely.');
    } finally {
      setIsPurgingCache(false);
    }
  };

  // Backdrop preview visibility states
  const [showGirlfriendBackdropPreview, setShowGirlfriendBackdropPreview] = useState(false);
  const [showBoyfriendBackdropPreview, setShowBoyfriendBackdropPreview] = useState(false);
  const [showUsBackdropPreview, setShowUsBackdropPreview] = useState(false);
  const [showGlobalBackdropPreview, setShowGlobalBackdropPreview] = useState(false);

  // --- SECTION 4: STUDIO CONFIG STATE ---
  const [trailerVideoUrl, setTrailerVideoUrl] = useState(studioSettings?.trailerVideoUrl || '/videos/8.mp4');
  const [boyfriendProfileImage, setBoyfriendProfileImage] = useState(studioSettings?.boyfriendProfileImage || '');
  const [girlfriendProfileImage, setGirlfriendProfileImage] = useState(studioSettings?.girlfriendProfileImage || 'images/millicent1.jpg');
  const [usProfileImage, setUsProfileImage] = useState(studioSettings?.usProfileImage || '');
  const [bannerUrlsText, setBannerUrlsText] = useState((studioSettings?.bannerVideos || []).join('\n'));
  const [boyfriendBannerUrlsText, setBoyfriendBannerUrlsText] = useState((studioSettings?.boyfriendBannerVideos || []).join('\n'));
  const [girlfriendBannerUrlsText, setGirlfriendBannerUrlsText] = useState((studioSettings?.girlfriendBannerVideos || []).join('\n'));
  const [usBannerUrlsText, setUsBannerUrlsText] = useState((studioSettings?.usBannerVideos || []).join('\n'));
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(studioSettings?.backgroundSoundEnabled || false);
  const [colorTheme, setColorTheme] = useState(studioSettings?.colorTheme || 'romantic');

  // Sync Studio Configuration
  useEffect(() => {
    if (studioSettings) {
      setTrailerVideoUrl(studioSettings.trailerVideoUrl || '/videos/8.mp4');
      setBoyfriendProfileImage(studioSettings.boyfriendProfileImage || '');
      setGirlfriendProfileImage(studioSettings.girlfriendProfileImage || 'images/millicent1.jpg');
      setUsProfileImage(studioSettings.usProfileImage || '');
      setBannerUrlsText((studioSettings.bannerVideos || []).join('\n'));
      setBoyfriendBannerUrlsText((studioSettings.boyfriendBannerVideos || []).join('\n'));
      setGirlfriendBannerUrlsText((studioSettings.girlfriendBannerVideos || []).join('\n'));
      setUsBannerUrlsText((studioSettings.usBannerVideos || []).join('\n'));
      setBackgroundSoundEnabled(studioSettings.backgroundSoundEnabled || false);
      setColorTheme(studioSettings.colorTheme || 'romantic');
    }
  }, [studioSettings]);

  const handleConfigLocalUpload = (file: File, target: 'trailer' | 'boyfriend' | 'girlfriend' | 'us' | 'banner' | 'boyfriend_banner' | 'girlfriend_banner' | 'us_banner') => {
    // If it's a video file or trailer, prevent huge video payloads which would crash the Firestore save (max 1MB per document)
    if (file.type.startsWith('video/') || target === 'trailer') {
      if (file.size > 921600) { // 900 KB
        alert(`This video clip is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Because Firestore is optimized for light metadata and has a 1MB total document constraint, please upload/provide a video smaller than 900KB, or paste a standard web URL instead!`);
        return;
      }
    }

    // For images, we automatically resize and compress them client-side using HTML5 canvas.
    // This reduces multi-megabyte smart camera photographs to highly optimized 30KB web images!
    if (file.type.startsWith('image/')) {
      const imgReader = new FileReader();
      imgReader.readAsDataURL(file);
      imgReader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 600; // max width/height

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
            applyConfigValue(compressedBase64, target);
          } else {
            // fallback if canvas context fails
            applyConfigValue(src, target);
          }
        };
      };
      return;
    }

    // Standard fallback (non-image files, e.g., video under 900KB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      applyConfigValue(base64, target);
    };
    reader.readAsDataURL(file);
  };

  const applyConfigValue = (base64: string, target: 'trailer' | 'boyfriend' | 'girlfriend' | 'us' | 'banner' | 'boyfriend_banner' | 'girlfriend_banner' | 'us_banner') => {
    if (target === 'trailer') {
      setTrailerVideoUrl(base64);
    } else if (target === 'boyfriend') {
      setBoyfriendProfileImage(base64);
    } else if (target === 'girlfriend') {
      setGirlfriendProfileImage(base64);
    } else if (target === 'us') {
      setUsProfileImage(base64);
    } else if (target === 'banner') {
      setBannerUrlsText(prev => prev ? `${prev}\n${base64}` : base64);
    } else if (target === 'boyfriend_banner') {
      setBoyfriendBannerUrlsText(prev => prev ? `${prev}\n${base64}` : base64);
    } else if (target === 'girlfriend_banner') {
      setGirlfriendBannerUrlsText(prev => prev ? `${prev}\n${base64}` : base64);
    } else if (target === 'us_banner') {
      setUsBannerUrlsText(prev => prev ? `${prev}\n${base64}` : base64);
    }
  };

  const handleSaveStudioConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const bannerVideos = bannerUrlsText
        .split(/[,\n;]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const boyfriendBannerVideos = boyfriendBannerUrlsText
        .split(/[,\n;]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const girlfriendBannerVideos = girlfriendBannerUrlsText
        .split(/[,\n;]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const usBannerVideos = usBannerUrlsText
        .split(/[,\n;]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      await onUpdateStudioSettings({
        trailerVideoUrl: trailerVideoUrl.trim(),
        boyfriendProfileImage: boyfriendProfileImage.trim(),
        girlfriendProfileImage: girlfriendProfileImage.trim(),
        usProfileImage: usProfileImage.trim(),
        bannerVideos,
        boyfriendBannerVideos,
        girlfriendBannerVideos,
        usBannerVideos,
        backgroundSoundEnabled,
        colorTheme
      });
      onSuccess("Studio configurations synced successfully to cloud database!");
      // Auto-close modal after slight delay to let user see confirmation, then immediately see backend background change
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      alert("Failed to save Studio configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- UNDO HISTORY ENGINE ---
  type HistoryItem = 
    | { type: 'create'; episode: Episode }
    | { type: 'update'; episode: Episode; prevEpisode: Episode }
    | { type: 'delete'; episode: Episode }
    | { type: 'create_note'; note: any }
    | { type: 'delete_note'; note: any };

  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([]);

  // --- SECTION 1: CREATE EPISODE STATE ---
  const [categoryType, setCategoryType] = useState<'existing' | 'new'>('existing');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[1]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [createMemories, setCreateMemories] = useState<Memory[]>([]);

  // Card Creation - URL range state
  const [urlRangeInput, setUrlRangeInput] = useState('');
  const [urlRangeTitle, setUrlRangeTitle] = useState('Moment');
  const [showUrlRangePreview, setShowUrlRangePreview] = useState(false);
  const [cardUploaderTab, setCardUploaderTab] = useState<'upload' | 'url_range'>('upload');

  // --- SECTION 2: EDIT EPISODE STATE ---
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  // Card Picker View Mode: 'grid' | 'list' | 'dropdown'
  const [cardPickerViewMode, setCardPickerViewMode] = useState<'grid' | 'list' | 'dropdown'>('grid');
  const [cardPickerSearch, setCardPickerSearch] = useState('');
  const [cardPickerCategory, setCardPickerCategory] = useState('all');

  const filteredEpisodesForPicker = useMemo(() => {
    return allEpisodes.filter(ep => {
      if (ep.category === 'Global Top 10 in MilliSbu' || ep.category === 'Continue Watching') {
        return false;
      }
      if (cardPickerCategory !== 'all' && ep.category !== cardPickerCategory) {
        return false;
      }
      if (cardPickerSearch.trim()) {
        const query = cardPickerSearch.toLowerCase();
        const matchesTitle = (ep.title || '').toLowerCase().includes(query);
        const matchesCat = (ep.category || '').toLowerCase().includes(query);
        const matchesDesc = (ep.description || '').toLowerCase().includes(query);
        return matchesTitle || matchesCat || matchesDesc;
      }
      return true;
    });
  }, [allEpisodes, cardPickerCategory, cardPickerSearch]);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editMemories, setEditMemories] = useState<Memory[]>([]);

  // Card Editing - URL range state
  const [editUrlRangeInput, setEditUrlRangeInput] = useState('');
  const [editUrlRangeTitle, setEditUrlRangeTitle] = useState('Moment');
  const [showEditUrlRangePreview, setShowEditUrlRangePreview] = useState(false);
  const [editCardUploaderTab, setEditCardUploaderTab] = useState<'upload' | 'url_range'>('upload');

  // Function to process and add range sequence URLs to the slide arrays
  const addUrlRangeSlides = (isEditMode: boolean) => {
    const text = isEditMode ? editUrlRangeInput : urlRangeInput;
    const baseTitle = isEditMode ? editUrlRangeTitle : urlRangeTitle;
    if (!text.trim()) {
      alert("Please enter a URL or sequence pattern!");
      return;
    }
    
    const expanded = expandUrlsForPreview(text);
    if (expanded.length === 0) {
      alert("No valid URLs found!");
      return;
    }

    const currentCount = isEditMode ? editMemories.length : createMemories.length;
    const remainingSlots = 10000 - currentCount;
    if (remainingSlots <= 0) {
      alert("You have reached the maximum slideshow limit of 10,000 items!");
      return;
    }

    const itemsToAdd = expanded.slice(0, remainingSlots);
    const newMemories = itemsToAdd.map((url, i) => {
      const slideIndex = currentCount + i + 1;
      const isVideo = url.toLowerCase().endsWith('.mp4') || url.includes('video') || url.startsWith('data:video');
      const filename = url.split('/').pop()?.split('?')[0] || '';
      const slideTitle = baseTitle && baseTitle !== 'Moment' && baseTitle !== 'Memories'
        ? (itemsToAdd.length === 1 ? baseTitle : `${baseTitle} #${slideIndex}`)
        : (itemsToAdd.length === 1 && filename ? filename : `${baseTitle || 'Moment'} #${slideIndex}`);

      return {
        id: `mom-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: slideTitle,
        imageUrl: isVideo ? PRESET_COVERS[0].url : url,
        videoUrl: isVideo ? url : undefined,
        description: `A precious chapter of our story, slide ${slideIndex} ✨`
      };
    });

    if (isEditMode) {
      setEditMemories(prev => [...prev, ...newMemories]);
      setEditUrlRangeInput('');
      setEditUrlRangeTitle('Moment');
    } else {
      setCreateMemories(prev => [...prev, ...newMemories]);
      setCreateMemories(currentList => {
        if (currentList.length > 0 && !customCoverUrl) {
          setCustomCoverUrl(currentList[0].imageUrl);
        }
        return currentList;
      });
      setUrlRangeInput('');
      setUrlRangeTitle('Moment');
    }

    if (itemsToAdd.length === 1) {
      onSuccess(`Added 1 image (${itemsToAdd[0]}) to slide deck!`);
    } else {
      onSuccess(`Added ${itemsToAdd.length} images to slide deck!`);
    }
  };

  // --- SECTION 3: DAILY NOTES STATE ---
  const [dailyNotes, setDailyNotes] = useState<{
    id: string;
    subject: string;
    body: string;
    period: 'morning' | 'afternoon' | 'evening' | 'night';
    profile: 'Girlfriend' | 'Boyfriend';
    createdAt: string;
  }[]>([]);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [notePeriod, setNotePeriod] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // Sync daily notes in background
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'daily_notes'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setDailyNotes(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'daily_notes');
    });
    return () => unsub();
  }, []);

  // Find currently selected episode for editing
  const currentlyEditingEpisode = allEpisodes.find(ep => ep.id === selectedEpisodeId);

  // Load details to editor when episode selection changes
  useEffect(() => {
    if (currentlyEditingEpisode) {
      setEditTitle(currentlyEditingEpisode.title);
      setEditDescription(currentlyEditingEpisode.description);
      setEditCategory(currentlyEditingEpisode.category);
      setEditCoverUrl(currentlyEditingEpisode.previewImageUrl);
      setEditMemories([...currentlyEditingEpisode.images]);
    } else {
      setEditTitle('');
      setEditDescription('');
      setEditCategory('');
      setEditCoverUrl('');
      setEditMemories([]);
    }
  }, [selectedEpisodeId, currentlyEditingEpisode]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFiles = (files: File[], isEditMode: boolean) => {
    // Up to 10000 total files limit check
    const currentCount = isEditMode ? editMemories.length : createMemories.length;
    const remainingSlots = 10000 - currentCount;
    if (remainingSlots <= 0) {
      alert("You have already reached the limit of 10,000 files for this slideshow! Delete some files if you wish to upload replacements.");
      return;
    }

    const filesToLoad = files.slice(0, remainingSlots);

    filesToLoad.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        if (file.size > 921600) { // 900 KB
          alert(`The video file "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Firestore limits total document size to 1MB. Please compress your video file beneath 900KB, or upload a smaller clip!`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const defaultThumbnail = PRESET_COVERS[0].url;

          const newMemory: Memory = {
            id: `mom-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: file.name.split('.')[0]?.substring(0, 30) || 'Cherished Memory',
            imageUrl: defaultThumbnail,
            videoUrl: base64,
            description: 'A quiet, precious moment preserved forever ✨'
          };

          if (isEditMode) {
            setEditMemories(prev => [...prev, newMemory]);
          } else {
            setCreateMemories(prev => [...prev, newMemory]);
            setCreateMemories(currentList => {
              if (currentList.length === 1 && !customCoverUrl) {
                setCustomCoverUrl(defaultThumbnail);
              }
              return currentList;
            });
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        // High-precision canvas resizing & 0.65 JPEG compression for pictures
        const imgReader = new FileReader();
        imgReader.readAsDataURL(file);
        imgReader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new Image();
          img.src = src;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 600; // optimized high-resolution thumbnail

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
              
              const newMemory: Memory = {
                id: `mom-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: file.name.split('.')[0]?.substring(0, 30) || 'Cherished Memory',
                imageUrl: compressedBase64,
                description: 'A quiet, precious moment preserved forever ✨'
              };

              if (isEditMode) {
                setEditMemories(prev => [...prev, newMemory]);
              } else {
                setCreateMemories(prev => [...prev, newMemory]);
                setCreateMemories(currentList => {
                  if (currentList.length === 1 && !customCoverUrl) {
                    setCustomCoverUrl(compressedBase64);
                  }
                  return currentList;
                });
              }
            } else {
              // fallback if canvas cannot get context
              const newMemory: Memory = {
                id: `mom-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: file.name.split('.')[0]?.substring(0, 30) || 'Cherished Memory',
                imageUrl: src,
                description: 'A quiet, precious moment preserved forever ✨'
              };
              if (isEditMode) {
                setEditMemories(prev => [...prev, newMemory]);
              } else {
                setCreateMemories(prev => [...prev, newMemory]);
                setCreateMemories(currentList => {
                  if (currentList.length === 1 && !customCoverUrl) {
                    setCustomCoverUrl(src);
                  }
                  return currentList;
                });
              }
            }
          };
        };
      } else {
        alert("Unsupported file type! Please upload standard image files (png/jpg/webp) or video files (mp4).");
      }
    });
  };

  const handleDrop = (e: React.DragEvent, isEditMode: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFiles(Array.from(e.dataTransfer.files), isEditMode);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFiles(Array.from(e.target.files), isEditMode);
    }
  };

  // CREATE CARD FORM handler
  const handleSaveNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Row title cannot be empty.');
      return;
    }

    if (createMemories.length === 0) {
      alert('Please upload or add at least one image or video to construct the cinematic slideshow.');
      return;
    }

    setIsSaving(true);
    const resolvedCategory = categoryType === 'new' ? (newCategoryName.trim() || 'Custom Moments') : selectedCategory;
    const finalCoverUrl = customCoverUrl.trim() || createMemories[0].imageUrl;
    const newId = `eps-custom-${Date.now()}`;

    // Standardize IDs for each play item so it operates beautifully
    const finalMemories = createMemories.map((m, idx) => ({
      ...m,
      title: m.title.trim() || `${title} Part ${idx + 1}`
    }));

    const newEpisode: Episode = {
      id: newId,
      title: title.trim(),
      description: description.trim() || `Moments • ${finalMemories.length} files`,
      category: resolvedCategory,
      previewImageUrl: finalCoverUrl,
      images: finalMemories,
      profile: selectedProfile
    };

    try {
      await setDoc(doc(db, 'custom_episodes', newId), sanitizeFirestoreData(newEpisode));
      
      // If a new custom category was typed, persist and sync it into custom_categories
      if (categoryType === 'new' && newCategoryName.trim()) {
        const cleanCat = newCategoryName.trim();
        const existing = customCategories.find(c => c.name.toLowerCase() === cleanCat.toLowerCase());
        if (!existing) {
          const catId = 'cat_' + Date.now();
          await setDoc(doc(db, 'custom_categories', catId), sanitizeFirestoreData({
            id: catId,
            name: cleanCat,
            profile: selectedProfile,
            createdAt: new Date().toISOString()
          }));
        }
      }

      // Record Undo Action
      setHistoryStack(prev => [...prev, { type: 'create', episode: newEpisode }]);

      // Cleanup inputs
      setTitle('');
      setDescription('');
      setCustomCoverUrl('');
      setCreateMemories([]);
      setNewCategoryName('');

      onSuccess(`Successfully added modern slideshow card: "${newEpisode.title}"!`);
      setIsSaving(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `custom_episodes/${newId}`);
      setIsSaving(false);
    }
  };

  // EDIT CARD FORM handler
  const handleSaveChangesOnExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisodeId) {
      alert("Please select a card from the dropdown dashboard first!");
      return;
    }
    if (!editTitle.trim()) {
      alert("Title is required.");
      return;
    }
    if (editMemories.length === 0) {
      alert("Keep at least one slideshow memory so the card is viewable!");
      return;
    }

    setIsSaving(true);
    const updatedEpisode: Episode = {
      id: selectedEpisodeId,
      title: editTitle.trim(),
      description: editDescription.trim() || `Edited • ${editMemories.length} elements`,
      category: editCategory,
      previewImageUrl: editCoverUrl || editMemories[0].imageUrl,
      images: editMemories,
      profile: currentlyEditingEpisode?.profile || selectedProfile
    };

    const oldEpisode = allEpisodes.find(ep => ep.id === selectedEpisodeId);

    try {
      await setDoc(doc(db, 'custom_episodes', selectedEpisodeId), sanitizeFirestoreData(updatedEpisode));
      
      // If the edited category isn't a base preset or saved category, sync it into custom_categories
      const cleanCat = editCategory.trim();
      if (cleanCat && !customCategories.some(c => c.name.toLowerCase() === cleanCat.toLowerCase()) && !CATEGORIES.includes(cleanCat)) {
        const catId = 'cat_' + Date.now();
        await setDoc(doc(db, 'custom_categories', catId), sanitizeFirestoreData({
          id: catId,
          name: cleanCat,
          profile: selectedProfile,
          createdAt: new Date().toISOString()
        }));
      }

      // Record Undo Action
      if (oldEpisode) {
        setHistoryStack(prev => [...prev, { type: 'update', episode: updatedEpisode, prevEpisode: { ...oldEpisode } }]);
      }

      onSuccess(`Successfully revised "${updatedEpisode.title}". Changes synced across all devices!`);
      setIsSaving(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `custom_episodes/${selectedEpisodeId}`);
      setIsSaving(false);
    }
  };

  // REVERT OVERRIDES OR DELETE CUSTOM CARDS
  const handleRevertOrDelete = async (id: string, name: string) => {
    const episodeToDelete = allEpisodes.find(ep => ep.id === id);
    if (!episodeToDelete) return;
    if (window.confirm(`Are you sure you want to delete custom configurations for "${name}"? This deletes the uploads or resets it to the factory defaults.`)) {
      try {
        await deleteDoc(doc(db, 'custom_episodes', id));
        
        // Record Undo Action
        setHistoryStack(prev => [...prev, { type: 'delete', episode: { ...episodeToDelete } }]);

        setSelectedEpisodeId('');
        onSuccess(`Reverted/Deleted customization for "${name}" successfully.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `custom_episodes/${id}`);
      }
    }
  };

  // --- GENERAL UNDO TRIGGER ---
  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const lastAction = historyStack[historyStack.length - 1];
    setIsSaving(true);
    try {
      if (lastAction.type === 'delete') {
        await setDoc(doc(db, 'custom_episodes', lastAction.episode.id), sanitizeFirestoreData(lastAction.episode));
        onSuccess(`Undone: Restored custom card "${lastAction.episode.title}"!`);
      } else if (lastAction.type === 'update') {
        await setDoc(doc(db, 'custom_episodes', lastAction.prevEpisode.id), sanitizeFirestoreData(lastAction.prevEpisode));
        onSuccess(`Undone: Restored previous version of "${lastAction.prevEpisode.title}"!`);
      } else if (lastAction.type === 'create') {
        await deleteDoc(doc(db, 'custom_episodes', lastAction.episode.id));
        onSuccess(`Undone: Removed created card "${lastAction.episode.title}"!`);
      } else if (lastAction.type === 'create_note') {
        await deleteDoc(doc(db, 'daily_notes', lastAction.note.id));
        onSuccess(`Undone: Removed custom daily thought "${lastAction.note.subject}"!`);
      } else if (lastAction.type === 'delete_note') {
        await setDoc(doc(db, 'daily_notes', lastAction.note.id), sanitizeFirestoreData(lastAction.note));
        onSuccess(`Undone: Restored deleted daily thought "${lastAction.note.subject}"!`);
      }
      setHistoryStack(prev => prev.slice(0, -1));
    } catch (e) {
      console.error('Error executing undo:', e);
      alert('Could not execute undo operation.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- SAVE CUSTOM DAILY NOTE ---
  const handleSaveDailyNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteSubject.trim() || !noteBody.trim()) {
      alert("Please enter both a topic subject and a body note!");
      return;
    }
    setIsSaving(true);
    
    const newNoteRef = doc(collection(db, 'daily_notes'));
    const newNote = {
      id: newNoteRef.id,
      subject: noteSubject.trim(),
      body: noteBody.trim(),
      period: notePeriod,
      profile: selectedProfile,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(newNoteRef, sanitizeFirestoreData(newNote));
      setNoteSubject('');
      setNoteBody('');
      setHistoryStack(prev => [...prev, { type: 'create_note', note: newNote }]);
      onSuccess(`Custom daily thought successfully posted under "${notePeriod}" timing!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `daily_notes/${newNote.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- DELETE CUSTOM DAILY NOTE ---
  const handleDeleteDailyNote = async (id: string, name: string) => {
    const noteToDelete = dailyNotes.find(n => n.id === id);
    if (!noteToDelete) return;
    if (window.confirm(`Are you sure you want to delete this custom thought: "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'daily_notes', id));
        setHistoryStack(prev => [...prev, { type: 'delete_note', note: noteToDelete }]);
        onSuccess(`Deleted custom thought "${name}" successfully.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `daily_notes/${id}`);
      }
    }
  };

  // Update a single memory field in memory lists
  const updateMemoryField = (idx: number, field: 'title' | 'description', val: string, isEditMode: boolean) => {
    if (isEditMode) {
      setEditMemories(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: val };
        return copy;
      });
    } else {
      setCreateMemories(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: val };
        return copy;
      });
    }
  };

  // Remove a single memory slide
  const removeMemorySlide = (idx: number, isEditMode: boolean) => {
    if (isEditMode) {
      setEditMemories(prev => prev.filter((_, i) => i !== idx));
    } else {
      setCreateMemories(prev => prev.filter((_, i) => i !== idx));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 md:p-6" id="editor-dashboard-modal-outer">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Main Panel Content Box */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        className="relative bg-zinc-900 border border-white/10 w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[92vh] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 text-white font-sans"
        id="editor-dashboard-modal-inner"
      >
        {/* Upper Header Control Area */}
        <div className="p-4 sm:p-5 md:p-6 pr-12 sm:pr-14 md:pr-16 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-950/40 relative">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-accent animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>STUDIO PRODUCTION STUDIO</span>
                <span className="text-[8px] sm:text-[9px] bg-accent/20 text-accent font-black uppercase tracking-wider px-2 py-0.5 rounded">All-Devices Sync</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1 sm:line-clamp-none">Add local media or URL sequences up to 10,000 items, configure captions, and edit existing rows directly.</p>
            </div>
          </div>
          
          {/* Close trigger */}
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-white/10 border border-transparent hover:border-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector Sections */}
        <div className="bg-zinc-950 px-2.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 bg-zinc-900/60 p-1 sm:p-1.5 rounded-xl border border-white/5 max-w-full touch-pan-x">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'create' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'edit' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Manage Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'categories' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daily_notes')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'daily_notes' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>📝</span>
              <span>Daily Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('studio_config')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'studio_config' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Studio Config</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cache_speed')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'cache_speed' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed & Cache</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credits_config')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${activeTab === 'credits_config' ? 'bg-accent text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Movie Credits & BG</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
            {historyStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all shadow-md animate-pulse cursor-pointer"
                title="Undo your last modifications or deletions"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Undo ({historyStack.length})</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-zinc-900 border border-white/10 shadow-inner">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">Workspace:</span>
              <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md ${
                selectedProfile === 'Girlfriend' 
                  ? 'bg-[#ff2d55]/15 text-[#ff2d55]' 
                  : selectedProfile === 'Boyfriend' 
                    ? 'bg-violet-500/15 text-violet-400' 
                    : 'bg-pink-500/15 text-pink-400'
              }`}>
                {selectedProfile === 'Girlfriend' ? 'Milli' : selectedProfile === 'Boyfriend' ? 'Sbu' : 'Us Together'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab content area container */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8 space-y-5 sm:space-y-6">

          {/* TAB 1: CREATE SLIDESHOW CARD */}
          {activeTab === 'create' && (
            <form onSubmit={handleSaveNewCourse} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                
                {/* Information inputs */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-3.5 sm:p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Row Properties & Categorization
                    </h3>

                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Row Target Category</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCategoryType('existing')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all border ${categoryType === 'existing' ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/10 text-white'}`}
                        >
                          Select Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryType('new')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all border ${categoryType === 'new' ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/10 text-white'}`}
                        >
                          + New Category
                        </button>
                      </div>

                      {categoryType === 'existing' ? (
                        <div className="space-y-1">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:ring-1 focus:ring-accent outline-none text-zinc-300"
                          >
                            {allAvailableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setActiveTab('categories')}
                              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-bold pt-0.5 cursor-pointer"
                            >
                              <FolderPlus className="w-3 h-3" /> Manage all categories →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Unforgettable Memories 🤍"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white font-medium"
                          required
                        />
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Card Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Picnic in Jozi"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white font-medium"
                        required
                      />
                    </div>

                    {/* Tagline */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Episode Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Moments • Episode 6"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <ImageIcon className="w-3.5 h-3.5" /> Customize Cover Artwork (Optional)
                    </h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Custom Cover Image URL</label>
                      <input
                        type="text"
                        placeholder="Paste image web link or leave blank to auto-use first upload preview"
                        value={customCoverUrl}
                        onChange={(e) => setCustomCoverUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white"
                      />
                    </div>

                    <div className="pt-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">Preset Artwork Templates:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PRESET_COVERS.map(cover => (
                          <div 
                            key={cover.name}
                            onClick={() => setCustomCoverUrl(cover.url)}
                            className={`relative aspect-video rounded cursor-pointer overflow-hidden border transition-all ${customCoverUrl === cover.url ? 'border-accent ring-1 ring-accent/30' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                          >
                            <img src={cover.url} alt={cover.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Loader Panel */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Tab Selector for media uploader */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setCardUploaderTab('upload')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${cardUploaderTab === 'upload' ? 'bg-zinc-800 text-white border border-white/5 shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      📁 Local Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardUploaderTab('url_range')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${cardUploaderTab === 'url_range' ? 'bg-zinc-800 text-white border border-white/10 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                      🔗 Paste Image / Media URLs
                    </button>
                  </div>

                  {cardUploaderTab === 'upload' ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={(e) => handleDrop(e, false)}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${dragActive ? 'border-accent bg-accent/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                      onClick={() => document.getElementById('local-file-selector-create')?.click()}
                    >
                      <input 
                        type="file" 
                        id="local-file-selector-create" 
                        multiple 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, false)}
                      />
                      <Upload className="w-10 h-10 text-accent mb-3 animate-pulse" />
                      <p className="text-xs font-black uppercase text-white tracking-widest">DRAG & DROP LOCAL FILES HERE</p>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">Supports images (.png, .jpg, .webp) or videos (.mp4) up to 10,000 files total. Autoplay slideshow generates seamlessly.</p>
                      <button 
                        type="button" 
                        className="mt-4 px-4 py-1.5 bg-accent/20 border border-accent/30 text-accent hover:bg-accent hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Browse Files
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label className="block text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                              Image / Media URL(s)
                            </label>
                            <span className="text-[9px] text-accent/90 font-medium">
                              Exact URL mode • 1 slide per link
                            </span>
                          </div>
                          <textarea 
                            rows={3}
                            value={urlRangeInput}
                            onChange={(e) => setUrlRangeInput(e.target.value)}
                            placeholder="e.g. images/193.jpg (adds only this specific image)&#10;or paste multiple URLs (one per line)&#10;or bracket range: images/[1-50].jpg"
                            className="w-full bg-zinc-900 border border-white/15 p-3 rounded-lg text-[11px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[90px]"
                          />
                          <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
                            <span className="text-emerald-400 font-bold">✓</span> Entering a specific URL like <code className="text-zinc-200 bg-white/5 px-1 py-0.5 rounded font-mono">images/193.jpg</code> adds only that exact URL.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                              Base Name of Slides
                            </label>
                            <input 
                              type="text" 
                              value={urlRangeTitle}
                              onChange={(e) => setUrlRangeTitle(e.target.value)}
                              placeholder="e.g. Moments, Memories"
                              className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-[11px] text-white focus:outline-none focus:border-accent font-bold"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => addUrlRangeSlides(false)}
                              className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              <Plus className="w-3.5 h-3.5" /> Append Slides
                            </button>
                          </div>
                        </div>

                        {/* Interactive toggle for preview grid */}
                        <div className="pt-2 flex items-center justify-between border-t border-white/5">
                          <span className="text-[10px] text-zinc-400 font-bold">Verify sequence URLs before appending?</span>
                          <button
                            type="button"
                            onClick={() => setShowUrlRangePreview(!showUrlRangePreview)}
                            className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${showUrlRangePreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                          >
                            {showUrlRangePreview ? 'Hide Preview' : 'Show Verification Grid'}
                          </button>
                        </div>

                        {showUrlRangePreview && (
                          <div className="pt-2">
                            <SequencePreviewGrid urlsText={urlRangeInput} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* uploaded count */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Loaded Slides:</span>
                    <span className="text-[10px] bg-accent/20 text-accent font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {createMemories.length.toLocaleString()} / 10,000 Limit
                    </span>
                  </div>

                  {/* Empty Upload queue state */}
                  {createMemories.length === 0 && (
                    <div className="p-8 border border-white/5 bg-zinc-950/40 rounded-xl text-center">
                      <Film className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">No files loaded yet. Build a cinematic slide deck by uploading or pasting URLs!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual slideshow file captions editor (matches style exactly) */}
              {createMemories.length > 0 && (
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    🎙️ Write Custom Captions & Dialogs for Each Moment in the Slide Deck
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {createMemories.map((slide, idx) => (
                      <div key={slide.id} className="p-3 sm:p-3.5 bg-zinc-950 border border-white/10 rounded-xl flex flex-col sm:flex-row gap-3 min-h-[8.5rem] h-auto items-stretch">
                        <div className="w-full h-24 sm:w-20 sm:h-auto rounded overflow-hidden bg-black/50 border border-white/5 shrink-0 relative">
                          {slide.videoUrl ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/5">
                              <Film className="w-6 h-6 text-accent" />
                              <span className="absolute bottom-1 right-1 text-[7px] bg-accent text-white px-1 py-0.2 rounded font-black tracking-widest">VIDEO CLIP</span>
                            </div>
                          ) : (
                            <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
                          <div className="space-y-1.5">
                            <input 
                              type="text" 
                              value={slide.title} 
                              onChange={(e) => updateMemoryField(idx, 'title', e.target.value, false)}
                              placeholder={`Slide Name #${idx + 1}`}
                              className="w-full bg-white/5 border border-white/10 px-2 py-1 rounded text-[11px] focus:border-accent outline-none text-white font-bold"
                            />
                            <textarea 
                              value={slide.description || ''} 
                              onChange={(e) => updateMemoryField(idx, 'description', e.target.value, false)}
                              placeholder="Heartfelt memory details / dialogue here... 🥰"
                              rows={2}
                              className="w-full bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] focus:border-accent outline-none text-zinc-300 resize-none min-h-[44px] leading-tight"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center pt-1 border-t border-white/5">
                            <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Slide {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeMemorySlide(idx, false)}
                              className="text-[9px] text-rose-400 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Remove Moment
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit panel */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 bg-accent text-white hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-accent/25"
              >
                <Plus className="w-4 h-4" />
                {isSaving ? 'Spanning and Live Syncing Custom Slideshow...' : 'Pin & Broadcast Slideshow row on Dashboard Wall'}
              </button>
            </form>
          )}

          {/* TAB 2: EDIT EXISTING CARDS / CATEGORIES */}
          {activeTab === 'edit' && (
            <div className="space-y-6">
              
              {/* Card Selection and Multi-View Switcher Component */}
              <div className="p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
                <div className="space-y-3.5">
                  {/* Upper Bar: Title, Count Badge, and View Mode Toggles */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black uppercase tracking-wider text-accent block">
                          Choose Existing Card to Edit / Modify:
                        </label>
                        <span className="text-[10px] bg-accent/20 text-accent font-mono px-2 py-0.5 rounded font-black">
                          {filteredEpisodesForPicker.length} {filteredEpisodesForPicker.length === 1 ? 'Card' : 'Cards'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Browse your studio cards in Grid or List view, or search to jump to any card.
                      </p>
                    </div>

                    {/* View Switcher: Grid vs List vs Dropdown */}
                    <div className="flex items-center gap-1 self-start sm:self-center bg-zinc-950 p-1 rounded-xl border border-white/10 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setCardPickerViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          cardPickerViewMode === 'grid'
                            ? 'bg-accent text-white shadow-md'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Grid View (Visual Cards)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardPickerViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          cardPickerViewMode === 'list'
                            ? 'bg-accent text-white shadow-md'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="List View (Compact Rows)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardPickerViewMode('dropdown')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          cardPickerViewMode === 'dropdown'
                            ? 'bg-accent text-white shadow-md'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Dropdown Selector View"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Dropdown</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter and Search Controls (Active across all views) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search cards by title, category, or description..."
                        value={cardPickerSearch}
                        onChange={(e) => setCardPickerSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-7 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent font-medium"
                      />
                      {cardPickerSearch && (
                        <button
                          type="button"
                          onClick={() => setCardPickerSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={cardPickerCategory}
                        onChange={(e) => setCardPickerCategory(e.target.value)}
                        className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent font-bold cursor-pointer"
                      >
                        <option value="all">All Categories ({allEpisodes.length})</option>
                        {allAvailableCategories.map(cat => {
                          const count = allEpisodes.filter(e => e.category === cat).length;
                          return (
                            <option key={cat} value={cat}>{cat} ({count})</option>
                          );
                        })}
                      </select>

                      {selectedEpisodeId && (
                        <button
                          type="button"
                          onClick={() => handleRevertOrDelete(selectedEpisodeId, editTitle)}
                          className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer"
                          title="Clear Customizations and Revert to Default preset"
                        >
                          Reset / Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Primary Selector Element (Satisfies CSS Selector and Provides Quick Jump) */}
                  <div className={`flex gap-2 ${cardPickerViewMode === 'dropdown' ? 'block' : 'hidden'}`}>
                    <select
                      value={selectedEpisodeId}
                      onChange={(e) => setSelectedEpisodeId(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-white/15 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-accent outline-none text-white font-bold"
                    >
                      <option value="" className="text-zinc-500">-- Select a Card below --</option>
                      {CATEGORIES.filter(c => c !== 'Global Top 10 in MilliSbu' && c !== 'Continue Watching').map((category) => {
                        const matches = allEpisodes.filter(e => e.category === category);
                        if (matches.length === 0) return null;
                        return (
                          <optgroup key={category} label={category} className="bg-zinc-950 text-white font-normal">
                            {matches.map(ep => (
                              <option key={ep.id} value={ep.id} className="text-white font-bold">
                                {ep.title} {ep.id.startsWith('eps-custom-') ? '★ (Custom Card)' : ' (Preset)'}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>

                    {selectedEpisodeId && (
                      <button
                        type="button"
                        onClick={() => handleRevertOrDelete(selectedEpisodeId, editTitle)}
                        className="px-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                        title="Clear Customizations and Revert to Default preset"
                      >
                        Delete Or Reset overrides
                      </button>
                    )}
                  </div>

                  {/* VIEW 1: GRID VIEW */}
                  {cardPickerViewMode === 'grid' && (
                    <div className="space-y-2 pt-1">
                      {filteredEpisodesForPicker.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-950/40 rounded-xl border border-white/5 space-y-2">
                          <span className="text-2xl">🔍</span>
                          <p className="text-xs text-zinc-400">No cards match your filter or search query.</p>
                          <button
                            type="button"
                            onClick={() => { setCardPickerSearch(''); setCardPickerCategory('all'); }}
                            className="text-[11px] text-accent font-bold underline cursor-pointer"
                          >
                            Clear search & category filter
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                          {filteredEpisodesForPicker.map((ep) => {
                            const isSelected = ep.id === selectedEpisodeId;
                            const isCustom = ep.id.startsWith('eps-custom-');
                            const slideCount = ep.images?.length || 0;
                            return (
                              <div
                                key={ep.id}
                                onClick={() => setSelectedEpisodeId(ep.id)}
                                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-accent/15 border-accent ring-2 ring-accent/40 shadow-lg shadow-accent/20'
                                    : 'bg-zinc-950/80 border-white/10 hover:border-white/25 hover:bg-zinc-900/80'
                                }`}
                              >
                                {/* Cover Thumbnail */}
                                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                                  {ep.previewImageUrl ? (
                                    <img
                                      src={ep.previewImageUrl}
                                      alt={ep.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                  )}
                                  
                                  {/* Badges */}
                                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md backdrop-blur-md ${
                                      isCustom ? 'bg-amber-500/90 text-zinc-950 font-black' : 'bg-black/70 text-zinc-300'
                                    }`}>
                                      {isCustom ? '★ Custom' : 'Preset'}
                                    </span>
                                    <span className="text-[8px] font-bold bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded font-mono shadow-md backdrop-blur-md">
                                      {slideCount} {slideCount === 1 ? 'file' : 'files'}
                                    </span>
                                  </div>

                                  {isSelected && (
                                    <div className="absolute inset-0 bg-accent/25 flex items-center justify-center backdrop-blur-[1px]">
                                      <span className="bg-accent text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Selected
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Meta */}
                                <div className="p-2.5 space-y-1">
                                  <div className="text-[9px] font-bold uppercase text-accent truncate tracking-wider">
                                    {ep.category}
                                  </div>
                                  <h4 className="text-xs font-bold text-white truncate group-hover:text-accent transition-colors">
                                    {ep.title}
                                  </h4>
                                  {ep.description && (
                                    <p className="text-[10px] text-zinc-400 line-clamp-1">
                                      {ep.description}
                                    </p>
                                  )}
                                </div>

                                {/* Bottom Action bar */}
                                <div className="px-2.5 pb-2.5 pt-1 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[100px]">
                                    {ep.id}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                                    isSelected 
                                      ? 'bg-accent text-white' 
                                      : 'bg-white/10 text-zinc-300 group-hover:bg-accent group-hover:text-white'
                                  }`}>
                                    {isSelected ? 'Editing' : 'Select'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW 2: LIST VIEW */}
                  {cardPickerViewMode === 'list' && (
                    <div className="space-y-1.5 pt-1">
                      {filteredEpisodesForPicker.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-950/40 rounded-xl border border-white/5 space-y-2">
                          <span className="text-2xl">🔍</span>
                          <p className="text-xs text-zinc-400">No cards match your filter or search query.</p>
                          <button
                            type="button"
                            onClick={() => { setCardPickerSearch(''); setCardPickerCategory('all'); }}
                            className="text-[11px] text-accent font-bold underline cursor-pointer"
                          >
                            Clear search & category filter
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                          {filteredEpisodesForPicker.map((ep) => {
                            const isSelected = ep.id === selectedEpisodeId;
                            const isCustom = ep.id.startsWith('eps-custom-');
                            const slideCount = ep.images?.length || 0;
                            return (
                              <div
                                key={ep.id}
                                onClick={() => setSelectedEpisodeId(ep.id)}
                                className={`group p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-accent/15 border-accent ring-1 ring-accent/40'
                                    : 'bg-zinc-950/80 border-white/10 hover:border-white/20 hover:bg-zinc-900/60'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Thumbnail */}
                                  <div className="w-14 h-10 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0 relative border border-white/10">
                                    {ep.previewImageUrl ? (
                                      <img
                                        src={ep.previewImageUrl}
                                        alt={ep.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <ImageIcon className="w-4 h-4" />
                                      </div>
                                    )}
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-accent/40 flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-bold text-white truncate group-hover:text-accent transition-colors">
                                        {ep.title}
                                      </h4>
                                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                        isCustom ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-zinc-400'
                                      }`}>
                                        {isCustom ? '★ Custom' : 'Preset'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 flex-wrap">
                                      <span className="text-accent font-medium">{ep.category}</span>
                                      <span className="text-zinc-600">•</span>
                                      <span className="font-mono">{slideCount} {slideCount === 1 ? 'file' : 'files'}</span>
                                      {ep.description && (
                                        <>
                                          <span className="text-zinc-600">•</span>
                                          <span className="truncate max-w-[220px] text-zinc-400">{ep.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedEpisodeId(ep.id); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-accent text-white shadow-md'
                                        : 'bg-white/10 text-zinc-300 hover:bg-accent hover:text-white'
                                    }`}
                                  >
                                    {isSelected ? 'Editing' : 'Select'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Card Notification Banner */}
                  {currentlyEditingEpisode && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3 min-w-0">
                        {currentlyEditingEpisode.previewImageUrl && (
                          <img
                            src={currentlyEditingEpisode.previewImageUrl}
                            alt={currentlyEditingEpisode.title}
                            className="w-10 h-10 rounded-lg object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-accent tracking-wider">Ready to Edit:</span>
                            <span className="text-xs font-bold text-white truncate">{currentlyEditingEpisode.title}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            Category: <span className="text-zinc-300 font-bold">{currentlyEditingEpisode.category}</span> • {currentlyEditingEpisode.images?.length || 0} moments loaded in editor below
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEpisodeId('')}
                        className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 font-bold shrink-0 cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection is loaded */}
              {selectedEpisodeId ? (
                <form onSubmit={handleSaveChangesOnExisting} className="space-y-6 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    
                    {/* Information inputs */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="p-3.5 sm:p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Edit className="w-3.5 h-3.5" /> Modify Card Details
                        </h3>

                        {/* Title */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Edit Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white font-medium"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Edit Tagline / Episode Label</label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white font-medium"
                          />
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Edit Row Category Location</label>
                            <button
                              type="button"
                              onClick={() => setActiveTab('categories')}
                              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <FolderPlus className="w-3 h-3" /> Manage Categories →
                            </button>
                          </div>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-zinc-300"
                          >
                            {allAvailableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {editCategory && !allAvailableCategories.includes(editCategory) && (
                              <option value={editCategory}>{editCategory} (Custom)</option>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <ImageIcon className="w-3.5 h-3.5" /> Modify Card Cover Artwork
                        </h3>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Cover Artwork URL</label>
                          <input
                            type="text"
                            value={editCoverUrl}
                            onChange={(e) => setEditCoverUrl(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-white"
                          />
                        </div>

                        <div className="pt-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">Change to Preset Template:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PRESET_COVERS.map(cover => (
                              <div 
                                key={cover.name}
                                onClick={() => setEditCoverUrl(cover.url)}
                                className={`relative aspect-video rounded cursor-pointer overflow-hidden border transition-all ${editCoverUrl === cover.url ? 'border-accent ring-1 ring-accent/30' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                              >
                                <img src={cover.url} alt={cover.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                     {/* Media Loader Panel for Editing */}
                    <div className="lg:col-span-6 space-y-4">
                      {/* Tab Selector for edit media uploader */}
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setEditCardUploaderTab('upload')}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${editCardUploaderTab === 'upload' ? 'bg-zinc-800 text-white border border-white/5 shadow' : 'text-zinc-400 hover:text-white'}`}
                        >
                          📁 Local Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCardUploaderTab('url_range')}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${editCardUploaderTab === 'url_range' ? 'bg-zinc-800 text-white border border-white/10 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                          🔗 Paste Image / Media URLs
                        </button>
                      </div>

                      {editCardUploaderTab === 'upload' ? (
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={(e) => handleDrop(e, true)}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${dragActive ? 'border-accent bg-accent/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                          onClick={() => document.getElementById('local-file-selector-edit')?.click()}
                        >
                          <input 
                            type="file" 
                            id="local-file-selector-edit" 
                            multiple 
                            accept="image/*,video/*" 
                            className="hidden" 
                            onChange={(e) => handleFileChange(e, true)}
                          />
                          <Upload className="w-10 h-10 text-accent mb-3 animate-pulse" />
                          <p className="text-xs font-black uppercase text-white tracking-widest">UPLOAD MORE PHOTOS/VIDEOS HERE</p>
                          <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">Instantly appends uploads to the slideshow queue (maximum 10,000 allowed total in the slide series).</p>
                          <button 
                            type="button" 
                            className="mt-4 px-4 py-1.5 bg-accent/20 border border-accent/30 text-accent hover:bg-accent hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Append Media
                          </button>
                        </div>
                      ) : (
                        <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <label className="block text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  Image / Media URL(s)
                                </label>
                                <span className="text-[9px] text-accent/90 font-medium">
                                  Exact URL mode • 1 slide per link
                                </span>
                              </div>
                              <textarea 
                                rows={3}
                                value={editUrlRangeInput}
                                onChange={(e) => setEditUrlRangeInput(e.target.value)}
                                placeholder="e.g. images/193.jpg (adds only this specific image)&#10;or paste multiple URLs (one per line)&#10;or bracket range: images/[1-50].jpg"
                                className="w-full bg-zinc-900 border border-white/15 p-3 rounded-lg text-[11px] text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[90px]"
                              />
                              <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
                                <span className="text-emerald-400 font-bold">✓</span> Entering a specific URL like <code className="text-zinc-200 bg-white/5 px-1 py-0.5 rounded font-mono">images/193.jpg</code> adds only that exact URL.
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                                  Base Name of Slides
                                </label>
                                <input 
                                  type="text" 
                                  value={editUrlRangeTitle}
                                  onChange={(e) => setEditUrlRangeTitle(e.target.value)}
                                  placeholder="e.g. Moments, Memories"
                                  className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-[11px] text-white focus:outline-none focus:border-accent font-bold"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => addUrlRangeSlides(true)}
                                  className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Append Slides
                                </button>
                              </div>
                            </div>

                            {/* Interactive toggle for preview grid */}
                            <div className="pt-2 flex items-center justify-between border-t border-white/5">
                              <span className="text-[10px] text-zinc-400 font-bold">Verify sequence URLs before appending?</span>
                              <button
                                type="button"
                                onClick={() => setShowEditUrlRangePreview(!showEditUrlRangePreview)}
                                className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${showEditUrlRangePreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                              >
                                {showEditUrlRangePreview ? 'Hide Preview' : 'Show Verification Grid'}
                              </button>
                            </div>

                            {showEditUrlRangePreview && (
                              <div className="pt-2">
                                <SequencePreviewGrid urlsText={editUrlRangeInput} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Current Slides count:</span>
                        <span className="text-[10px] bg-accent/25 text-accent font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          {editMemories.length.toLocaleString()} / 10,000 Limit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit list of images/videos slideshow */}
                  <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2 flex items-center gap-1.5 border-b border-white/5 pb-2">
                      🎙️ Edit Exist Slides Captions & Slide Dialogues or Re-order
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {editMemories.map((slide, idx) => (
                        <div key={slide.id} className="p-3 sm:p-3.5 bg-zinc-950 border border-white/10 rounded-xl flex flex-col sm:flex-row gap-3 min-h-[8.5rem] h-auto items-stretch">
                          <div className="w-full h-24 sm:w-20 sm:h-auto rounded overflow-hidden bg-black/50 border border-white/5 shrink-0 relative">
                            {slide.videoUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/5">
                                <Film className="w-6 h-6 text-accent" />
                                <span className="absolute bottom-0.5 right-0.5 text-[6px] bg-accent text-white px-1 py-0.2 rounded font-black">VIDEO LINK</span>
                              </div>
                            ) : (
                              <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-w-0 space-y-2">
                            <div className="space-y-1.5">
                              <input 
                                type="text" 
                                value={slide.title} 
                                onChange={(e) => updateMemoryField(idx, 'title', e.target.value, true)}
                                className="w-full bg-white/5 border border-white/10 px-2 py-1 rounded text-[11px] focus:border-accent outline-none text-white font-bold"
                              />
                              <textarea 
                                value={slide.description || ''} 
                                onChange={(e) => updateMemoryField(idx, 'description', e.target.value, true)}
                                placeholder="Caption detail..."
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] focus:border-accent outline-none text-zinc-300 resize-none min-h-[44px] leading-tight"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center pt-1 border-t border-white/5">
                              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Slide {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeMemorySlide(idx, true)}
                                className="text-[9px] text-rose-400 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete Moment
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit updates button */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 bg-accent text-white hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-accent/20"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    {isSaving ? 'Spanning and Syncing Live Updates...' : 'Synchronize Card Custom Changes'}
                  </button>
                </form>
              ) : (
                <div className="h-60 border border-white/5 bg-zinc-950/20 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-zinc-500">
                    ✏️
                  </div>
                  <p className="text-xs text-zinc-400 font-medium max-w-xs">Select any card from the Grid, List, or Dropdown view above to modify covers, edit captions, or manage up to 10,000 media slides!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: CATEGORIES MANAGER & EDITING */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start animate-fadeIn" id="categories-tab-container">
              {/* Left Column: Create New Category */}
              <div className="lg:col-span-5 space-y-4">
                <form onSubmit={handleCreateCategoryDirect} className="p-4 sm:p-5 bg-white/5 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5" /> Create New Category
                    </h3>
                    <span className="text-[9px] bg-accent/20 text-accent font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      Live Cloud Sync
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Create new row categories for your episodes and memories. They will sync instantly to Firestore and appear in your homepage rows and settings.
                  </p>

                  {/* Category Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Category Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Unforgettable Road Trips 🚗"
                      value={newCatNameInput}
                      onChange={(e) => setNewCatNameInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded-lg text-xs focus:border-accent outline-none text-white font-medium placeholder:text-zinc-600"
                      required
                    />
                  </div>

                  {/* Profile target */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Target Workspace Profile
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['All', 'Girlfriend', 'Boyfriend', 'Us'] as const).map((prof) => (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => setNewCatProfile(prof)}
                          className={`py-2 px-3 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-left ${
                            newCatProfile === prof
                              ? 'bg-accent/15 border-accent text-accent shadow-sm'
                              : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                          }`}
                        >
                          <span className="block font-black">
                            {prof === 'All' ? '🌐 All Profiles' : prof === 'Girlfriend' ? '👸 Milli Only' : prof === 'Boyfriend' ? '🤴 Sbu Only' : '🤍 Us Together'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSaving || !newCatNameInput.trim()}
                    className="w-full py-3 bg-accent text-white hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-accent/20 cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {isSaving ? 'Syncing to Cloud...' : 'Add & Sync Category'}
                  </button>
                </form>

                {/* Helpful Guide Box */}
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <span>💡</span> Automatic Cloud Syncing
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    When you create a category here, it immediately becomes available across all profile workspaces. You can rename it anytime, and all cards assigned to it will update automatically!
                  </p>
                </div>
              </div>

              {/* Right Column: Manage & Edit Existing Categories */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 sm:p-5 bg-zinc-950/60 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-accent" /> Manage App Categories
                    </h3>
                    <span className="text-[9px] bg-white/5 text-zinc-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {allAvailableCategories.length} Categories
                    </span>
                  </div>

                  {allAvailableCategories.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <Folder className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider">No categories found.</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Create your first custom category on the left to organize your cinematic memories!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                      {allAvailableCategories.map((catName) => {
                        const customDoc = customCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                        const isCustom = Boolean(customDoc);
                        const cardCount = allEpisodes.filter(ep => ep.category?.trim().toLowerCase() === catName.toLowerCase()).length;
                        const isEditing = editingCatOriginalName === catName;

                        return (
                          <div
                            key={catName}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isEditing
                                ? 'bg-zinc-900 border-accent shadow-md shadow-accent/10'
                                : 'bg-zinc-900/90 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {isEditing ? (
                              /* Inline Rename Editor */
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> Renaming Category
                                  </span>
                                  <span className="text-[9px] text-zinc-400">
                                    Will update {cardCount} associated episode card{cardCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                  <input
                                    type="text"
                                    value={editingCatNameValue}
                                    onChange={(e) => setEditingCatNameValue(e.target.value)}
                                    className="flex-1 min-w-[130px] bg-zinc-950 border border-white/15 p-2 rounded-lg text-xs text-white font-medium focus:border-accent outline-none"
                                    autoFocus
                                    placeholder="Enter new category name..."
                                  />
                                  <button
                                    type="button"
                                    disabled={isSaving || !editingCatNameValue.trim()}
                                    onClick={() => handleRenameCategory(catName, editingCatNameValue, customDoc?.id)}
                                    className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatOriginalName('');
                                      setEditingCatDocId(null);
                                      setEditingCatNameValue('');
                                    }}
                                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-xs transition-all cursor-pointer shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Category Display Row */
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isCustom ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-zinc-400 border border-white/10'
                                  }`}>
                                    <Folder className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-bold text-white truncate">{catName}</h4>
                                      {isCustom ? (
                                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20">
                                          Custom
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-white/5 text-zinc-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/5">
                                          Preset
                                        </span>
                                      )}
                                      {customDoc?.profile && customDoc.profile !== 'All' && (
                                        <span className="text-[9px] bg-violet-500/15 text-violet-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-violet-500/20">
                                          {customDoc.profile}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                                      {cardCount} episode card{cardCount !== 1 ? 's' : ''} in this category
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatOriginalName(catName);
                                      setEditingCatDocId(customDoc?.id || null);
                                      setEditingCatNameValue(catName);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 hover:border-white/15 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    title="Rename category and sync across all cards"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Rename</span>
                                  </button>

                                  {isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(catName, customDoc?.id)}
                                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all cursor-pointer"
                                      title="Delete category"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY NOTES CREATOR / MANAGER */}
          {activeTab === 'daily_notes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start" id="daily-notes-tab-container">
              
              {/* Form to Create Custom Daily Note */}
              <div className="lg:col-span-5 space-y-4">
                <form onSubmit={handleSaveDailyNote} className="p-4 sm:p-5 bg-white/5 rounded-xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1.5 border-b border-white/5 pb-2">
                    ✨ Compose Custom Daily Note
                  </h3>
                  
                  {/* Period timing */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Note Display Timing Period</label>
                    <select
                      value={notePeriod}
                      onChange={(e) => setNotePeriod(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded text-xs focus:border-accent outline-none text-zinc-300 font-bold"
                    >
                      <option value="morning">Morning (05:00 - 11:59) ☀️</option>
                      <option value="afternoon">Afternoon (12:00 - 16:59) ☕</option>
                      <option value="evening">Evening (17:00 - 21:59) 🌅</option>
                      <option value="night">Night (22:00 - 04:59) 🌌</option>
                    </select>
                  </div>

                  {/* Subject input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Topic Subject (Floating Title)</label>
                    <input
                      type="text"
                      placeholder="e.g. Good morning, gorgeous! ✨"
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 p-2 text-xs focus:border-accent outline-none text-white font-medium"
                      required
                    />
                  </div>

                  {/* Body textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Message Body</label>
                    <textarea
                      placeholder="Write your beautiful custom love thoughts, reminders, or countdown dedications here... 🥰"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      rows={5}
                      className="w-full bg-zinc-950 border border-white/10 p-2.5 rounded text-xs focus:border-accent outline-none text-zinc-300 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-accent text-white hover:opacity-95 disabled:opacity-55 flex items-center justify-center gap-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-accent/20 cursor-pointer"
                  >
                    <span>🤍</span> Publish Thought Stream
                  </button>
                </form>
              </div>

              {/* Live list of Custom Daily Notes */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">
                      Live Custom Thoughts Feed
                    </h3>
                    <span className="text-[9px] bg-white/5 text-zinc-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {dailyNotes.length} Custom Note{dailyNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {dailyNotes.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500">
                      <span className="text-2xl block mb-2">📮</span>
                      <p className="text-[11px] font-bold uppercase tracking-wider">No Custom thoughts published yet.</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Compose one on the left so your partner gets welcomed with high-contrast customizable notes personalized in real-time!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {dailyNotes.map((note) => (
                        <div 
                          key={note.id} 
                          className="p-4 bg-zinc-900 border border-white/10 rounded-xl flex items-start justify-between gap-4 transition-all hover:border-white/25"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Timing Badge */}
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                note.period === 'morning' ? 'bg-amber-500/15 text-amber-400' :
                                note.period === 'afternoon' ? 'bg-teal-500/15 text-teal-400' :
                                note.period === 'evening' ? 'bg-orange-500/15 text-orange-400' :
                                'bg-violet-500/15 text-violet-400'
                              }`}>
                                {note.period} {note.period === 'morning' ? '☀️' : note.period === 'afternoon' ? '☕' : note.period === 'evening' ? '🌅' : '🌌'}
                              </span>
                              
                              {/* Profile Author Badge */}
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                note.profile === 'Girlfriend' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                By {note.profile === 'Girlfriend' ? 'Milli' : 'Sbu'}
                              </span>
                            </div>

                            <h4 className="text-[11px] font-black uppercase text-zinc-200 tracking-wider truncate">
                              {note.subject}
                            </h4>
                            
                            <p className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed italic">
                              "{note.body}"
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDailyNote(note.id, note.subject)}
                            className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-colors"
                            title="Delete this custom note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STUDIO CONFIG */}
          {activeTab === 'studio_config' && (
            <form onSubmit={handleSaveStudioConfig} className="space-y-6 pt-2 max-w-3xl mx-auto">
              <div className="space-y-2">
                <span className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">Studio Customizations</span>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">📽️ Cinema Settings Panel</h3>
                <p className="text-xs text-zinc-400">
                  Configure real persistent media links, customized profile representations, and hero backdrops. Your values are synced live!
                </p>
              </div>

              {/* SECTION A: TRAILER VIDEO */}
              <div className="bg-zinc-950/60 p-5 rounded-lg border border-white/5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#ff2d55] flex items-center gap-2">
                  <Film className="w-4 h-4" /> 1. Customizable Cinematic Trailer
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      Trailer Video URL
                    </label>
                    <input 
                      type="text" 
                      value={trailerVideoUrl}
                      onChange={(e) => setTrailerVideoUrl(e.target.value)}
                      placeholder="/videos/8.mp4 or any https link"
                      className="w-full bg-zinc-900 border border-white/10 p-3 rounded text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      Or Upload Trailer File (.mp4)
                    </span>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-accent rounded p-4 text-center cursor-pointer hover:bg-white/5 transition-all animate-fadeIn">
                      <Upload className="w-5 h-5 text-zinc-500 mb-2" />
                      <span className="text-xs font-bold text-zinc-300">Upload video clip</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">Supports standard MP4 format</span>
                      <input 
                        type="file" 
                        accept="video/mp4" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleConfigLocalUpload(file, 'trailer');
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION B: PROFILE AVATARS */}
              <div className="bg-zinc-950/60 p-5 rounded-lg border border-white/5 space-y-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#ff2d55] flex items-center gap-2">
                  <User className="w-4 h-4" /> 2. Profile Screen Cast Cards
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {/* Girlfriend Cast */}
                  <div className="border border-white/10 p-4 rounded bg-zinc-900/50 space-y-3">
                    <span className="text-[10px] font-black uppercase text-accent tracking-widest block border-b border-white/5 pb-1">
                      Milli (Girlfriend Profile)
                    </span>
                    <div>
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Avatar Image / Video URL
                      </label>
                      <input 
                        type="text" 
                        value={girlfriendProfileImage}
                        onChange={(e) => setGirlfriendProfileImage(e.target.value)}
                        placeholder="e.g. images/millicent1.jpg"
                        className="w-full bg-zinc-900 border border-white/10 p-2 rounded text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Or Upload Profile Media
                      </span>
                      <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded py-2 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleConfigLocalUpload(file, 'girlfriend');
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  {/* Boyfriend Cast */}
                  <div className="border border-white/10 p-4 rounded bg-zinc-900/50 space-y-3">
                    <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block border-b border-white/5 pb-1">
                      Sbu (Boyfriend Profile)
                    </span>
                    <div>
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Avatar Image / Video URL
                      </label>
                      <input 
                        type="text" 
                        value={boyfriendProfileImage}
                        onChange={(e) => setBoyfriendProfileImage(e.target.value)}
                        placeholder="e.g. images/sbu.jpg"
                        className="w-full bg-zinc-900 border border-white/10 p-2 rounded text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Or Upload Profile Media
                      </span>
                      <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded py-2 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleConfigLocalUpload(file, 'boyfriend');
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  {/* Us Together Cast */}
                  <div className="border border-white/15 p-4 rounded bg-zinc-900/50 space-y-3">
                    <span className="text-[10px] font-black uppercase text-pink-400 tracking-widest block border-b border-white/5 pb-1 animate-pulse">
                      Us Together (M🤍S Connection)
                    </span>
                    <div>
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Avatar Image / Video URL
                      </label>
                      <input 
                        type="text" 
                        value={usProfileImage}
                        onChange={(e) => setUsProfileImage(e.target.value)}
                        placeholder="Leave blank or upload files below"
                        className="w-full bg-zinc-900 border border-white/10 p-2 rounded text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                        Or Upload Profile Media
                      </span>
                      <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded py-2 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleConfigLocalUpload(file, 'us');
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: HERO BANNER VIDEOS */}
              <div className="bg-zinc-950/60 p-6 rounded-xl border border-white/5 space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#ff2d55] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" /> 3. Profile-Specific Hero Backdrops
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Set customized slideshow backdrops. Put links to MP4 videos, online images (JPG/PNG/WebP), or <strong className="text-zinc-200">YouTube URLs</strong>. Please put <strong className="text-accent">one URL per line</strong> for optimal, uncluttered organization!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-1">
                  {/* Girlfriend Specific Backdrop */}
                  <div className="border border-white/5 p-5 rounded-xl bg-zinc-900/40 space-y-4 hover:border-accent/20 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-black uppercase text-accent tracking-widest block">
                          Milli's Backdrops
                        </span>
                        <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded font-black uppercase tracking-widest">
                          Girlfriend
                        </span>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Backdrop Links (One per line)
                        </label>
                        <textarea 
                          rows={4}
                          value={girlfriendBannerUrlsText}
                          onChange={(e) => setGirlfriendBannerUrlsText(e.target.value)}
                          placeholder="videos/6.mp4&#10;https://youtube.com/watch?v=...&#10;https://images.unsplash.com/..."
                          className="w-full bg-zinc-950 border border-white/10 p-3 rounded-lg text-[11px] text-white font-mono focus:outline-none focus:border-accent transition-all min-h-[100px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Or Append Local Media file
                        </span>
                        <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded-lg py-2.5 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleConfigLocalUpload(file, 'girlfriend_banner');
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Interactive Preview Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Live Range Preview</span>
                      <button
                        type="button"
                        onClick={() => setShowGirlfriendBackdropPreview(!showGirlfriendBackdropPreview)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${showGirlfriendBackdropPreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                      >
                        {showGirlfriendBackdropPreview ? 'Hide' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {/* Boyfriend Specific Backdrop */}
                  <div className="border border-white/5 p-5 rounded-xl bg-zinc-900/40 space-y-4 hover:border-violet-500/20 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest block">
                          Sbu's Backdrops
                        </span>
                        <span className="text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                          Boyfriend
                        </span>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Backdrop Links (One per line)
                        </label>
                        <textarea 
                          rows={4}
                          value={boyfriendBannerUrlsText}
                          onChange={(e) => setBoyfriendBannerUrlsText(e.target.value)}
                          placeholder="videos/7.mp4&#10;https://youtube.com/watch?v=...&#10;https://images.unsplash.com/..."
                          className="w-full bg-zinc-950 border border-white/10 p-3 rounded-lg text-[11px] text-white font-mono focus:outline-none focus:border-accent transition-all min-h-[100px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Or Append Local Media file
                        </span>
                        <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded-lg py-2.5 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleConfigLocalUpload(file, 'boyfriend_banner');
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Interactive Preview Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Live Range Preview</span>
                      <button
                        type="button"
                        onClick={() => setShowBoyfriendBackdropPreview(!showBoyfriendBackdropPreview)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${showBoyfriendBackdropPreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                      >
                        {showBoyfriendBackdropPreview ? 'Hide' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {/* Us Specific Backdrop */}
                  <div className="border border-white/5 p-5 rounded-xl bg-zinc-900/40 space-y-4 hover:border-pink-500/20 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-black uppercase text-pink-400 tracking-widest block">
                          Us Profile Backdrops
                        </span>
                        <span className="text-[9px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">
                          Us (Together)
                        </span>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Backdrop Links (One per line)
                        </label>
                        <textarea 
                          rows={4}
                          value={usBannerUrlsText}
                          onChange={(e) => setUsBannerUrlsText(e.target.value)}
                          placeholder="videos/8.mp4&#10;https://youtube.com/watch?v=...&#10;https://images.unsplash.com/..."
                          className="w-full bg-zinc-950 border border-white/10 p-3 rounded-lg text-[11px] text-white font-mono focus:outline-none focus:border-accent transition-all min-h-[100px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                          Or Append Local Media file
                        </span>
                        <label className="flex items-center justify-center border border-dashed border-white/10 hover:border-accent rounded-lg py-2.5 px-3 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-300 gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleConfigLocalUpload(file, 'us_banner');
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Interactive Preview Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Live Range Preview</span>
                      <button
                        type="button"
                        onClick={() => setShowUsBackdropPreview(!showUsBackdropPreview)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${showUsBackdropPreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                      >
                        {showUsBackdropPreview ? 'Hide' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual Backdrop preview sheets shown inline on toggle */}
                {(showGirlfriendBackdropPreview || showBoyfriendBackdropPreview || showUsBackdropPreview) && (
                  <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                    {showGirlfriendBackdropPreview && (
                      <div className="space-y-2 animate-fadeIn">
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent">Milli's Backdrops Preview:</span>
                        <SequencePreviewGrid urlsText={girlfriendBannerUrlsText} />
                      </div>
                    )}
                    {showBoyfriendBackdropPreview && (
                      <div className="space-y-2 animate-fadeIn">
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Sbu's Backdrops Preview:</span>
                        <SequencePreviewGrid urlsText={boyfriendBannerUrlsText} />
                      </div>
                    )}
                    {showUsBackdropPreview && (
                      <div className="space-y-2 animate-fadeIn">
                        <span className="text-[9px] font-black uppercase tracking-widest text-pink-400">Us Backdrops Preview:</span>
                        <SequencePreviewGrid urlsText={usBannerUrlsText} />
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-white/5 pt-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      General Global Fallback Backdrops (One per line)
                    </label>
                    <textarea 
                      rows={3}
                      value={bannerUrlsText}
                      onChange={(e) => setBannerUrlsText(e.target.value)}
                      placeholder="videos/6.mp4&#10;videos/7.mp4"
                      className="w-full bg-zinc-950 border border-white/10 p-3 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-accent min-h-[80px]"
                    />
                  </div>

                  {/* Fallback Interactive Preview */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Live Global Range Preview</span>
                    <button
                      type="button"
                      onClick={() => setShowGlobalBackdropPreview(!showGlobalBackdropPreview)}
                      className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${showGlobalBackdropPreview ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'}`}
                    >
                      {showGlobalBackdropPreview ? 'Hide Global Preview' : 'Verify Global Links'}
                    </button>
                  </div>

                  {showGlobalBackdropPreview && (
                    <div className="animate-fadeIn">
                      <SequencePreviewGrid urlsText={bannerUrlsText} />
                    </div>
                  )}

                  <div>
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Or Upload and Append General Backdrop File (.mp4)
                    </span>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-accent rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-all">
                      <Upload className="w-6 h-6 text-zinc-500 mb-2" />
                      <span className="text-xs font-bold text-zinc-300">Upload background video</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">Appends to the above global list automatically</span>
                      <input 
                        type="file" 
                        accept="video/mp4" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleConfigLocalUpload(file, 'banner');
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>



                {/* Background Sound Preferences */}
                <div className="border-t border-white/5 pt-4">
                  <div className="space-y-3 p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="space-y-0.5 pr-4">
                        <span className="block text-[10px] font-black text-zinc-100 uppercase tracking-widest">
                          Background Video Sound
                        </span>
                        <span className="block text-[10px] text-zinc-400">
                          Enable this option to play the audio/soundtrack from the active background video or YouTube link.
                        </span>
                      </div>
                      <div className="shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={backgroundSoundEnabled}
                            onChange={(e) => {
                              setBackgroundSoundEnabled(e.target.checked);
                              // Sync state immediately via custom event so background gets updated before saving
                              window.dispatchEvent(new CustomEvent('millifix-play-backdrop-audio', { 
                                detail: { play: e.target.checked, soundEnabled: e.target.checked } 
                              }));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:after:bg-white" />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundSoundEnabled(true);
                          window.dispatchEvent(new CustomEvent('millifix-play-backdrop-audio', { 
                            detail: { play: true, soundEnabled: true } 
                          }));
                        }}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white font-black text-[9px] uppercase tracking-wider hover:opacity-95 active:scale-95 transition-all text-center"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Play Backdrop Audio
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundSoundEnabled(false);
                          window.dispatchEvent(new CustomEvent('millifix-play-backdrop-audio', { 
                            detail: { play: false, soundEnabled: false } 
                          }));
                        }}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white font-black text-[9px] uppercase tracking-wider hover:bg-zinc-700/50 active:scale-95 transition-all text-center"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        Mute Soundtrack
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVE FORM ACTIONS */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-2.5 rounded text-xs font-black uppercase tracking-widest bg-accent hover:bg-accent/90 text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Customizations
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SPEED & CACHE PURGE                               */}
          {/* ======================================================== */}
          {activeTab === 'cache_speed' && (
            <div className="space-y-6 animate-fadeIn py-2">
              <div className="bg-zinc-950/70 p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Zap className="w-5 h-5 fill-current" />
                      App Load Accelerator & Cache Purge
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Remove bloated browser cache, stale service workers, and disk persistence data so the app opens instantly on any device.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Direct Network Active
                    </span>
                  </div>
                </div>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Cache Storage</span>
                      <HardDrive className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-sm font-black text-white">Purged on Boot</div>
                    <p className="text-[10px] text-zinc-500">Stale JS/CSS bundles and heavy media chunks are cleared</p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Service Worker</span>
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-sm font-black text-white">Direct Network</div>
                    <p className="text-[10px] text-zinc-500">Zero proxy stalls or offline caching delays</p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Firestore DB</span>
                      <Sparkles className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-sm font-black text-white">Memory Local Cache</div>
                    <p className="text-[10px] text-zinc-500">Bypasses slow disk IndexedDB reads on startup</p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">App Storage</span>
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-sm font-black text-white">Optimized & Trimmed</div>
                    <p className="text-[10px] text-zinc-500">Temporary reload loops and bloated history pruned</p>
                  </div>
                </div>

                {/* Purge Result Notification */}
                {purgeResult && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Cache Purged Successfully!
                    </div>
                    <p className="text-xs text-zinc-300">
                      Cleared {purgeResult.cachesCleared} cache partitions, unregistered {purgeResult.serviceWorkersUnregistered} service workers, and pruned local storage.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={isPurgingCache}
                    onClick={handlePurgeAllCaches}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isPurgingCache ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Purging Cache...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Purge All Cache & Boost Load Speed Now
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload App Cleanly
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: MOVIE CREDITS & BACKGROUND MEDIA                   */}
          {/* ======================================================== */}
          {activeTab === 'credits_config' && (
            <AdminCreditsSettings onSuccess={onSuccess} />
          )}

        </div>
      </motion.div>
    </div>
  );
}
