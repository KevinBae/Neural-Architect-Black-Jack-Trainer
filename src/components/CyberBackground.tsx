import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CyberBackgroundProps {
  streak?: number;
  status?: string;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ streak = 0, status }) => {
  const speedScale = Math.min(2, 1 + streak * 0.2);
  const isWinning = status === 'WIN' || status === 'BLACKJACK';
  const isLosing = status === 'LOSS';
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020204]">
      {/* Perspective Grid */}
      <div className="absolute inset-0 perspective-grid">
        <div className="scrolling-grid opacity-20" style={{ animationDuration: `${20 / speedScale}s` }} />
      </div>

      {/* Cyber Glows */}
      <div 
        className={cn("absolute w-[80vw] h-[80vh] rounded-full cyber-glow transition-colors duration-1000", isWinning ? "bg-green-500/10" : "bg-neural-cyan/10")} 
        style={{ top: '10%', left: '-10%' }} 
      />
      <div 
        className={cn("absolute w-[60vw] h-[60vh] rounded-full cyber-glow transition-colors duration-1000", isLosing ? "bg-red-500/10" : "bg-neural-pink/10")} 
        style={{ bottom: '5%', right: '-5%' }} 
      />
      <div 
        className="absolute w-[100vw] h-[50vh] rounded-full bg-purple-900/10 cyber-glow" 
        style={{ top: '40%', left: '10%' }} 
      />

      {/* Static Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

      {/* Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Floating Particles / Stars */}
      <div className="stars-container absolute inset-0">
        {[...Array(50)].map((_, i) => {
          const size = Math.random() * 2 + 1;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const duration = 2 + Math.random() * 5;
          const delay = Math.random() * 10;
          
          return (
            <div 
              key={i} 
              className="star" 
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                '--duration': `${duration}s`,
                '--delay': `${delay}s`,
                animationDelay: `${delay}s`
              } as any}
            />
          );
        })}

        {/* Drifting Tech Bits */}
        {[...Array(15)].map((_, i) => {
          const duration = 15 + Math.random() * 20;
          const delay = -Math.random() * 20;
          const driftStart = (Math.random() * 100) + 'vw';
          const driftEnd = (Math.random() * 100) + 'vw';
          
          return (
            <motion.div
              key={`drift-${i}`}
              className="absolute text-[8px] font-black text-neural-cyan/20 whitespace-nowrap pointer-events-none drift-star opacity-10"
              style={{
                '--duration': `${duration}s`,
                '--delay': `${delay}s`,
                '--drift-start': driftStart,
                '--drift-end': driftEnd,
              } as any}
            >
              {[...Array(8)].map(() => (Math.random() > 0.5 ? '1' : '0')).join('')}
            </motion.div>
          );
        })}
      </div>

      {/* Floating Lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-neural-cyan/30 to-transparent w-[300px]"
          initial={{ x: '-100%', top: `${Math.random() * 100}%` }}
          animate={{ x: '110vw' }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: i * 3
          }}
        />
      ))}
    </div>
  );
};
