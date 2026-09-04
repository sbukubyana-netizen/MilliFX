import React, { useState, useEffect } from 'react';
import { 
  Film, Clapperboard, Video, Image as ImageIcon, Sparkles, 
  Trash2, Plus, RefreshCw, Check, Upload, Eye, Sliders, 
  Heart, AlertCircle 
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CreditsConfig, CreditSectionData, CreditEntry, DEFAULT_CINEMA_CREDITS } from './CreditsSection';

interface AdminCreditsSettingsProps {
  onSuccess: (message: string) => void;
}

const PRESET_BACKGROUNDS = [
  {
    name: 'Starlit Galaxy (Image)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Golden Hour Sunset (Image)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Romantic Candlelight (Image)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Lo-Fi Love Night (Image)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cinematic Stars Particle (Video)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
  },
  {
    name: 'Warm Glowing Bokeh (Video)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-golden-bokeh-lights-background-41484-large.mp4',
  },
];

export default function AdminCreditsSettings({ onSuccess }: AdminCreditsSettingsProps) {
  const [bgType, setBgType] = useState<'none' | 'video' | 'image'>('none');
  const [bgMediaUrl, setBgMediaUrl] = useState('');
  const [bgOpacity, setBgOpacity] = useState(0.35);
  const [title, setTitle] = useState('MilliSbu Original Production');
  const [subtitle, setSubtitle] = useState('Season 1: Still deeply in love with you 🤍');
  const [quote, setQuote] = useState('Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.');
  const [sections, setSections] = useState<CreditSectionData[]>(DEFAULT_CINEMA_CREDITS);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load existing configuration from Firestore
  useEffect(() => {
    async function loadConfig() {
      try {
        const docSnap = await getDoc(doc(db, 'credits_config', 'main'));
        if (docSnap.exists()) {
          const data = docSnap.data() as CreditsConfig;
          if (data.bgType) setBgType(data.bgType);
          if (data.bgMediaUrl) setBgMediaUrl(data.bgMediaUrl);
          if (typeof data.bgOpacity === 'number') setBgOpacity(data.bgOpacity);
          if (data.title) setTitle(data.title);
          if (data.subtitle) setSubtitle(data.subtitle);
          if (data.quote) setQuote(data.quote);
          if (Array.isArray(data.sections) && data.sections.length > 0) {
            setSections(data.sections);
          }
        }
      } catch (err) {
        console.error("Failed to load credits config:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Save changes to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const configData: CreditsConfig = {
        id: 'main',
        updatedAt: new Date().toISOString(),
        bgType,
        bgMediaUrl: bgMediaUrl.trim(),
        bgOpacity,
        title: title.trim(),
        subtitle: subtitle.trim(),
        quote: quote.trim(),
        sections,
      };

      await setDoc(doc(db, 'credits_config', 'main'), configData);
      onSuccess("Movie Credits & Background media successfully updated!");
    } catch (err) {
      console.error("Error saving credits config:", err);
      handleFirestoreError(err, OperationType.WRITE, 'credits_config/main');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default romantic credits
  const handleResetDefaults = () => {
    if (window.confirm("Reset credits cast, titles, and sections to original defaults?")) {
      setTitle('MilliSbu Original Production');
      setSubtitle('Season 1: Still deeply in love with you 🤍');
      setQuote('Every single frame of our lives is brighter because of you. Thank you for making every day feel like a motion picture worth watching a million times.');
      setSections(DEFAULT_CINEMA_CREDITS);
    }
  };

  // File upload handler (image or video to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // Check size limit (< 1.2MB for base64 in Firestore)
    if (file.size > 1.2 * 1024 * 1024) {
      setUploadError("File size exceeds 1.2MB limit for direct uploads. Please use a direct URL or a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBgMediaUrl(result);
      if (file.type.startsWith('video/')) {
        setBgType('video');
      } else {
        setBgType('image');
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  // Add new Category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setSections(prev => [
      ...prev,
      {
        category: newCategoryName.trim().toUpperCase(),
        entries: [
          { role: 'NEW ROLE', name: 'Person Name', note: 'Sweet note' }
        ]
      }
    ]);
    setNewCategoryName('');
    setActiveCategoryIndex(sections.length);
  };

  // Remove Category
  const handleRemoveCategory = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    if (activeCategoryIndex === index) {
      setActiveCategoryIndex(null);
    }
  };

  // Update Category Title
  const handleUpdateCategoryTitle = (index: number, newName: string) => {
    setSections(prev => prev.map((cat, i) => i === index ? { ...cat, category: newName.toUpperCase() } : cat));
  };

  // Add Entry to Category
  const handleAddEntry = (catIndex: number) => {
    setSections(prev => prev.map((cat, i) => {
      if (i !== catIndex) return cat;
      return {
        ...cat,
        entries: [
          ...cat.entries,
          { role: 'NEW ROLE', name: 'Name', note: '' }
        ]
      };
    }));
  };

  // Update Entry
  const handleUpdateEntry = (catIndex: number, entryIndex: number, field: keyof CreditEntry, value: string) => {
    setSections(prev => prev.map((cat, cIdx) => {
      if (cIdx !== catIndex) return cat;
      return {
        ...cat,
        entries: cat.entries.map((entry, eIdx) => {
          if (eIdx !== entryIndex) return entry;
          return { ...entry, [field]: value };
        })
      };
    }));
  };

  // Delete Entry
  const handleDeleteEntry = (catIndex: number, entryIndex: number) => {
    setSections(prev => prev.map((cat, cIdx) => {
      if (cIdx !== catIndex) return cat;
      return {
        ...cat,
        entries: cat.entries.filter((_, eIdx) => eIdx !== entryIndex)
      };
    }));
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Credits Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn py-2 max-w-5xl mx-auto">
      
      {/* Top Banner / Actions */}
      <div className="bg-zinc-950/80 p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
            <Clapperboard className="w-3 h-3" />
            <span>Movie Finale Studio</span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            Movie Credits & Background Media Customizer
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl">
            Edit the cinematic rolling credits, customize cast & crew roles, add romantic titles, and set a custom background video or image!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-accent hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-accent/25 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Credits
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: BACKGROUND MEDIA SETTINGS */}
      <div className="bg-zinc-950/70 p-6 rounded-2xl border border-white/10 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" />
              Credits Atmosphere Background (Video / Image)
            </h4>
            <p className="text-xs text-zinc-400">
              Select whether to show a pure black cinema backdrop, a romantic background image, or an ambient looping video behind the rolling text.
            </p>
          </div>
        </div>

        {/* Media Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'none', label: 'Pure Black Cinema', desc: 'Classic Hollywood contrast', icon: Film },
            { id: 'image', label: 'Background Image', desc: 'Custom photo or wallpaper', icon: ImageIcon },
            { id: 'video', label: 'Background Video', desc: 'Ambient looping mp4', icon: Video },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = bgType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setBgType(type.id as any)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected 
                    ? 'bg-accent/15 border-accent text-white shadow-md' 
                    : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'opacity-60'}`} />
                  {isSelected && <span className="w-2 h-2 rounded-full bg-accent animate-ping" />}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">{type.label}</div>
                  <div className="text-[10px] text-zinc-500 font-medium">{type.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* URL Input & Upload when Image or Video is selected */}
        {bgType !== 'none' && (
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                {bgType === 'video' ? 'Background Video URL (.mp4)' : 'Background Image URL'}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder={bgType === 'video' ? "https://example.com/ambient-loop.mp4" : "https://images.unsplash.com/..."}
                  value={bgMediaUrl}
                  onChange={(e) => setBgMediaUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent font-mono"
                />
                
                {/* Upload from Device button */}
                <label className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all">
                  <Upload className="w-4 h-4 text-accent" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept={bgType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadError && (
                <div className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Or choose from romantic atmosphere presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_BACKGROUNDS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBgType(preset.type);
                      setBgMediaUrl(preset.url);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:border-accent/40 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {preset.type === 'video' ? <Video className="w-3 h-3 text-accent" /> : <ImageIcon className="w-3 h-3 text-accent" />}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent" />
                  Background Opacity
                </span>
                <span className="font-mono text-accent">{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.90"
                step="0.05"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="w-full accent-accent h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">
                Tip: Keeping opacity between 25% - 45% ensures the movie text stays crisp and easy to read.
              </p>
            </div>

            {/* Mini Atmosphere Preview */}
            {bgMediaUrl && (
              <div className="relative h-44 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                {bgType === 'image' ? (
                  <img
                    src={bgMediaUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={{ opacity: bgOpacity }}
                  />
                ) : (
                  <video
                    src={bgMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ opacity: bgOpacity }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
                <div className="absolute z-10 text-center space-y-1">
                  <div className="text-[10px] font-mono tracking-widest text-accent uppercase font-black">
                    Live Background Preview
                  </div>
                  <div className="text-sm font-serif font-black text-white uppercase tracking-wider">
                    {title || "MilliSbu Original Production"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: PRODUCTION TITLES & CLOSING QUOTE */}
      <div className="bg-zinc-950/70 p-6 rounded-2xl border border-white/10 space-y-5 shadow-lg">
        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          Production Titles & Romantic Closing Quote
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Main Production Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="MilliSbu Original Production"
              maxLength={120}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Subtitle / Season Tag
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Season 1: Still deeply in love with you 🤍"
              maxLength={150}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Closing Love Quotation
          </label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={2}
            maxLength={350}
            placeholder="Every single frame of our lives is brighter because of you..."
            className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* SECTION 3: CAST, CATEGORIES & CREDITS ROLL DATA */}
      <div className="bg-zinc-950/70 p-6 rounded-2xl border border-white/10 space-y-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Credits Categories & Cast Roles ({sections.length} Categories)
            </h4>
            <p className="text-xs text-zinc-400">
              Customize every department, actor, director, inside joke, and sweet note rolled on the Hollywood cinema screen.
            </p>
          </div>

          {/* Add Category input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New Category (e.g. SOUNDTRACK)..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3.5 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 hover:opacity-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Category Accordion / List */}
        <div className="space-y-4">
          {sections.map((cat, catIdx) => {
            const isExpanded = activeCategoryIndex === catIdx;
            return (
              <div 
                key={catIdx}
                className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/40"
              >
                {/* Category Header */}
                <div className="px-4 py-3 bg-zinc-900/90 border-b border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryIndex(isExpanded ? null : catIdx)}
                      className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2 text-left cursor-pointer hover:underline"
                    >
                      <span>{catIdx + 1}.</span>
                      <span>{cat.category}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({cat.entries.length} roles)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => handleUpdateCategoryTitle(catIdx, e.target.value)}
                      className="hidden sm:block px-2.5 py-1 bg-black/40 border border-white/10 rounded text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-accent"
                      title="Quick rename category"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddEntry(catIdx)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs cursor-pointer"
                      title="Add role to this category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(catIdx)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category Entries Table */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-black/30">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">
                      <div className="col-span-4">Role / Title</div>
                      <div className="col-span-4">Person / Credited Name</div>
                      <div className="col-span-3">Romantic Note (Optional)</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>

                    <div className="space-y-2">
                      {cat.entries.map((entry, entryIdx) => (
                        <div 
                          key={entryIdx}
                          className="grid grid-cols-12 gap-2 items-center bg-zinc-950/60 p-2 rounded-xl border border-white/5 hover:border-white/15 transition-all"
                        >
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={entry.role}
                              onChange={(e) => handleUpdateEntry(catIdx, entryIdx, 'role', e.target.value)}
                              placeholder="e.g. EXECUTIVE PRODUCER"
                              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-accent font-mono uppercase"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="text"
                              value={entry.name}
                              onChange={(e) => handleUpdateEntry(catIdx, entryIdx, 'name', e.target.value)}
                              placeholder="e.g. Millicent 🤍"
                              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-accent font-bold"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="text"
                              value={entry.note || ''}
                              onChange={(e) => handleUpdateEntry(catIdx, entryIdx, 'note', e.target.value)}
                              placeholder="e.g. Queen of My Heart"
                              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-accent italic"
                            />
                          </div>

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(catIdx, entryIdx)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddEntry(catIdx)}
                      className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Cast / Role to {cat.category}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
