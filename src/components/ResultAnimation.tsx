import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface ResultAnimationProps {
  result: 'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER' | null;
  onComplete: () => void;
}

export const ResultAnimation: React.FC<ResultAnimationProps> = ({ result }) => {

  return (
    <AnimatePresence>
      {result && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Win Animation Overlay */}
          {(result === 'WIN' || result === 'BLACKJACK') && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0, 1, 1, 0],
                transition: { duration: 1.725, times: [0, 0.2, 0.8, 1] }
              }}
              className="flex flex-col items-center"
            >
              <h2 className="text-6xl md:text-8xl font-black text-neural-cyan glow-text-cyan uppercase italic tracking-tighter italic scale-110">
                {result === 'BLACKJACK' ? 'NEURAL_CRITICAL' : 'DATA_SECURED'}
              </h2>
              <div className="text-xl text-white mt-2 font-bold tracking-[0.5em] opacity-80 decoration-neural-cyan underline decoration-2 underline-offset-8">
                 {result === 'BLACKJACK' ? 'MAX_YIELD_OBTAINED' : 'TRANSFER_SUCCESSFUL'}
              </div>
            </motion.div>
          )}

          {/* Loss Animation Overlay */}
          {(result === 'LOSS' || result === 'SURRENDER') && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ 
                x: [20, -20, 20, -20, 0],
                opacity: [0, 1, 1, 0],
                transition: { duration: 1.725, times: [0, 0.2, 0.8, 1] }
              }}
              className="flex flex-col items-center"
            >
              <h2 className="text-6xl md:text-8xl font-black text-neural-pink glow-text-pink uppercase italic tracking-tighter scale-110">
                {result === 'SURRENDER' ? 'PARTIAL_SYNC' : 'SYSTEM_BREACH'}
              </h2>
              <div className="text-xl text-white mt-2 font-bold tracking-[0.5em] opacity-80 decoration-neural-pink underline decoration-2 underline-offset-8">
                 {result === 'SURRENDER' ? 'SECURE_EXIT_PROTOCOL_ACTIVE' : 'CREDENTIAL_LOSS_DETECTED'}
              </div>
            </motion.div>
          )}

          {/* Push Animation Overlay */}
          {result === 'PUSH' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                transition: { duration: 1.725, times: [0, 0.2, 0.8, 1] }
              }}
              className="flex flex-col items-center"
            >
              <h2 className="text-6xl md:text-8xl font-black text-neural-dim uppercase tracking-tighter opacity-50">
                SYNC_LOCK
              </h2>
              <div className="text-xl text-white mt-2 font-bold tracking-[0.5em] opacity-80">
                 NO_DATA_TRANSFER
              </div>
            </motion.div>
          )}

          {/* Background Sparks (Wins Only) */}
          {(result === 'WIN' || result === 'BLACKJACK') && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.2 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-neural-cyan/10 backdrop-blur-[2px]"
             />
          )}

          {/* Background Glitch (Loss Only) */}
          {result === 'LOSS' && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ 
                 opacity: [0, 0.1, 0.05, 0.1, 0],
                 transition: { repeat: 3, duration: 0.575 }
               }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-neural-pink/20 backdrop-blur-[2px]"
             />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
