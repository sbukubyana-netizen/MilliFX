import React from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Heart } from 'lucide-react';
import { Episode } from '../constants';

interface ContentRowProps {
  id?: string;
  title: string;
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ id, title, episodes, onSelectEpisode }) => {
  return (
    <div className="py-6 space-y-3" id={id}>
      <div className="px-6 md:px-12 flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-bold transition-colors">
          {title}
        </h3>
      </div>
      
      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-6 no-scrollbar scroll-smooth">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} onClick={() => onSelectEpisode(episode)} />
          ))}
        </div>
      </div>
    </div>
  );
}

const EpisodeCard: React.FC<{ episode: Episode; onClick: () => void }> = ({ episode, onClick }) => {
  const isComingSoon = episode.images.length === 0;

  return (
    <motion.div
      whileHover={isComingSoon ? {} : { scale: 1.05, zIndex: 50 }}
      transition={{ duration: 0.3 }}
      onClick={isComingSoon ? undefined : onClick}
      className={`flex-shrink-0 w-64 md:w-80 rounded-sm shadow-2xl overflow-hidden bg-card-bg relative group flex flex-col border border-border-subtle ${isComingSoon ? 'cursor-default grayscale-[0.5] opacity-80' : 'cursor-pointer hover:border-accent/50'}`}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={episode.previewImageUrl}
          alt={episode.title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isComingSoon ? '' : 'group-hover:scale-110'}`}
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${isComingSoon ? 'bg-black/60' : 'bg-black/20 group-hover:bg-black/0'} transition-colors`} />
        
        {/* Watch Hover Button */}
        {!isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
              <Play className="w-8 h-8 text-white fill-current ml-1" />
            </div>
          </div>
        )}

        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-bg-deep/80 backdrop-blur-sm text-white text-[10px] font-black px-4 py-2 rounded-sm border border-white/10 uppercase tracking-widest">TBA • Episode Coming Soon</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-bg-deep/90 backdrop-blur-sm space-y-1 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isComingSoon ? 'text-text-dim' : 'text-accent'}`}>{episode.description}</span>
          {!isComingSoon && (
            <div className="flex gap-2">
              <Plus className="w-3.5 h-3.5 text-text-dim hover:text-text-main transition-colors" />
              <Heart className="w-3.5 h-3.5 text-accent fill-current" />
            </div>
          )}
        </div>
        <h4 className={`font-bold text-sm tracking-tight ${isComingSoon ? 'text-text-dim' : 'text-text-main'}`}>{episode.title}</h4>
        <div className="flex items-center gap-2 mt-2">
           <button 
             disabled={isComingSoon}
             className={`${isComingSoon ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-text-main text-bg-deep hover:opacity-90'} text-[10px] font-black px-4 py-1.5 rounded-sm uppercase tracking-tighter transition-all`}
           >
             {isComingSoon ? 'TBA' : 'Watch Now'}
           </button>
           {!isComingSoon && (
             <span className="text-text-dim text-[9px] font-bold uppercase tracking-widest">{episode.images.length} Moments</span>
           )}
        </div>
      </div>
    </motion.div>
  );
}
