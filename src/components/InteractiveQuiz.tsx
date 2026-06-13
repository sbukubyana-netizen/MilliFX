import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Heart } from 'lucide-react';

interface QuizProps {
  onClose: () => void;
}

const QUESTIONS = [
  {
    question: "What was the flavor of the very first dessert we shared?",
    options: ["Chocolate Lava", "Strawberry Cheesecake", "Salted Caramel", "Tiramisu"],
    correct: 0
  },
  {
    question: "In which month did we take our 'Golden Hour' photo?",
    options: ["May", "August", "October", "January"],
    correct: 2
  },
  {
    question: "How many days are left until our next big anniversary?",
    options: ["Check the timer!", "More than 200", "Exactly 100", "Not enough"],
    correct: 0
  },
  {
    question: "What is our absolute go-to routine or vibe for a perfect cozy evening?",
    options: ["Warm Movie & Pizza Night", "Sunset Walk & Coffee", "Exploring New Places", "Listening to Sweet R&B Tracks"],
    correct: 0
  },
  {
    question: "Which of these titles best describes 'The Story of Us' so far?",
    options: ["An Action-Packed Adventure", "A Sweet Indie Rom-Com", "A Pure Magical Masterpiece", "All of the above, forever & ever! 🤍"],
    correct: 3
  }
];

export default function InteractiveQuiz({ onClose }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (index: number) => {
    if (index === QUESTIONS[currentStep].correct) {
      setScore(s => s + 1);
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-bg-deep border border-border-subtle w-full max-w-xl p-5 sm:p-8 md:p-12 rounded-lg shadow-2xl text-center max-h-full overflow-y-auto whitespace-normal"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-text-dim hover:text-text-main"
        >
          <X className="w-6 h-6" />
        </button>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key="quiz-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-accent font-bold uppercase tracking-[0.2em] text-[10px]">Interactive Special</span>
                <h3 className="text-2xl font-bold text-text-main">
                  The MilliSbu Review: Part 1
                </h3>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-text-dim font-medium lowercase italic first-letter:uppercase">
                  {QUESTIONS[currentStep].question}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {QUESTIONS[currentStep].options.map((option, idx) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(idx)}
                      className="w-full py-4 px-6 bg-card-bg border border-border-subtle rounded text-text-main font-bold hover:border-accent transition-colors text-sm"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-2">
                {QUESTIONS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-accent' : 'bg-border-subtle'}`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quiz-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-center flex-col items-center">
                <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center text-accent mb-6">
                  {score === QUESTIONS.length ? <Trophy className="w-10 h-10" /> : <Heart className="w-10 h-10" />}
                </div>
                <h3 className="text-3xl font-bold text-text-main mb-2">
                  {score === QUESTIONS.length ? 'Perfect Rating! 🤍' : 'Season Review Complete'}
                </h3>
                <p className="text-text-dim max-w-sm">
                  {score === QUESTIONS.length 
                    ? "You're a true fan of 'The Story of Us'. Every memory is engraved in your heart."
                    : `You got ${score} out of ${QUESTIONS.length} right! Still a critics' favorite.`}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-accent text-white py-4 rounded font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-xl"
              >
                Return to Home Screen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
