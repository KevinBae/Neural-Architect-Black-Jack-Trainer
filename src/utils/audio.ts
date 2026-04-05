const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number, decay: boolean = true) => {
  if (!audioContext) return;
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  if (decay) {
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  } else {
    setTimeout(() => gain.gain.setValueAtTime(0, audioContext.currentTime), duration * 1000);
  }
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + duration);
};

export const sounds = {
  hover: () => playTone(600, 'sine', 0.05, 0.05),
  click: () => playTone(800, 'square', 0.05, 0.05),
  deal: () => {
    playTone(200, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(400, 'sine', 0.1, 0.1), 50);
  },
  chip: () => {
    playTone(1000, 'sine', 0.05, 0.1);
    playTone(1200, 'sine', 0.05, 0.05);
  },
  win: () => {
    playTone(400, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(500, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(600, 'sine', 0.3, 0.1), 200);
  },
  loss: () => {
    playTone(300, 'sawtooth', 0.2, 0.05);
    setTimeout(() => playTone(200, 'sawtooth', 0.4, 0.05), 100);
  },
  correct: () => {
    playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 50);
  },
  incorrect: () => {
    playTone(200, 'sawtooth', 0.1, 0.1);
    setTimeout(() => playTone(150, 'sawtooth', 0.3, 0.1), 50);
  }
};
