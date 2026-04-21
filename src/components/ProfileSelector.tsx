import { motion } from 'motion/react';
import { Heart, Stars } from 'lucide-react';

interface ProfileSelectorProps {
  onSelect: (profile: string) => void;
}

export default function ProfileSelector({ onSelect }: ProfileSelectorProps) {
  const profiles = [
    { 
      name: 'The Love of My Life', 
      image: 'images/millicent1.jpg',
      icon: <Heart className="w-12 h-12 text-accent" /> 
    },
    { 
      name: 'Future Wife', 
      image: 'images/millicent2.jpg',
      icon: <Stars className="w-12 h-12 text-accent opacity-80" /> 
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-bg-deep text-text-main px-4 transition-colors duration-500">
      {/* Blurred background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 grayscale blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url('images/millicent1.jpg')` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center space-y-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Who's watching?
        </h1>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {profiles.map((profile) => (
            <motion.button
              key={profile.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(profile.name)}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-sm overflow-hidden border-4 border-transparent group-hover:border-text-main transition-all duration-300 relative bg-linear-to-tr from-accent to-red-900 flex items-center justify-center">
                <img 
                  src={profile.image} 
                  alt={profile.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="z-10 bg-black/40 p-2 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                  {profile.icon}
                </div>
              </div>
              <span className="text-text-dim group-hover:text-text-main transition-colors text-base font-medium">
                {profile.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
