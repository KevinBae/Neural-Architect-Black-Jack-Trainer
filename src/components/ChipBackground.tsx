import { motion } from 'framer-motion';

export const ChipBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(to right, #1e1e26 1px, transparent 1px), linear-gradient(to bottom, #1e1e26 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Neural Streams */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`stream-h-${i}`}
                    className="absolute h-[1px] bg-gradient-to-r from-transparent via-neural-cyan/40 to-transparent w-full"
                    initial={{ x: '-100%', top: `${15 + i * 15}%` }}
                    animate={{ x: '100%' }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 1.5
                    }}
                />
            ))}

            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`stream-v-${i}`}
                    className="absolute w-[1px] bg-gradient-to-b from-transparent via-neural-pink/40 to-transparent h-full"
                    initial={{ y: '-100%', left: `${15 + i * 15}%` }}
                    animate={{ y: '100%' }}
                    transition={{
                        duration: 10 + i * 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 1.2
                    }}
                />
            ))}

            {/* Pulsing Core behind each chip location roughly */}
            <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-10">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={`pulse-${i}`}
                        className="w-20 h-20 rounded-full border border-neural-cyan/10"
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.1, 0.3, 0.1],
                            borderWidth: ['1px', '4px', '1px']
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* Floating Data Bits */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={`bit-${i}`}
                    className="absolute w-1 h-1 bg-neural-cyan/30 rounded-full"
                    initial={{ 
                        x: Math.random() * 100 + "%", 
                        y: Math.random() * 100 + "%",
                        opacity: 0 
                    }}
                    animate={{ 
                        opacity: [0, 0.6, 0],
                        y: [null as any, "-20px"] 
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                />
            ))}

            {/* Glow sweep */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
                animate={{
                    x: ['-100%', '100%']
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};
