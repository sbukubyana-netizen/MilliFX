import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareHeart, X } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const PERIOD_MESSAGES = {
  morning: [
    {
      subject: "A morning thought for you... ☀️",
      body: "I was just thinking about how much your smile changes my entire day. You really are the main character in my morning."
    },
    {
      subject: "Good morning, star! ✨",
      body: "The world looks better with you awake. I hope your coffee is as sweet as you are (but that might be impossible)."
    }
  ],
  afternoon: [
    {
      subject: "Mid-day check-in... ☕",
      body: "Just a reminder that you're doing amazing today. I'm counting down the minutes until I see you again."
    },
    {
      subject: "Brightening my day... 💫",
      body: "Even when the sun is at its highest, you're still the brightest thing in my life. Thinking of you!"
    }
  ],
  evening: [
    {
      subject: "Golden hour thoughts... 🌅",
      body: "The light at this time of day reminds me of that 'Golden Hour' photo of you. You're breathtaking."
    },
    {
      subject: "Winding down... 🌙",
      body: "I hope your day was as incredible as you are. Watching the sunset and thinking about our next episode together."
    }
  ],
  night: [
    {
      subject: "Sweetest dreams... 🌌",
      body: "The stars are out, but they've got nothing on your spark. Can't wait to see what Season 2 has in store for us."
    },
    {
      subject: "Late-night love... 🤍",
      body: "If our life was a movie, I'd never want the credits to roll. Goodnight to my favorite leading lady."
    }
  ]
};

type Period = keyof typeof PERIOD_MESSAGES;

interface DBNotificationMessage {
  id: string;
  subject: string;
  body: string;
  period: Period;
  profile: 'Girlfriend' | 'Boyfriend';
  createdAt: string;
}

export default function Notification() {
  const [show, setShow] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customNotes, setCustomNotes] = useState<DBNotificationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<{
    subject: string;
    body: string;
    profile?: 'Girlfriend' | 'Boyfriend';
    custom?: boolean;
  }>(PERIOD_MESSAGES.morning[0]);

  // Subscribe to custom daily notes in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'daily_notes'), (snapshot) => {
      const notesList: DBNotificationMessage[] = [];
      snapshot.forEach((doc) => {
        notesList.push(doc.data() as DBNotificationMessage);
      });
      // Sort newest first
      notesList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setCustomNotes(notesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'daily_notes');
    });

    return () => unsub();
  }, []);

  // Compute current message based on hour, day-of-year, and custom database notes
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    
    let period: Period = 'morning';
    if (hour >= 5 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'afternoon';
    else if (hour >= 17 && hour < 22) period = 'evening';
    else period = 'night';

    // Find if there is a custom note for this period
    const customForPeriod = customNotes.filter(note => note.period === period);

    if (customForPeriod.length > 0) {
      // Use the latest custom note for this period
      const latestNote = customForPeriod[0];
      setCurrentMessage({
        subject: latestNote.subject,
        body: latestNote.body,
        profile: latestNote.profile,
        custom: true
      });
    } else {
      // Stable selection within the preset period pool based on day of year
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      const pool = PERIOD_MESSAGES[period];
      const fallbackMsg = pool[dayOfYear % pool.length];
      setCurrentMessage({
        subject: fallbackMsg.subject,
        body: fallbackMsg.body,
        custom: false
      });
    }
  }, [customNotes]);

  // Trigger delayed entry notification
  useEffect(() => {
    if (sessionStorage.getItem('daily_note_interacted')) {
      return;
    }
    const timer = setTimeout(() => {
      setShow(true);
    }, 10000); // Show after 10 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {show && !isOpen && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            className="fixed bottom-54 right-8 z-[100] bg-card-bg border border-border-subtle p-4 rounded shadow-2xl flex items-center gap-4 cursor-pointer hover:bg-card-bg transition-colors"
            onClick={() => {
              setIsOpen(true);
              setShow(false);
              sessionStorage.setItem('daily_note_interacted', 'true');
            }}
            id="floating-daily-thought-notification"
          >
            <div className="w-10 h-10 bg-accent rounded-sm flex items-center justify-center text-white">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div className="flex-grow pr-8">
              <p className="text-text-main font-bold text-xs uppercase tracking-tight">{currentMessage.subject}</p>
              <p className="text-text-dim text-[11px]">Click to read your daily note...</p>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShow(false); 
                sessionStorage.setItem('daily_note_interacted', 'true');
              }}
              className="absolute top-2 right-2 text-text-dim hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" id="daily-thought-letter-modal">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-bg-deep text-text-main p-8 md:p-12 rounded shadow-2xl max-w-lg w-full font-sans border-t-[8px] border-accent transition-colors"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-text-dim hover:text-text-main transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="space-y-6 text-xl md:text-2xl leading-relaxed">
                <p className="text-accent font-bold italic">
                  {currentMessage.profile === 'Boyfriend' ? 'Dearest Girlfriend Milli,' : 
                   currentMessage.profile === 'Girlfriend' ? 'Dear Boyfriend Sbu,' : 'Dearest Milli,'}
                </p>
                <p className="text-text-dim">
                  {currentMessage.body}
                </p>
                <p className="text-text-dim italic text-sm">
                  {currentMessage.custom 
                    ? 'This thought was lovingly crafted on the central studio platform.' 
                    : 'This place was built with love. Every second of that countdown is a witness to how much I care.'
                  }
                </p>
                <p className="text-right font-bold italic pt-4 text-text-main">
                  — {currentMessage.profile === 'Girlfriend' ? 'Your Milli 🤍' : 
                     currentMessage.profile === 'Boyfriend' ? 'Your Sbu 🤍' : 'Forever Yours 🤍'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
