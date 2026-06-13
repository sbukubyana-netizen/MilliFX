import { motion } from 'motion/react';
import { Heart, User, Sparkles } from 'lucide-react';

interface ProfileSelectorProps {
  onSelect: (profile: 'Girlfriend' | 'Boyfriend' | 'Us') => void;
  boyfriendImage?: string;
  girlfriendImage?: string;
  usImage?: string;
}

export default function ProfileSelector({ onSelect, boyfriendImage, girlfriendImage, usImage }: ProfileSelectorProps) {
  const gfImg = girlfriendImage || 'images/millicent1.jpg';
  const profiles = [
    { 
      id: 'Girlfriend' as const,
      name: 'Girlfriend (Milli)', 
      image: gfImg,
      icon: <Heart className="w-12 h-12 text-accent" /> 
    },
    { 
      id: 'Boyfriend' as const,
      name: 'Boyfriend (Sbu)', 
      image: boyfriendImage || '', // Starts empty or uses user custom base64/URL upload representation
      icon: <User className="w-12 h-12 text-violet-400" /> 
    },
    { 
      id: 'Us' as const,
      name: 'Us Together 🤍', 
      image: usImage || '', 
      icon: <Sparkles className="w-12 h-12 text-pink-500" /> 
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-bg-deep text-text-main px-4 transition-colors duration-500">
      {/* Blurred background image */}
      <div 
         className="absolute inset-0 bg-cover bg-center opacity-25 grayscale blur-[120px] scale-110 pointer-events-none"
        style={{ backgroundImage: `url('${gfImg}')` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center space-y-12"
      >
        <div className="space-y-3">
          <span className="text-accent text-xs font-black uppercase tracking-[0.3em]">Cinematic Streaming Experience</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2">
            Who's Watching?
          </h1>
          <p className="text-text-dim max-w-sm mx-auto text-xs md:text-sm">
            Select your matching compartment profile to load your customized cinematic timeline.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-14">
          {profiles.map((profile) => (
            <motion.button
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(profile.id)}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden border-4 border border-white/5 group-hover:border-accent transition-all duration-300 relative bg-zinc-950 flex items-center justify-center shadow-2xl">
                {profile.image ? (
                  <img 
                    src={profile.image} 
                    alt={profile.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-radial-gradient flex items-center justify-center ${
                    profile.id === 'Us' 
                      ? 'from-pink-900/40 to-black' 
                      : 'from-violet-900/40 to-black'
                  }`}>
                    <span className={`text-4xl font-mono font-extrabold group-hover:scale-110 transition-transform ${
                      profile.id === 'Us' ? 'text-pink-500' : 'text-violet-500'
                    }`}>
                      {profile.id === 'Us' ? 'M🤍S' : 'S'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                <div className="z-10 bg-black/60 p-3 rounded-full backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                  {profile.icon}
                </div>
              </div>
              <span className="text-text-dim group-hover:text-text-main group-hover:scale-105 transition-all text-sm md:text-base font-black uppercase tracking-wider">
                {profile.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
