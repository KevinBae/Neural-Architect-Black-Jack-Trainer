
import type { Card as CardType } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card: CardType;
  index: number;
}

export const Card = ({ card, index }: CardProps) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  const SuitIcon = {
    hearts: Heart,
    diamonds: Diamond,
    clubs: Club,
    spades: Spade,
  }[card.suit];

  return (
    <motion.div
      initial={{ y: -50, x: -200, rotate: -20, opacity: 0 }}
      animate={{ 
        y: 0, 
        x: 0, 
        rotate: 0, 
        opacity: 1,
        transition: { delay: index * 0.115, duration: 0.575, type: 'spring' }
      }}
      className={cn(
        "relative w-24 h-36 md:w-28 md:h-40 rounded-lg border-2 transition-all duration-[345ms] transform preserve-3d group cursor-default overflow-hidden",
        card.revealed ? (isRed ? "border-neural-pink/40" : "border-neural-cyan/40") : "border-neural-border shadow-inner"
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        {!card.revealed ? (
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            className="absolute inset-0 w-full h-full backface-hidden bg-neural-panel flex items-center justify-center p-2"
          >
            <div className="w-full h-full border border-neural-border/50 rounded flex items-center justify-center relative overflow-hidden">
               <div className="w-12 h-12 border border-neural-cyan/20 rounded-full animate-[pulse_3.45s_infinite]" />
               <div className="text-[8px] absolute bottom-2 text-neural-dim uppercase font-mono tracking-tighter">Encrypted</div>
               <div className="absolute inset-x-0 h-[1px] bg-neural-cyan/20 animate-[scan_4.6s_linear_infinite]" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            className={cn(
              "absolute inset-0 w-full h-full backface-hidden bg-neural-panel flex flex-col justify-between p-3",
              isRed ? "text-neural-pink" : "text-neural-cyan"
            )}
          >
            {/* Top Left */}
            <div className="flex flex-col items-start leading-none">
              <span className="text-xl font-bold font-mono tracking-tighter">{card.rank}</span>
              <SuitIcon size={14} fill={isRed ? "currentColor" : "none"} />
            </div>

            {/* Center */}
            <div className="flex items-center justify-center">
              <SuitIcon size={48} fill={isRed ? "currentColor" : "none"} className={cn(
                "opacity-80 drop-shadow-[0_0_10px_currentColor]",
                isRed ? "shadow-neural-pink" : "shadow-neural-cyan"
              )} />
            </div>

            {/* Bottom Right */}
            <div className="flex flex-col items-end leading-none rotate-180">
              <span className="text-xl font-bold font-mono tracking-tighter">{card.rank}</span>
              <SuitIcon size={14} fill={isRed ? "currentColor" : "none"} />
            </div>
            
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-[345ms]",
              isRed ? "shadow-[inset_0_0_15px_rgba(255,0,186,0.2)]" : "shadow-[inset_0_0_15px_rgba(0,242,255,0.2)]"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
