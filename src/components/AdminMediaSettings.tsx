import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Video, Image as ImageIcon, Settings, Sparkles, Check, HelpCircle, Upload, Film, Edit, RefreshCw } from 'lucide-react';
import { collection, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Episode, Memory, CATEGORIES } from '../constants';

interface AdminMediaSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  allEpisodes: Episode[];
}

const PRESET_COVERS = [
  { name: 'Romantic Sunset', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Golden Hour Sparkle', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cozy Fireplace', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
  { name: 'Night Under Stars', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80' },
];

export default function AdminMediaSettings({ isOpen, onClose, onSuccess, allEpisodes }: AdminMediaSettingsProps) {
  // Current Active Menu Section/Tab
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // --- SECTION 1: CREATE EPISODE STATE ---
  const [categoryType, setCategoryType] = useState<'existing' | 'new'>('existing');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[1]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [createMemories, setCreateMemories] = useState<Memory[]>([]);

  // --- SECTION 2: EDIT EPISODE STATE ---
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editMemories, setEditMemories] = useState<Memory[]>([]);

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
    // Up to 8 total files limit check
    const currentCount = isEditMode ? editMemories.length : createMemories.length;
    const remainingSlots = 8 - currentCount;
    if (remainingSlots <= 0) {
      alert("You have already reached the limit of 8 files for this slideshow! Delete some files if you wish to upload replacements.");
      return;
    }

    const filesToLoad = files.slice(0, remainingSlots);

    filesToLoad.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        // For video files, we need a preset thumbnail cover if none exists
        const defaultThumbnail = isVideo 
          ? PRESET_COVERS[0].url 
          : base64;

        const newMemory: Memory = {
          id: `mom-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.split('.')[0]?.substring(0, 30) || 'Cherished Memory',
          imageUrl: defaultThumbnail,
          videoUrl: isVideo ? base64 : undefined,
          description: 'A quiet, precious moment preserved forever ✨'
        };

        if (isEditMode) {
          setEditMemories(prev => [...prev, newMemory]);
        } else {
          setCreateMemories(prev => [...prev, newMemory]);
          // Automatically use the first loaded picture/video preview as default episode cover if empty
          setCreateMemories(currentList => {
            if (currentList.length === 1 && !customCoverUrl) {
              setCustomCoverUrl(defaultThumbnail);
            }
            return currentList;
          });
        }
      };
      reader.readAsDataURL(file);
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
      images: finalMemories
    };

    try {
      await setDoc(doc(db, 'custom_episodes', newId), newEpisode);
      
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
      images: editMemories
    };

    try {
      await setDoc(doc(db, 'custom_episodes', selectedEpisodeId), updatedEpisode);
      onSuccess(`Successfully revised "${updatedEpisode.title}". Changes synced across all devices!`);
      setIsSaving(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `custom_episodes/${selectedEpisodeId}`);
      setIsSaving(false);
    }
  };

  // REVERT OVERRIDES OR DELETE CUSTOM CARDS
  const handleRevertOrDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete custom configurations for "${name}"? This deletes the uploads or resets it to the factory defaults.`)) {
      try {
        await deleteDoc(doc(db, 'custom_episodes', id));
        setSelectedEpisodeId('');
        onSuccess(`Reverted/Deleted customization for "${name}" successfully.`);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `custom_episodes/${id}`);
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
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-3 md:p-6" id="editor-dashboard-modal-outer">
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
        className="relative bg-zinc-900 border border-white/10 w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 text-white font-sans"
        id="editor-dashboard-modal-inner"
      >
        {/* Upper Header Control Area */}
        <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                STUDIO PRODUCTION STUDIO
                <span className="text-[9px] bg-accent/20 text-accent font-black uppercase tracking-wider px-2 py-0.5 rounded">All-Devices Sync</span>
              </h2>
              <p className="text-[11px] text-zinc-400">Add local media up to 8 files, configure captions, and edit existing rows directly without code.</p>
            </div>
          </div>
          
          {/* Close trigger */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 border border-transparent hover:border-white/15 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector Sections */}
        <div className="bg-zinc-950/80 px-4 md:px-6 py-2.5 border-b border-white/10 flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'create' ? 'bg-accent text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Plus className="w-4 h-4" />
            📽️ Create Modern Card
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'edit' ? 'bg-accent text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Edit className="w-4 h-4" />
            ✏️ Manage & Customize Cards
          </button>
        </div>

        {/* Tab content area container */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">

          {/* TAB 1: CREATE SLIDESHOW CARD */}
          {activeTab === 'create' && (
            <form onSubmit={handleSaveNewCourse} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Information inputs */}
                <div className="md:col-span-6 space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
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
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:ring-1 focus:ring-accent outline-none text-zinc-300"
                        >
                          {CATEGORIES.filter(c => c !== 'Global Top 10 in MilliFix' && c !== 'Continue Watching').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
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

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
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
                      <div className="grid grid-cols-4 gap-1.5">
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

                {/* Local Upload / Drag & Drop area */}
                <div className="md:col-span-6 space-y-4">
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
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">Supports images (.png, .jpg, .webp) or videos (.mp4) up to 8 files total. Autoplay slideshow generates seamlessly.</p>
                    <button 
                      type="button" 
                      className="mt-4 px-4 py-1.5 bg-accent/20 border border-accent/30 text-accent hover:bg-accent hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Browse Files
                    </button>
                  </div>

                  {/* uploaded count */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Uploaded Array Slides:</span>
                    <span className="text-[10px] bg-accent/20 text-accent font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {createMemories.length} / 8 Limit
                    </span>
                  </div>

                  {/* Empty Upload queue state */}
                  {createMemories.length === 0 && (
                    <div className="p-8 border border-white/5 bg-zinc-950/40 rounded-xl text-center">
                      <Film className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">No files loaded yet. Build a cinematic slide deck by dragging files in!</p>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createMemories.map((slide, idx) => (
                      <div key={slide.id} className="p-3.5 bg-zinc-950 border border-white/10 rounded-xl flex gap-3 h-32 items-stretch">
                        <div className="w-20 rounded overflow-hidden bg-black/50 border border-white/5 flex-shrink-0 relative">
                          {slide.videoUrl ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/5">
                              <Film className="w-6 h-6 text-accent" />
                              <span className="absolute bottom-1 right-1 text-[7px] bg-accent text-white px-1 py-0.2 rounded font-black tracking-widest">VIDEO CLIP</span>
                            </div>
                          ) : (
                            <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
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
                              className="w-full bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] focus:border-accent outline-none text-zinc-300 resize-none h-12 leading-tight"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
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
              
              {/* Dropdown to select any Row from current list of episodes */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-accent block">Choose Existing Card to Edit / Modify:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedEpisodeId}
                    onChange={(e) => setSelectedEpisodeId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-white/15 p-2.5 rounded-lg text-xs focus:ring-1 focus:ring-accent outline-none text-white font-bold"
                  >
                    <option value="" className="text-zinc-500">-- Select a Card below --</option>
                    {CATEGORIES.filter(c => c !== 'Global Top 10 in MilliFix' && c !== 'Continue Watching').map((category) => {
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

                  {/* Revert custom Overrides button (available if edit custom or override on presets) */}
                  {selectedEpisodeId && (
                    <button
                      type="button"
                      onClick={() => handleRevertOrDelete(selectedEpisodeId, editTitle)}
                      className="px-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                      title="Clear Customizations and Revert to Default preset"
                    >
                      Delete Or Reset overrides
                    </button>
                  )}
                </div>
              </div>

              {/* Selection is loaded */}
              {selectedEpisodeId ? (
                <form onSubmit={handleSaveChangesOnExisting} className="space-y-6 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Information inputs */}
                    <div className="md:col-span-6 space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
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
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Edit Row Category Location</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-2 rounded text-xs focus:border-accent outline-none text-zinc-300"
                          >
                            {CATEGORIES.filter(c => c !== 'Global Top 10 in MilliFix' && c !== 'Continue Watching').map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
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
                          <div className="grid grid-cols-4 gap-1.5">
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

                    {/* Add More Media via Local Uploads to Slideshow */}
                    <div className="md:col-span-6 space-y-4">
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
                        <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">Instantly appends uploads to the slideshow queue (maximum 8 allowed total in the slide series).</p>
                        <button 
                          type="button" 
                          className="mt-4 px-4 py-1.5 bg-accent/20 border border-accent/30 text-accent hover:bg-accent hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Append Media
                        </button>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Current Slides count:</span>
                        <span className="text-[10px] bg-accent/25 text-accent font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          {editMemories.length} / 8 Limit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit list of images/videos slideshow */}
                  <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2 flex items-center gap-1.5 border-b border-white/5 pb-2">
                      🎙️ Edit Exist Slides Captions & Slide Dialogues or Re-order
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editMemories.map((slide, idx) => (
                        <div key={slide.id} className="p-3.5 bg-zinc-950 border border-white/10 rounded-xl flex gap-3 h-32 items-stretch">
                          <div className="w-20 rounded overflow-hidden bg-black/50 border border-white/5 flex-shrink-0 relative">
                            {slide.videoUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/5">
                                <Film className="w-6 h-6 text-accent" />
                                <span className="absolute bottom-0.5 right-0.5 text-[6px] bg-accent text-white px-1 py-0.2 rounded font-black">VIDEO LINK</span>
                              </div>
                            ) : (
                              <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-w-0">
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
                                className="w-full bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] focus:border-accent outline-none text-zinc-300 resize-none h-12 leading-tight"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
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
                  <p className="text-xs text-zinc-400 font-medium max-w-xs">Choose any active card row from the interactive dropdown list above to modify covers, captions, or add up to 8 slides of media!</p>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
