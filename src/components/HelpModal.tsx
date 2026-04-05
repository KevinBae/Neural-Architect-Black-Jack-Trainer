import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Cpu, Zap } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl neural-panel neural-border-cyan overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6 border-b border-neural-border pb-4">
              <h2 className="text-xl font-black text-neural-cyan flex items-center gap-2 tracking-tighter">
                <Cpu size={20} /> SYSTEM_MANUAL.v1
              </h2>
              <button 
                onClick={onClose}
                className="text-neural-dim hover:text-white transition-colors"
                aria-label="Close manual"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 text-sm text-neural-text/80 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <section className="space-y-2">
                <h3 className="text-neural-pink font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                  <Shield size={14} /> Objective: Strategy Training
                </h3>
                <p>
                  This system is designed as a high-fidelity simulator to help you master **Basic Strategy**—the optimal way to play every hand in Blackjack according to mathematical probability.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-neural-cyan font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                  <Zap size={14} /> The Cyan Glow
                </h3>
                <p>
                  Notice the buttons with the **pulsing cyan glow**. This represents the **Optimal Selection** according to the strategy matrix. 
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-neural-dim">
                  <li>Follow the glow to play perfectly every time.</li>
                  <li>In a real casino, playing "perfect" basic strategy reduces the house edge to less than 0.5%.</li>
                </ul>
              </section>

              <section className="space-y-2 border-t border-neural-border/50 pt-4">
                 <h3 className="text-white font-bold uppercase tracking-widest text-xs">System Rules</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] uppercase text-neural-dim font-mono">
                    <div className="flex flex-col border-l border-neural-cyan/30 pl-2">
                       <span className="text-white">Deck Count</span>
                       6-Deck Shoe (Fisher-Yates Shuffled)
                    </div>
                    <div className="flex flex-col border-l border-neural-cyan/30 pl-2">
                       <span className="text-white">Dealer Action</span>
                       Hits on Soft 17 (H17)
                    </div>
                    <div className="flex flex-col border-l border-neural-cyan/30 pl-2">
                       <span className="text-white">Blackjack Pay</span>
                       3:2 Ratio (1.5x Bet Value)
                    </div>
                    <div className="flex flex-col border-l border-neural-cyan/30 pl-2">
                       <span className="text-white">Double Action</span>
                       Allowed on any two starting cards
                    </div>
                 </div>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={onClose}
                className="neural-button neural-button-optimal"
              >
                ACKNOWLEDGE_ENTRY
              </button>
            </div>
            
            {/* Visual Flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neural-cyan/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neural-pink/5 blur-3xl rounded-full -ml-16 -mb-16 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
