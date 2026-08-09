import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, Sparkles, Layers, Sliders, Check } from 'lucide-react';

export interface SectionConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  icon: string;
}

export type ScrollAnimationType = 'fade-up' | 'scale-up' | 'slide-left' | 'slide-right' | 'bounce' | 'flip-3d' | 'none';

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', name: 'Hero Spotlight', description: 'Featured trailer & high-definition hero carousel', visible: true, icon: '🎬' },
  { id: 'categories', name: 'Episodes & Collections', description: 'Categorized memories & custom slide episodes', visible: true, icon: '🍿' },
  { id: 'continue_watching', name: 'Continue Watching', description: 'Pick up where you left off in your slide deck', visible: true, icon: '⏱️' },
  { id: 'what_to_do', name: 'What To Do Together', description: 'Interactive couple bucket list & date night ideas', visible: true, icon: '📝' },
  { id: 'love_notes', name: 'Love Notes Board', description: 'Sticky notes, compliments, and romantic letters', visible: true, icon: '💌' },
  { id: 'soundtrack', name: 'Soundtrack & Vinyl Player', description: 'Personalized song dedications and vinyl player', visible: true, icon: '🎵' },
  { id: 'credits', name: 'Credits & Production Team', description: 'Special acknowledgments & director credits', visible: true, icon: '🌟' },
];

export const ANIMATION_OPTIONS: { id: ScrollAnimationType; label: string; desc: string; icon: string }[] = [
  { id: 'fade-up', label: 'Smooth Fade Up', desc: 'Gentle upward slide with fading opacity', icon: '⬆️' },
  { id: 'scale-up', label: 'Scale & Pop', desc: 'Zooms softly from 90% size into focus', icon: '🔍' },
  { id: 'slide-left', label: 'Slide In Left', desc: 'Glides smoothly in from the left border', icon: '⬅️' },
  { id: 'slide-right', label: 'Slide In Right', desc: 'Glides smoothly in from the right border', icon: '➡️' },
  { id: 'bounce', label: 'Elastic Bounce', desc: 'Playful subtle overshoot animation', icon: '✨' },
  { id: 'flip-3d', label: '3D Tilt Flip', desc: 'Perspective 3D tilt forward reveal', icon: '🎲' },
  { id: 'none', label: 'Instant (No Animation)', desc: 'Static rendering without scroll movement', icon: '⚡' },
];

interface SectionCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionConfig[];
  onUpdateSections: (newSections: SectionConfig[]) => void;
  scrollAnimation: ScrollAnimationType;
  onUpdateAnimation: (anim: ScrollAnimationType) => void;
  onReset: () => void;
}

export default function SectionCustomizerModal({
  isOpen,
  onClose,
  sections,
  onUpdateSections,
  scrollAnimation,
  onUpdateAnimation,
  onReset,
}: SectionCustomizerModalProps) {
  if (!isOpen) return null;

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    onUpdateSections(newSections);
  };

  const toggleVisibility = (id: string) => {
    const newSections = sections.map((sec) =>
      sec.id === id ? { ...sec, visible: !sec.visible } : sec
    );
    onUpdateSections(newSections);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] flex flex-col text-left"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  Customize Layout & Scroll Animations
                </h2>
              </div>
              <p className="text-xs text-text-dim">
                Arrange your favorite homepage sections, toggle visibility, and pick your scroll reveal style.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto pr-1 space-y-6 flex-1 custom-scrollbar">
            {/* Scroll Animations Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choose Scroll Reveal Animation</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Applies to all homepage cards
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ANIMATION_OPTIONS.map((anim) => {
                  const isSelected = scrollAnimation === anim.id;
                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => onUpdateAnimation(anim.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-accent/15 border-accent text-white shadow-[0_0_15px_rgba(255,45,85,0.2)]'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{anim.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{anim.label}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{anim.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Reordering List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Section Order & Visibility</span>
                </label>
                <span className="text-[10px] text-zinc-500">
                  Use arrows to shift sequence
                </span>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      sec.visible
                        ? 'bg-zinc-900/80 border-white/10 text-white'
                        : 'bg-zinc-950 border-white/5 opacity-50 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{sec.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-black tracking-wide flex items-center gap-2">
                          <span>{sec.name}</span>
                          {!sec.visible && (
                            <span className="text-[9px] uppercase font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                              Hidden
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{sec.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, 'up')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-white/10 text-zinc-300 disabled:opacity-20 disabled:hover:bg-black/40 cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === sections.length - 1}
                        onClick={() => moveSection(idx, 'down')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-white/10 text-zinc-300 disabled:opacity-20 disabled:hover:bg-black/40 cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(sec.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          sec.visible
                            ? 'bg-accent/20 text-accent hover:bg-accent/30'
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={sec.visible ? 'Hide Section' : 'Show Section'}
                      >
                        {sec.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 gap-4">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-accent hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
