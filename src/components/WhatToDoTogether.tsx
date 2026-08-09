import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, Edit2, Sparkles, AlertCircle, Heart, Star, CheckSquare, Square, Calendar, X } from 'lucide-react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface WhatToDoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  createdBy: string;
}

interface WhatToDoTogetherProps {
  currentUserProfile?: 'Girlfriend' | 'Boyfriend' | 'Us';
}

export default function WhatToDoTogether({ currentUserProfile = 'Girlfriend' }: WhatToDoTogetherProps) {
  const [items, setItems] = useState<WhatToDoItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string>(
    currentUserProfile === 'Boyfriend' ? 'Sbu 🤍' : 'Milli 🤍'
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-sync creator when profile switches
  useEffect(() => {
    setSelectedCreator(currentUserProfile === 'Boyfriend' ? 'Sbu 🤍' : 'Milli 🤍');
  }, [currentUserProfile]);

  // Real-time listener for checklist items
  useEffect(() => {
    const collRef = collection(db, 'what_to_do_together');
    const unsub = onSnapshot(
      collRef,
      (snapshot) => {
        const fetchedList: WhatToDoItem[] = [];
        snapshot.forEach((docSnap) => {
          fetchedList.push({ id: docSnap.id, ...docSnap.data() } as WhatToDoItem);
        });
        // Sort items by creation date (newest first or oldest first)
        fetchedList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setItems(fetchedList);
      },
      (error) => {
        console.error('Error listening to what_to_do_together checklist:', error);
        handleFirestoreError(error, OperationType.LIST, 'what_to_do_together');
      }
    );
    return () => unsub();
  }, []);

  // Calculate statistics
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Add standard checklist item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const id = 'task_' + Date.now();
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newItem: WhatToDoItem = {
      id,
      text: newItemText.trim(),
      completed: false,
      createdAt: currentDate,
      createdBy: selectedCreator,
    };

    try {
      setErrorMessage(null);
      await setDoc(doc(db, 'what_to_do_together', id), newItem);
      setNewItemText('');
    } catch (err) {
      console.error('Failed to create checklist item:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `what_to_do_together/${id}`);
      } catch (formattedErr: any) {
        setErrorMessage('Could not add item to database. Please check permissions.');
      }
    }
  };

  // Toggle item completed state
  const handleToggleCompleted = async (item: WhatToDoItem) => {
    const updated = { ...item, completed: !item.completed };
    try {
      setErrorMessage(null);
      await setDoc(doc(db, 'what_to_do_together', item.id), updated);
    } catch (err) {
      console.error('Failed to toggle checklist item completion:', err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `what_to_do_together/${item.id}`);
      } catch {
        setErrorMessage('Could not update task status.');
      }
    }
  };

  // Start editing a task
  const handleStartEdit = (item: WhatToDoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  // Save changes to edited task
  const handleSaveEdit = async (item: WhatToDoItem) => {
    if (!editingText.trim()) return;
    const updated = { ...item, text: editingText.trim() };
    try {
      setErrorMessage(null);
      await setDoc(doc(db, 'what_to_do_together', item.id), updated);
      setEditingId(null);
      setEditingText('');
    } catch (err) {
      console.error('Failed to edit task text:', err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `what_to_do_together/${item.id}`);
      } catch {
        setErrorMessage('Failed to save edit.');
      }
    }
  };

  // Delete a task item
  const handleDeleteItem = async (id: string) => {
    try {
      setErrorMessage(null);
      await deleteDoc(doc(db, 'what_to_do_together', id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `what_to_do_together/${id}`);
      } catch {
        setErrorMessage('Could not delete checklist item.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 xs:py-12" id="what-to-do-together-section">
      <div className="relative rounded-2xl md:rounded-3xl bg-zinc-950/60 border border-white/5 backdrop-blur-xl p-6 md:p-10 shadow-2xl space-y-8 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/15 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 blur-3xl rounded-full" />

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">📝</span>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                What To Do Together
                <span className="text-accent">🤍</span>
              </h2>
            </div>
            <p className="text-xs text-text-dim max-w-lg leading-relaxed">
              Our shared dynamic check list for dreams, romantic dates, movies, trips, and beautiful memories to unlock together.
            </p>
          </div>

          {/* Stats Ring / Bar */}
          {totalCount > 0 && (
            <div className="flex flex-col items-start md:items-end gap-1.5">
              <div className="text-xs text-text-dim font-bold uppercase tracking-wider flex items-center gap-2">
                <span>Completed Progress</span>
                <span className="text-white font-black bg-accent/20 px-2 py-0.5 rounded text-[10px] tracking-normal">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-48">
                <div className="w-full bg-zinc-800/60 rounded-full h-2 overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-accent shadow-[0_0_10px_var(--accent-main)]"
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-black text-accent w-8 text-right font-mono">
                  {progressPercent}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error alerting */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Add New CheckItem Form */}
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Suggest a beautiful adventure or date night here..."
                maxLength={450}
                className="w-full py-3.5 pl-4 pr-12 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] font-mono">
                {newItemText.length}/450
              </div>
            </div>

            {/* Creator selector */}
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl p-1.5 px-3 min-h-[46px]">
              <span className="text-[10px] uppercase font-black tracking-widest text-text-dim whitespace-nowrap">By:</span>
              <div className="flex gap-1.5 w-full">
                {['Milli 🤍', 'Sbu 🤍'].map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => setSelectedCreator(person)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCreator === person
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-zinc-900/50 text-text-dim hover:text-white'
                    }`}
                  >
                    {person}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="py-3 px-6 bg-accent text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-accent/20 border border-accent/10 min-h-[46px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Date Idea</span>
            </motion.button>
          </div>
        </form>

        {/* Checklist Rows wrapper */}
        <div className="space-y-2.5">
          {items.length === 0 ? (
            <div className="py-12 border border-dashed border-white/5 rounded-2xl text-center space-y-3 bg-zinc-900/10">
              <p className="text-sm font-medium text-text-muted">✨ No bucket items added yet!</p>
              <p className="text-xs text-text-dim max-w-sm mx-auto">
                Fill the box above and add beautiful milestones, date nights, and surprises you want to achieve or do together.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const isMilli = item.createdBy.includes('Milli');

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className={`py-3.5 px-3 md:px-4 my-1 rounded-xl flex items-start gap-3 md:gap-4 group/item transition-all duration-200 ${
                        item.completed 
                          ? 'bg-zinc-900/90 border border-white/5 shadow-inner' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Left Side: Checkbox trigger */}
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(item)}
                        className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                          item.completed
                            ? 'bg-zinc-800 border-zinc-600 text-zinc-400'
                            : 'border-white/10 hover:border-white/20 bg-black/20 text-transparent hover:text-white/30'
                        }`}
                      >
                        {item.completed ? <Check className="w-4 h-4 stroke-[3px]" /> : <Heart className="w-3.5 h-3.5 stroke-[2.5px]" />}
                      </button>

                      {/* Middle: Text display & editing fields */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-zinc-900/80 border border-accent/40 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-accent"
                              maxLength={450}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item)}
                              className="p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingText('');
                              }}
                              className="p-2 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p
                            onClick={() => handleToggleCompleted(item)}
                            className={`text-xs md:text-sm font-medium leading-relaxed break-words cursor-pointer select-none ${
                              item.completed
                                ? 'text-zinc-400'
                                : 'text-white hover:text-accent/80 transition-colors'
                            }`}
                          >
                            {item.text}
                          </p>
                        )}

                        {/* Metadata line: date + creator */}
                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-text-dim">
                          <span className="flex items-center gap-1 opacity-75">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt}
                          </span>
                          <span className="h-1 w-1 bg-zinc-700 rounded-full" />
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                              isMilli
                                ? 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                                : 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            }`}
                          >
                            Suggested by {item.createdBy}
                          </span>
                        </div>
                      </div>

                      {/* Right side: Action controls (Edit, Delete) */}
                      {!isEditing && (
                        <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit date idea"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete idea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
