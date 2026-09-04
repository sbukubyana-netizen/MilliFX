import { motion } from 'motion/react';
import React from 'react';
import { Play, Plus, Heart } from 'lucide-react';
import { Memory } from '../constants';

interface Top10RowProps {
  id?: string;
  items: Memory[];
  userStats: { [key: string]: { views: number, likes: number } };
  onLike: (id: string) => void;
  onSelect: (item: Memory, collection: Memory[]) => void;
}

const Top10Row: React.FC<Top10RowProps> = ({ id, items, userStats, onLike, onSelect }) => {
  return (
    <div className="py-12 space-y-3" id={id}>
      <div className="px-6 md:px-12 flex items-center justify-between">
        <div className="flex flex-col pb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-text-main flex items-center gap-2 italic tracking-tighter mb-0 pb-0">
            Global Top 10 <span className="text-accent not-italic">🔥</span>
          </h3>
          <p className="text-text-dim text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5">Based on your recent binge-watching & likes</p>
        </div>
        <button 
          onClick={() => onSelect(items[0], items)}
          className="text-accent text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:underline"
        >
          Play the Hits &#8250;
        </button>
      </div>
      <div className="flex gap-12 overflow-x-auto px-6 md:px-12 py-8 no-scrollbar items-center">
        {items.map((item, index) => {
          const stats = userStats[item.id] || { views: 0, likes: 0 };
          const isLiked = stats.likes > 0;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05, zIndex: 50 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 relative w-[220px] sm:w-[280px] md:w-[320px] max-w-full group cursor-pointer"
            >
              {/* Massive Number */}
              <div className="absolute -left-6 sm:-left-8 md:-left-12 bottom-0 text-[100px] sm:text-[140px] md:text-[200px] font-black leading-none text-bg-deep select-none outline-text transition-all group-hover:text-accent/20 z-0 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                {index + 1}
              </div>
              
              {/* Card Content */}
              <div 
                onClick={() => onSelect(item, items)}
                className="relative z-10 ml-6 md:ml-12 rounded-sm overflow-hidden shadow-2xl bg-card-bg aspect-video border border-border-subtle group-hover:border-accent/50 transition-all duration-500"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                
                {/* Stats Badge */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/5">
                    {stats.views} Views
                  </div>
                </div>

                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex gap-2 mb-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center p-1 cursor-pointer hover:bg-accent hover:text-white transition-colors">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-zinc-400 text-white flex items-center justify-center hover:border-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); onLike(item.id); }}
                      className={`w-8 h-8 rounded-full border ${isLiked ? 'bg-accent/20 border-accent' : 'border-zinc-400'} text-white flex items-center justify-center hover:border-accent transition-colors ml-auto`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'text-accent fill-current' : 'text-white'}`} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-white font-black text-sm md:text-base leading-tight drop-shadow-lg tracking-tight">{item.title}</h4>
                    <p className="text-text-dim text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] drop-shadow-lg">{item.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <style>{`
        .outline-text {
          -webkit-text-stroke: 2px var(--color-text-dim);
          color: transparent;
        }
        .group:hover .outline-text {
          -webkit-text-stroke: 2px var(--color-accent);
        }
      `}</style>
    </div>
  );
};

export default Top10Row;
