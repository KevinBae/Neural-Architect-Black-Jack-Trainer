import { useState, useEffect, useCallback } from 'react';
import type { GameState, Hand, Action, GameHistory, Card as CardType, Card } from './types/game';
import { createDeck, calculateScore } from './logic/deck';
import { getRecommendedAction, getActionProbabilities, getOptimalPlayExplanation } from './logic/strategy';
import { Card as CardComponent } from './components/Card';
import { HelpModal } from './components/HelpModal';
import { ResultAnimation } from './components/ResultAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, RotateCcw, History, HelpCircle, Wallet, Target, Activity, Zap, Settings, BarChart, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChipBackground } from './components/ChipBackground';
import { CyberBackground } from './components/CyberBackground';
import { sounds } from './utils/audio';

function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handle = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);
  return pos;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_BANKROLL = 1000;
const CHIP_VALUES = [10, 50, 100, 500];

function NeuralHUD({ action, recommendedAction, explanation, mouse }: { action: Action, recommendedAction: Action | null, explanation: string, mouse: { x: number, y: number } }) {
  const isOptimal = action === recommendedAction;
  const [hoverTime, setHoverTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setHoverTime(Date.now() - start);
    }, 50);
    return () => clearInterval(interval);
  }, [action]);

  // Flash intensity increases with hoverTime
  const flashPeriod = Math.max(0.1, 1 - hoverTime / 2000);

  // Position logic to prevent overflow
  const hudX = mouse.x + 20 > window.innerWidth - 300 ? mouse.x - 300 : mouse.x + 20;
  const hudY = mouse.y + 20 > window.innerHeight - 300 ? mouse.y - 300 : mouse.y + 20;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      style={{ left: hudX, top: hudY }}
      className={cn(
        "fixed z-[500] w-72 p-5 neural-panel border-2 pointer-events-none shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl",
        isOptimal ? "border-neural-cyan/50 bg-neural-cyan/[0.03]" : "border-neural-pink/50 bg-neural-pink/[0.03]"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {isOptimal ? (
          <Zap size={14} className="text-neural-cyan animate-pulse" />
        ) : (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: flashPeriod * 1.15 }}
          >
            <AlertTriangle size={14} className="text-neural-pink" />
          </motion.div>
        )}
        <span className={cn(
          "text-[10px] uppercase tracking-[0.3em] font-black glitch-text",
          isOptimal ? "text-neural-cyan" : "text-neural-pink"
        )}>
          {isOptimal ? "OPTIMAL_HEURISTIC" : "SYSTEM_DEVIATION"}
        </span>
      </div>

      <div className="flex flex-col gap-1 mb-4 bg-black/40 p-3 border border-white/5 rounded-sm">
        <span className="text-[8px] text-neural-dim uppercase font-black tracking-widest opacity-60">Target_Protocol</span>
        <span className="text-xl font-black text-white italic tracking-tighter">{recommendedAction}</span>
      </div>

      <div className="relative">
        <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-neural-border/50 to-transparent" />
        <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic pl-1">
          {explanation}
        </p>
      </div>

      {!isOptimal && (
        <motion.div 
          className="mt-4 py-2 bg-neural-pink/20 text-neural-pink text-[9px] font-black text-center uppercase tracking-[0.2em] border border-neural-pink/30 shadow-[0_0_20px_rgba(255,0,186,0.2)]"
          animate={{ 
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.05, 1]
          }}
          transition={{ repeat: Infinity, duration: flashPeriod * 1.15 }}
        >
          WARNING: SUBOPTIMAL_PATH_DETECTED
        </motion.div>
      )}
    </motion.div>
  );
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHands: [],
    activeHandIndex: 0,
    dealerHand: { cards: [], score: 0, isBust: false, isBlackjack: false, isSoft: false, bet: 0 },
    status: 'BETTING',
    bankroll: INITIAL_BANKROLL,
    currentBet: 0,
    streak: 0,
    bestStreak: 0,
    history: [],
    totalDecisions: 0,
    correctDecisions: 0,
    categoryStats: { hard: { total: 0, correct: 0 }, soft: { total: 0, correct: 0 }, pairs: { total: 0, correct: 0 } },
    dealerHitsSoft17: true,
    deckCount: 6,
    runningCount: 0,
    trueCount: 0,
    isCountingNodeVisible: false
  });

  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [handResult, setHandResult] = useState<'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER' | null>(null);
  const [hoveredAction, setHoveredAction] = useState<Action | null>(null);
  const mouse = useMouse();

  // Sounds implementation
  useEffect(() => {
    if (handResult === 'WIN' || handResult === 'BLACKJACK') sounds.win();
    else if (handResult === 'LOSS') sounds.loss();
  }, [handResult]);

  useEffect(() => {
    if (lastCorrect === true) sounds.correct();
    else if (lastCorrect === false) sounds.incorrect();
  }, [lastCorrect]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('blackjack-trainer-data-v4');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setGameState(prev => ({ ...prev, ...data, deck: [], playerHands: [], dealerHand: { cards: [], score: 0, isBust: false, isBlackjack: false, isSoft: false, bet: 0 }, status: 'BETTING' }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const { deck, playerHands, dealerHand, ...res } = gameState;
    localStorage.setItem('blackjack-trainer-data-v4', JSON.stringify(res));
  }, [gameState]);

  // Counting Engine
  const updateCount = useCallback((cards: Card[]) => {
      let run = 0;
      cards.forEach(c => {
          if (!c.revealed) return;
          const rank = c.rank;
          if (['2', '3', '4', '5', '6'].includes(rank)) run += 1;
          else if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) run -= 1;
      });
      
      setGameState(prev => {
          const newRunning = prev.runningCount + run;
          const decksRemaining = Math.max(0.5, (prev.deck.length / 52));
          const newTrue = Math.round((newRunning / decksRemaining) * 10) / 10;
          return { ...prev, runningCount: newRunning, trueCount: newTrue };
      });
  }, []);

  const trackDecision = useCallback((hand: Hand, isCorrect: boolean) => {
    const isPair = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank;
    const type = isPair ? 'pairs' : (hand.isSoft ? 'soft' : 'hard');
    setGameState(prev => ({
        ...prev,
        totalDecisions: prev.totalDecisions + 1,
        correctDecisions: prev.correctDecisions + (isCorrect ? 1 : 0),
        categoryStats: {
            ...prev.categoryStats,
            [type]: { total: prev.categoryStats[type].total + 1, correct: prev.categoryStats[type].correct + (isCorrect ? 1 : 0) }
        }
    }));
  }, []);

  const settleGame = useCallback((playerHands: Hand[], dealerHand: Hand) => {
    let payoutAmount = 0;
    const historyEntries: GameHistory[] = [];
    let insurancePayout = 0;
    if (gameState.isInsuranceBet && dealerHand.isBlackjack) insurancePayout = gameState.isInsuranceBet * 3;

    const updatedPlayerHands = playerHands.map(hand => {
        let result: 'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER' = 'PUSH';
        let handPayout = 0;
        if (hand.settlement === 'SURRENDER') { result = 'SURRENDER'; handPayout = hand.bet / 2; }
        else if (hand.isBust) { result = 'LOSS'; handPayout = 0; }
        else if (dealerHand.isBust) { result = 'WIN'; handPayout = hand.bet * 2; }
        else if (hand.isBlackjack && !dealerHand.isBlackjack) { result = 'BLACKJACK'; handPayout = hand.bet * 2.5; }
        else if (hand.score > dealerHand.score) { result = 'WIN'; handPayout = hand.bet * 2; }
        else if (hand.score < dealerHand.score) { result = 'LOSS'; handPayout = 0; }
        else { result = 'PUSH'; handPayout = hand.bet; }
        payoutAmount += handPayout;
        historyEntries.push({ id: Math.random().toString(36).substr(2, 6), result, amount: handPayout - hand.bet, handSummary: `P: ${hand.score} vs D: ${dealerHand.score}`, timestamp: Date.now() });
        return { ...hand, settlement: result };
    });

    const anyWin = updatedPlayerHands.some(h => h.settlement === 'WIN' || h.settlement === 'BLACKJACK');
    const allLoss = updatedPlayerHands.every(h => h.settlement === 'LOSS' || h.settlement === 'SURRENDER');

    if (updatedPlayerHands.length > 0) {
        setHandResult(updatedPlayerHands[0].settlement || 'PUSH');
    }
    setGameState(prev => ({
        ...prev,
        playerHands: updatedPlayerHands,
        dealerHand,
        status: 'SETTLEMENT',
        bankroll: prev.bankroll + payoutAmount + insurancePayout,
        streak: anyWin ? prev.streak + 1 : (allLoss ? 0 : prev.streak),
        bestStreak: Math.max(prev.bestStreak, anyWin ? prev.streak + 1 : 0),
        history: [...historyEntries, ...prev.history].slice(0, 10),
        isInsuranceBet: undefined
    }));
  }, [gameState.isInsuranceBet]);

  const dealerPlay = useCallback((playerHands: Hand[], deck: CardType[]) => {
    let currentCards = gameState.dealerHand.cards.map(c => ({ ...c, revealed: true }));
    let currentDeck = [...deck];
    let status = calculateScore(currentCards);
    
    // Reveal second card for counting
    updateCount([currentCards[1]]);

    if (!playerHands.every(h => h.isBust || h.settlement === 'SURRENDER')) {
       // Phase 4: Dealer logic respects H17/S17
       while (status.score < 17 || (status.score === 17 && status.isSoft && gameState.dealerHitsSoft17)) {
          const nextCard = { ...currentDeck.pop()!, revealed: true };
          currentCards.push(nextCard);
          status = calculateScore(currentCards);
          updateCount([nextCard]);
       }
    }
    settleGame(playerHands, { ...gameState.dealerHand, cards: currentCards, ...status });
  }, [gameState.dealerHand, gameState.dealerHitsSoft17, settleGame, updateCount]);

  const placeBet = (amount: number) => {
    if (gameState.status !== 'BETTING' && gameState.status !== 'SETTLEMENT') return;
    const isNewCycle = gameState.status === 'SETTLEMENT';
    if (gameState.bankroll >= amount) {
      sounds.chip();
      setGameState(prev => ({
        ...prev,
        status: 'BETTING',
        currentBet: isNewCycle ? amount : prev.currentBet + amount,
        bankroll: prev.bankroll - amount,
        playerHands: [],
        dealerHand: { cards: [], score: 0, isBust: false, isBlackjack: false, isSoft: false, bet: 0 }
      }));
      if (isNewCycle) setHandResult(null);
    }
  };

  const clearBet = () => {
    if (gameState.status !== 'BETTING') return;
    setGameState(prev => ({
      ...prev,
      bankroll: prev.bankroll + prev.currentBet,
      currentBet: 0
    }));
  };

  const startNewHand = useCallback(() => {
    if (gameState.currentBet <= 0) return;
    sounds.deal();
    setHandResult(null);
    setLastCorrect(null);

    // Reshuffle if shoe is low (Phase 4 Shoe management)
    let currentDeck = gameState.deck;
    let wasReshuffled = false;
    if (currentDeck.length < (gameState.deckCount * 52 * 0.25)) {
        currentDeck = createDeck(gameState.deckCount);
        wasReshuffled = true;
    }

    const pCard1 = { ...currentDeck.pop()!, revealed: true };
    const dCard1 = { ...currentDeck.pop()!, revealed: true };
    const pCard2 = { ...currentDeck.pop()!, revealed: true };
    const dCard2 = { ...currentDeck.pop()!, revealed: false };

    const playerHandCards = [pCard1, pCard2];
    const dealerHandCards = [dCard1, dCard2];

    const playerHand: Hand = { cards: playerHandCards, ...calculateScore(playerHandCards), bet: gameState.currentBet };
    const dealerHand: Hand = { cards: dealerHandCards, ...calculateScore(dealerHandCards), bet: 0 };

    const recommendedAction = getRecommendedAction(playerHand, dCard1);
    const actionProbabilities = getActionProbabilities(playerHand, dCard1);
    const explanation = getOptimalPlayExplanation(playerHand, dCard1);
    const offerInsurance = dCard1.rank === 'A' && gameState.bankroll >= (gameState.currentBet / 2);

    setGameState(prev => ({
      ...prev,
      deck: currentDeck,
      playerHands: [playerHand],
      activeHandIndex: 0,
      dealerHand,
      status: offerInsurance ? 'INSURANCE_OFFER' : (playerHand.isBlackjack ? 'SETTLEMENT' : 'PLAYER_TURN'),
      recommendedAction: offerInsurance ? 'INSURANCE_NO' : recommendedAction,
      actionProbabilities,
      explanation,
      lastDecisionCorrect: undefined,
      runningCount: wasReshuffled ? 0 : prev.runningCount,
      trueCount: wasReshuffled ? 0 : prev.trueCount
    }));

    updateCount([pCard1, dCard1, pCard2]);

    if (!offerInsurance && playerHand.isBlackjack) {
        setGameState(prev => ({ ...prev, dealerHand: { ...prev.dealerHand, cards: prev.dealerHand.cards.map(c => ({...c, revealed: true })) } }));
        setTimeout(() => settleGame([playerHand], { ...dealerHand, cards: dealerHand.cards.map(c => ({...c, revealed: true})) }), 1150);
    }
  }, [gameState.currentBet, gameState.bankroll, gameState.deck, gameState.deckCount, updateCount, settleGame]);

  const handleNextCycle = useCallback(() => {
    if (gameState.status !== 'SETTLEMENT') return;
    if (gameState.bankroll >= gameState.currentBet) {
        setGameState(prev => ({ ...prev, bankroll: prev.bankroll - prev.currentBet, status: 'BETTING' }));
        setTimeout(() => startNewHand(), 10);
    }
  }, [gameState.status, gameState.bankroll, gameState.currentBet, startNewHand]);

  const handleInsurance = (takeInsurance: boolean) => {
    trackDecision(gameState.playerHands[0], !takeInsurance); // Insurance is sub-optimal
    setLastCorrect(!takeInsurance);
    setGameState(prev => ({
        ...prev,
        bankroll: takeInsurance ? prev.bankroll - (prev.currentBet / 2) : prev.bankroll,
        isInsuranceBet: takeInsurance ? prev.currentBet / 2 : undefined,
        status: prev.playerHands[0].isBlackjack ? 'SETTLEMENT' : 'PLAYER_TURN'
    }));
    if (gameState.playerHands[0].isBlackjack) {
        settleGame(gameState.playerHands, gameState.dealerHand);
    }
  };

  const handleAction = useCallback((action: Action) => {
    if (gameState.status !== 'PLAYER_TURN') return;
    const currentHand = gameState.playerHands[gameState.activeHandIndex];
    const isCorrect = action === gameState.recommendedAction;
    setLastCorrect(isCorrect);
    trackDecision(currentHand, isCorrect);
    
    if (action === 'STAND') {
        const nextIdx = gameState.activeHandIndex + 1;
        if (nextIdx < gameState.playerHands.length) {
            const nextHand = gameState.playerHands[nextIdx];
            setGameState(prev => ({ ...prev, activeHandIndex: nextIdx, recommendedAction: getRecommendedAction(nextHand, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(nextHand, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(nextHand, prev.dealerHand.cards[0]) }));
        } else dealerPlay(gameState.playerHands, gameState.deck);
    } else if (action === 'HIT') {
      const newDeck = [...gameState.deck];
      const nextCard = { ...newDeck.pop()!, revealed: true };
      updateCount([nextCard]);
      const newHandCards = [...currentHand.cards, nextCard];
      const status = calculateScore(newHandCards);
      const updatedHand = { ...currentHand, cards: newHandCards, ...status };
      const newPlayerHands = [...gameState.playerHands];
      newPlayerHands[gameState.activeHandIndex] = updatedHand;

      if (status.isBust) {
          const nextIdx = gameState.activeHandIndex + 1;
          if (nextIdx < newPlayerHands.length) {
              const nextHand = newPlayerHands[nextIdx];
              setGameState(prev => ({ ...prev, deck: newDeck, playerHands: newPlayerHands, activeHandIndex: nextIdx, recommendedAction: getRecommendedAction(nextHand, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(nextHand, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(nextHand, prev.dealerHand.cards[0]) }));
          } else dealerPlay(newPlayerHands, newDeck);
      } else {
          setGameState(prev => ({ ...prev, deck: newDeck, playerHands: newPlayerHands, recommendedAction: getRecommendedAction(updatedHand, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(updatedHand, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(updatedHand, prev.dealerHand.cards[0]) }));
      }
    } else if (action === 'DOUBLE') {
       const newDeck = [...gameState.deck];
       const nextCard = { ...newDeck.pop()!, revealed: true };
       updateCount([nextCard]);
       const newHandCards = [...currentHand.cards, nextCard];
       const updatedHand = { ...currentHand, cards: newHandCards, ...calculateScore(newHandCards), bet: currentHand.bet * 2 };
       const newPlayerHands = [...gameState.playerHands];
       newPlayerHands[gameState.activeHandIndex] = updatedHand;
       setGameState(prev => ({ ...prev, bankroll: prev.bankroll - currentHand.bet }));
       const nextIdx = gameState.activeHandIndex + 1;
       if (nextIdx < newPlayerHands.length) {
           const nextHand = newPlayerHands[nextIdx];
           setGameState(prev => ({ ...prev, deck: newDeck, playerHands: newPlayerHands, activeHandIndex: nextIdx, recommendedAction: getRecommendedAction(nextHand, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(nextHand, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(nextHand, prev.dealerHand.cards[0]) }));
       } else dealerPlay(newPlayerHands, newDeck);
    } else if (action === 'SPLIT') {
        const newDeck = [...gameState.deck];
        const card1 = currentHand.cards[0];
        const card2 = { ...newDeck.pop()!, revealed: true };
        const card3 = currentHand.cards[1];
        const card4 = { ...newDeck.pop()!, revealed: true };
        updateCount([card2, card4]);
        const hand1 = { cards: [card1, card2], ...calculateScore([card1, card2]), bet: currentHand.bet };
        const hand2 = { cards: [card3, card4], ...calculateScore([card3, card4]), bet: currentHand.bet };
        const newPlayerHands = [...gameState.playerHands];
        newPlayerHands.splice(gameState.activeHandIndex, 1, hand1, hand2);
        setGameState(prev => ({ ...prev, bankroll: prev.bankroll - currentHand.bet }));
        if (card1.rank === 'A') {
            dealerPlay(newPlayerHands, newDeck);
        } else {
            setGameState(prev => ({ ...prev, deck: newDeck, playerHands: newPlayerHands, recommendedAction: getRecommendedAction(hand1, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(hand1, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(hand1, prev.dealerHand.cards[0]) }));
        }
    } else if (action === 'SURRENDER') {
        const newPlayerHands = [...gameState.playerHands];
        newPlayerHands[gameState.activeHandIndex] = { ...currentHand, settlement: 'SURRENDER' };
        const nextIdx = gameState.activeHandIndex + 1;
        if (nextIdx < newPlayerHands.length) {
            const nextHand = newPlayerHands[nextIdx];
            setGameState(prev => ({ ...prev, playerHands: newPlayerHands, activeHandIndex: nextIdx, recommendedAction: getRecommendedAction(nextHand, prev.dealerHand.cards[0]), actionProbabilities: getActionProbabilities(nextHand, prev.dealerHand.cards[0]), explanation: getOptimalPlayExplanation(nextHand, prev.dealerHand.cards[0]) }));
        } else dealerPlay(newPlayerHands, gameState.deck);
    }
    sounds.click();
  }, [gameState, trackDecision, dealerPlay, updateCount]);

  const accuracyPercent = gameState.totalDecisions > 0 ? Math.round((gameState.correctDecisions / gameState.totalDecisions) * 100) : 0;

  return (
    <div className="h-screen p-2 md:p-4 flex flex-col gap-2 font-mono overflow-hidden bg-transparent text-slate-200 cursor-none">
      <CyberBackground streak={gameState.streak} status={handResult || undefined} />
      <div className="mouse-reticle" style={{ left: mouse.x, top: mouse.y }} />
      <div className="fixed inset-0 pointer-events-none hud-vignette z-[150]" />
      <div className="fixed inset-0 pointer-events-none z-[160] mix-blend-overlay opacity-20">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-neural-cyan/40 animate-[scan_9.2s_linear_infinite]" />
      </div>
      <header className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-black text-white glow-text-cyan flex items-center gap-3">
                <div className="relative">
                    <Cpu className="text-neural-cyan animate-pulse" size={18} />
                    <div className="absolute inset-0 bg-neural-cyan blur-md opacity-20" />
                </div>
                NEURAL_ARCHITECT <span className="text-neural-dim text-[10px] opacity-50 font-normal">v4.0_FULL_SYNC</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsHelpOpen(true)} className="p-2 text-neural-dim hover:text-white hover:bg-white/5 rounded transition-all" title="Manual"><HelpCircle size={18} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-neural-dim hover:text-white hover:bg-white/5 rounded transition-all" title="System Config"><Settings size={18} /></button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-full flex-1 overflow-hidden">
        {/* Left Sidebar - Diagnostics */}
        <aside className="flex flex-col gap-4 w-full lg:w-72 order-2 lg:order-1">
          <section className="neural-panel neural-border-cyan p-5 h-fit relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity"><BarChart size={24} /></div>
             <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black">Performance_Yield</span>
             <div className="text-3xl font-black text-white mt-1 flex items-center gap-3">
                <span className="min-w-[1.5em]">{((gameState.bankroll / INITIAL_BANKROLL - 1) * 100).toFixed(1)}%</span>
                <span className={cn("text-[10px] uppercase font-black px-2 py-0.5 rounded bg-black/40 border border-white/5", gameState.bankroll >= INITIAL_BANKROLL ? "text-green-500" : "text-neural-pink")}>
                   {gameState.bankroll >= INITIAL_BANKROLL ? 'POSITIVE' : 'NEGATIVE'}
                </span>
             </div>
             <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] text-neural-dim uppercase tracking-tighter">
                    <span>Session_Net</span>
                    <span className={cn("font-black", gameState.bankroll >= INITIAL_BANKROLL ? "text-green-400" : "text-neural-pink")}>
                        ${(gameState.bankroll - INITIAL_BANKROLL).toLocaleString()}
                    </span>
                </div>
                <div className="w-full h-[1px] bg-neural-border/20" />
                <div className="flex justify-between text-[10px] text-neural-dim uppercase tracking-tighter">
                    <span>Critical_Chain</span>
                    <span className="text-neural-pink font-black">{gameState.streak}x WIN</span>
                </div>
             </div>
          </section>

          {/* Neural Analytics - Upgraded for V4 */}
          <section className="neural-panel border-neural-accent/40 bg-neural-accent/5 p-6 flex flex-col gap-6">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black italic">Cognitive_Accuracy</span>
                <Activity size={14} className="text-neural-cyan animate-pulse" />
             </div>
             
             <div className="flex flex-col gap-8 items-center py-4">
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neural-border/10" />
                        <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={464.9} strokeDashoffset={464.9 - (464.9 * accuracyPercent) / 100} className="text-neural-cyan transition-all duration-[2300ms] ease-in-out shadow-[0_0_25px_rgba(34,211,238,0.6)]" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white glow-text-cyan">{accuracyPercent}%</span>
                        <span className="text-[8px] text-neural-dim uppercase font-black tracking-widest mt-1">Consistency</span>
                    </div>
                </div>

                <div className="flex flex-col gap-5 w-full px-2">
                    {[
                        { label: 'HARD', ...gameState.categoryStats.hard, color: 'text-white' },
                        { label: 'SOFT', ...gameState.categoryStats.soft, color: 'text-neural-cyan' },
                        { label: 'PAIR', ...gameState.categoryStats.pairs, color: 'text-neural-pink' }
                    ].map(s => {
                        const perc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                        return (
                            <div key={s.label} className="w-full">
                                <div className="flex justify-between text-xs font-black mb-2 tracking-wider">
                                    <span className="text-neural-dim">{s.label}_SYMBOLS</span>
                                    <span className={cn("glow-text-tiny", s.color)}>{perc}%</span>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} transition={{ duration: 1.725, ease: "easeOut" }} className={cn("h-full bg-current shadow-[0_0_10px_rgba(255,255,255,0.15)]", s.color)} />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-[8px] text-neural-dim/60 font-black italic tracking-tighter uppercase">{s.correct} / {s.total} LOCKS_VERIFIED</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
          </section>

          {/* Phase 4: Diagnostic Node (Counting Display) */}
          <section className="neural-panel border-neural-dim/30 bg-black/20 p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black">Diagnostic_Data</span>
                <button 
                    onClick={() => setGameState(prev => ({ ...prev, isCountingNodeVisible: !prev.isCountingNodeVisible }))}
                    className={cn("text-[8px] font-black px-2 py-0.5 border transition-all", gameState.isCountingNodeVisible ? "border-neural-cyan text-neural-cyan bg-neural-cyan/10" : "border-neural-border text-neural-dim")}
                >
                    {gameState.isCountingNodeVisible ? 'UPLINK_STABLE' : 'UPLINK_HIDDEN'}
                </button>
              </div>

              <div className={cn("grid grid-cols-2 gap-4 transition-all duration-[575ms]", gameState.isCountingNodeVisible ? "opacity-100" : "opacity-0 blur-md grayscale")}>
                 <div className="flex flex-col gap-1 p-2 bg-black/40 border border-neural-border/10">
                    <span className="text-[8px] text-neural-dim">RUNNING_COUNT</span>
                    <span className={cn("text-xl font-black", gameState.runningCount > 0 ? "text-green-400" : (gameState.runningCount < 0 ? "text-neural-pink" : "text-white"))}>
                        {gameState.runningCount > 0 ? '+' : ''}{gameState.runningCount}
                    </span>
                 </div>
                 <div className="flex flex-col gap-1 p-2 bg-black/40 border border-neural-border/10">
                    <span className="text-[8px] text-neural-dim">TRUE_COUNT</span>
                    <span className="text-xl font-black text-neural-cyan italic">
                        {gameState.trueCount > 0 ? '+' : ''}{gameState.trueCount}
                    </span>
                 </div>
              </div>
              <div className="text-[7px] text-neural-dim/40 leading-tight">
                 HI-LO SYSTEM: 2-6 (+1) / 7-9 (0) / 10-A (-1). USE DATA_NODE TO CALIBRATE BET_LEVERAGE.
              </div>
          </section>

        </aside>

        {/* Table Area */}
        <main className="flex-1 neural-panel relative flex flex-col items-center justify-between min-h-0 order-1 lg:order-2 overflow-hidden bg-black/40 backdrop-blur-md">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
             <div className="grid grid-cols-12 h-full w-full">
                {Array.from({length: 144}).map((_, i) => (<div key={i} className="border-[0.5px] border-neural-cyan/50" />))}
             </div>
             <div className="scan-line" />
          </div>

          <AnimatePresence mode="wait">
            {(gameState.status === 'BETTING' || (gameState.status === 'SETTLEMENT' && gameState.playerHands.length === 0)) ? (
              <motion.div key="betting" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.03 }} className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-4xl px-4">
                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-[9px] text-neural-dim uppercase tracking-[0.4em] animate-pulse">ESTABLISH_EXPOSURE_LEVEL</span>
                    <div className="text-6xl font-black text-white glow-text-cyan flex items-baseline gap-2">
                        <span className="text-2xl text-neural-dim/30 font-normal">$</span>{gameState.currentBet}
                    </div>
                </div>

                <div className="relative w-full flex justify-center py-6 px-6 bg-white/[0.02] border border-neural-border/10 backdrop-blur-sm rounded-lg overflow-hidden group">
                    <ChipBackground />
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6 relative z-10">
                        {CHIP_VALUES.map(val => (
                            <motion.button 
                                key={val} 
                                onClick={() => placeBet(val)} 
                                disabled={gameState.bankroll < val}
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                whileTap={{ scale: 0.85, rotate: -5 }}
                                className={cn(
                                    "group w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-[575ms] shadow-2xl relative", 
                                    val === 10 ? "border-slate-200 text-slate-200 hover:border-white hover:text-white" : 
                                    val === 50 ? "border-neural-cyan text-neural-cyan hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]" : 
                                    val === 100 ? "border-neural-pink text-neural-pink hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]" : 
                                    "border-yellow-600 text-yellow-600 hover:shadow-[0_0_40px_rgba(202,138,4,0.4)]", 
                                    gameState.bankroll < val ? "opacity-10 grayscale" : "cursor-pointer"
                                )}
                            >
                                <span className="text-[6px] font-black tracking-widest opacity-40 uppercase">CHIP_{val}</span>
                                <span className="text-base md:text-lg font-black leading-none mt-1">${val}</span>
                                <div className="absolute inset-1.5 border-2 border-dashed border-current opacity-10 rounded-full animate-[spin_34.5s_linear_infinite]" />
                                
                                {/* Inner glow for active chips */}
                                {! (gameState.bankroll < val) && (
                                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-current transition-opacity" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button disabled={gameState.currentBet <= 0} onClick={startNewHand} className={cn("neural-button h-16 px-20 text-lg font-black tracking-[0.4em] transition-all duration-[805ms] shadow-[0_0_50px_rgba(0,242,255,0.15)] uppercase", gameState.currentBet > 0 ? "neural-button-optimal border-neural-cyan text-neural-cyan scale-105" : "opacity-10")}>
                        SYNC_INITIAL_DEAL
                    </button>
                    {gameState.currentBet > 0 && (
                        <button onClick={clearBet} className="text-[9px] text-neural-pink opacity-50 hover:opacity-100 uppercase font-black tracking-widest transition-opacity border-b border-neural-pink/30">
                            RESET_INPUT_STREAM
                        </button>
                    )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-between w-full py-2 px-2 overflow-hidden">
                  {/* Dealer Hand */}
                  <div className="flex flex-col items-center gap-2">
                     <div className="text-[10px] uppercase tracking-[0.4em] text-neural-dim flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-neural-border/30" />
                        SYSTEM_ENTITY_NODE
                        <div className="w-12 h-[1px] bg-neural-border/30" />
                     </div>
                     <div className="flex gap-4 min-h-[120px]">
                        {gameState.dealerHand.cards.map((card, i) => (<CardComponent key={card.id} card={card} index={i} />))}
                     </div>
                     <div className="h-10 flex items-center justify-center">
                        <AnimatePresence>
                        {gameState.status === 'SETTLEMENT' && (
                            <motion.div initial={{ opacity: 0, scale: 0.5, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="text-4xl font-black text-white glow-text-pink uppercase tracking-widest border-y border-neural-pink/30 py-1 px-8 italic">
                                RESULT: {gameState.dealerHand.score}
                            </motion.div>
                        )}
                        </AnimatePresence>
                     </div>
                  </div>

                  {/* Player Assets */}
                  <div className="flex flex-col items-center gap-2 w-full mb-1">
                      <div className="text-[10px] uppercase tracking-[0.8em] text-neural-dim opacity-20 flex items-center gap-6 w-full">
                        <div className="h-[1px] flex-1 bg-neural-border/50" />
                        USER_ASSETS
                        <div className="h-[1px] flex-1 bg-neural-border/50" />
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-4 md:gap-8 items-start min-h-[150px] w-full">
                        {gameState.playerHands.map((hand, idx) => (
                            <div key={idx} className={cn("flex flex-col items-center gap-2 transition-all duration-[805ms] relative min-w-[120px]", gameState.status === 'PLAYER_TURN' && gameState.activeHandIndex === idx ? "z-20" : "opacity-30 scale-90 blur-sm grayscale")}>
                                <div className="flex flex-col items-center">
                                    <div className="text-[10px] text-neural-cyan font-black mb-1 bg-neural-cyan/10 px-4 py-1 border border-neural-cyan/30 rounded-tl-xl rounded-br-xl uppercase tracking-widest leading-none">
                                        NODE_0{idx + 1}
                                    </div>
                                    <div className={cn("text-4xl font-black mt-2 italic", hand.isSoft ? "text-neural-cyan glow-text-cyan" : "text-neural-pink glow-text-pink")}>
                                        {hand.settlement || hand.score}
                                    </div>
                                    <div className="text-[9px] text-neural-dim font-black mt-2 bg-black py-0.5 px-3 border border-neural-border/20 tracking-tighter">STAKE: ${hand.bet}</div>
                                </div>

                                <div className="relative flex justify-center items-center h-28" style={{ width: `${110 + (hand.cards.length - 1) * 38}px` }}>
                                    {hand.cards.map((card, i) => (
                                       <div key={card.id} className="absolute transition-all duration-[805ms]" style={{ left: `${i * 38}px`, zIndex: i, transform: `rotate(${(i - (hand.cards.length - 1) / 2) * 6}deg) translateY(${Math.abs(i - (hand.cards.length - 1) / 2) * 10}px)` }}>
                                           <CardComponent card={card} index={i} />
                                       </div>
                                    ))}
                                </div>
                                
                                 {gameState.status === 'PLAYER_TURN' && gameState.activeHandIndex === idx && (
                                      <motion.div layoutId="active" className="absolute -bottom-8 z-50 px-10 py-2 bg-neural-cyan text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(34,211,238,0.7)] group">
                                        SYSTEM_PROCESSING
                                        <div className="absolute inset-0 border border-white/40 animate-pulse" />
                                     </motion.div>
                                )}
                            </div>
                        ))}
                      </div>
                  </div>

                  {/* Dynamic Controls */}
                  <div className="w-full flex justify-center p-2 gap-2 flex-wrap bg-neural-panel/90 backdrop-blur-3xl border-t border-neural-border/40 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
                     {gameState.status === 'INSURANCE_OFFER' ? (
                         <div className="flex flex-col items-center gap-4 py-2 max-w-4xl w-full">
                            <div className="flex flex-col items-center gap-3">
                                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.15 }} className="text-base text-yellow-500 font-black tracking-[0.3em] flex items-center gap-3 uppercase italic">
                                    <Zap size={20} /> ADVERSARY_ACE_DETECTED
                                </motion.div>
                                <span className="text-xs text-white/40 tracking-wider font-medium">INITIATE RISK_MITIGATION PROTOCOL? [EXPENSE: ${gameState.currentBet / 2}]</span>
                            </div>
                            <div className="flex gap-8 w-full justify-center">
                                <button onClick={() => handleInsurance(true)} className="neural-button w-48 h-12 text-xs font-black border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black shadow-[0_0_30px_rgba(234,179,8,0.2)]">MITIGATE [1:2]</button>
                                <button onClick={() => handleInsurance(false)} className="neural-button w-48 h-12 text-xs font-black border-neural-pink text-neural-pink hover:bg-neural-pink hover:text-white shadow-[0_0_30px_rgba(236,72,153,0.2)]">VOID_PROTOCOL</button>
                            </div>
                         </div>
                     ) : gameState.status === 'SETTLEMENT' ? (
                         <div className="flex items-center gap-10">
                             <div className="flex flex-col items-center">
                                 <span className="text-[8px] text-neural-dim uppercase font-black tracking-widest opacity-30 mb-1 italic">CYCLE_COMPLETE</span>
                                 <div className={cn("text-4xl font-black italic tracking-tighter uppercase", handResult === 'WIN' || handResult === 'BLACKJACK' ? "text-neural-cyan glow-text-cyan" : (handResult === 'PUSH' ? "text-neural-dim" : "text-neural-pink glow-text-pink"))}>
                                    {handResult}
                                 </div>
                             </div>
                                <div className="h-28 w-[1px] bg-neural-border/30" />
                             <div className="flex flex-col gap-2">
                                <button onClick={handleNextCycle} className="neural-button neural-button-optimal h-12 px-12 text-sm font-black flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-neural-cyan/30 shadow-2xl uppercase tracking-[0.2em]">
                                    <RotateCcw size={16} /> NEXT_CYCLE (${gameState.currentBet})
                                </button>
                                <button onClick={() => setGameState(prev => ({ ...prev, status: 'BETTING', currentBet: 0, playerHands: [] }))} className="text-[9px] text-neural-dim/60 hover:text-white font-black tracking-[0.3em] transition-all text-center border-b border-transparent hover:border-white/20 pb-0.5">RECONFIGURE_STAKE</button>
                             </div>
                        </div>
                     ) : (
                          <div className="flex gap-4 md:gap-6 flex-wrap justify-center items-end max-w-7xl">
                            {(['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER'] as Action[]).map(action => {
                                const prob = gameState.actionProbabilities?.[action];
                                const hand = gameState.playerHands[gameState.activeHandIndex];
                                const isDisabled = gameState.status !== 'PLAYER_TURN' || (action === 'DOUBLE' && (hand.cards.length !== 2 || gameState.bankroll < hand.bet)) || (action === 'SPLIT' && (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank || gameState.bankroll < hand.bet)) || (action === 'SURRENDER' && hand.cards.length !== 2);
                                if (isDisabled && (action === 'DOUBLE' || action === 'SPLIT' || action === 'SURRENDER')) return null;

                                 return (
                                    <div key={action} className="flex flex-col items-center gap-5">
                                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={cn("text-[11px] font-black tracking-widest px-6 py-2 border backdrop-blur-md shadow-xl", gameState.recommendedAction === action ? "bg-neural-cyan border-white text-black shadow-neural-cyan/40" : "bg-black/80 border-neural-border/40 text-neural-dim")}>
                                            {prob !== undefined ? `${prob}% WIN` : 'SYNC...'}
                                        </motion.div>
                                        <button 
                                            disabled={isDisabled} 
                                            onClick={() => handleAction(action)} 
                                            onMouseEnter={() => {
                                                setHoveredAction(action);
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredAction(null);
                                            }}
                                            className={cn(
                                                "neural-button min-w-[150px] h-18 relative group transition-all duration-[575ms] overflow-hidden", 
                                                gameState.recommendedAction === action ? "border-neural-cyan text-neural-cyan scale-110 shadow-[0_0_35px_rgba(34,211,238,0.4)]" : "border-neural-border/40 text-neural-dim/70 hover:border-white hover:text-white"
                                            )}
                                        >
                                            <div className="relative z-10 tracking-[0.4em] font-black uppercase text-sm">{action}</div>
                                            {gameState.recommendedAction === action && <div className="absolute inset-0 bg-neural-cyan/10 animate-pulse" />}
                                        </button>
                                        <div className="h-6">
                                            {gameState.recommendedAction === action && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-black text-neural-cyan uppercase tracking-[0.3em] italic">[ OPTIMAL_HEURISTIC ]</motion.div>}
                                        </div>
                                    </div>
                                );
                            })}
                          </div>
                     )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correctness Notification */}
           <AnimatePresence>
             {lastCorrect !== null && (
                 <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 1.5 }} className={cn("absolute top-8 right-8 px-9 py-4 rounded-sm border-l-[8px] uppercase font-black tracking-[0.3em] text-[10px] backdrop-blur-2xl shadow-2xl z-[100]", lastCorrect ? "bg-green-500/10 border-green-500 text-green-400 shadow-green-500/30" : "bg-neural-pink/10 border-neural-pink text-neural-pink shadow-neural-pink/30 animate-pulse")}>
                     {lastCorrect ? "✓ NEURAL_SYNC_ESTABLISHED" : "⚠ SYSTEM_DEVIATION_DETECTED"}
                 </motion.div>
             )}
          </AnimatePresence>
        </main>

        <aside className="w-full lg:w-80 order-3 flex flex-col gap-4 h-full">
           {/* New Enlarged Metrics Card */}
           <section className="neural-panel neural-border-cyan p-6 bg-black/60 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><Wallet size={24} /></div>
              
              <div className="flex flex-col gap-6">
                 {/* Bankroll */}
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black italic">Net_Exposure_Vault</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-white glow-text-cyan">${gameState.bankroll.toLocaleString()}</span>
                       <span className="text-[10px] text-neural-cyan font-black tracking-widest opacity-60">USD</span>
                    </div>
                 </div>

                 {/* Active Bet */}
                 {gameState.currentBet > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1 pt-4 border-t border-neural-border/20">
                       <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black italic">Active_Stake_Threshold</span>
                       <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white glow-text-pink animate-pulse">${gameState.currentBet}</span>
                          <div className="flex items-center gap-2 px-2 py-0.5 bg-neural-pink/10 border border-neural-pink/30 rounded-sm">
                             <Target size={10} className="text-neural-pink" />
                             <span className="text-[8px] text-neural-pink font-black uppercase">Live</span>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {/* Shoe Capacity */}
                 <div className="flex flex-col gap-3 pt-4 border-t border-neural-border/20">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-neural-dim uppercase tracking-[0.2em] font-black italic">Shoe_Capacity_Load</span>
                       <span className="text-[10px] text-neural-cyan font-black">{Math.round((gameState.deck.length / (gameState.deckCount * 52)) * 100)}%</span>
                    </div>
                    <div className="flex gap-1.5 h-2">
                       {Array.from({length: 12}).map((_, i) => (
                           <div 
                             key={i} 
                             className={cn(
                               "flex-1 transition-all duration-1000", 
                               gameState.deck.length > 0 && i < Math.ceil((gameState.deck.length / (gameState.deckCount * 52)) * 12) 
                                 ? "bg-neural-cyan shadow-[0_0_8px_rgba(0,242,255,0.6)]" 
                                 : "bg-neural-border/20"
                             )} 
                           />
                       ))}
                    </div>
                 </div>
              </div>
           </section>

           <section className="neural-panel flex-1 flex flex-col bg-black/40 backdrop-blur-md border-neural-border/10 overflow-hidden">
              <div className="flex items-center justify-between mb-0 p-6 border-b border-neural-border/20 bg-black/40">
                 <span className="text-[11px] uppercase text-neural-dim flex items-center gap-3 tracking-[0.4em] font-black">
                    <History size={16} className="text-neural-cyan" /> FILE_BUFFER
                 </span>
                 <div className="text-[9px] text-neural-dim px-2 py-0.5 border border-neural-border tracking-tighter">v4.0_MOD</div>
              </div>
              
              <div className="flex-1 relative overflow-hidden group/history">
                 {/* Decorative Scroll Track Overlay */}
                 <div className="absolute top-4 right-1.5 bottom-4 w-[2px] bg-neural-border/10 rounded-full overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neural-cyan/5 to-transparent animate-[scan_10s_linear_infinite]" />
                 </div>
                 
                 <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar scroll-overlay-fade">
                    {gameState.history.map((h, i) => (
                       <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={h.id} className="p-5 border border-neural-border/10 rounded-sm flex flex-col gap-4 group hover:border-neural-cyan/30 transition-all bg-black/40 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] -rotate-45 translate-x-8 -translate-y-8" />
                          <div className="flex justify-between items-start relative z-10">
                             <div className="flex flex-col gap-2">
                                <span className={cn("text-[10px] font-black tracking-[0.3em] uppercase italic", h.result === 'WIN' || h.result === 'BLACKJACK' ? "text-neural-cyan" : (h.result === 'PUSH' ? "text-neural-dim" : "text-neural-pink"))}>
                                   {h.result}
                                </span>
                                <span className="text-[9px] text-neural-dim font-mono tracking-widest leading-none opacity-40">UPLINK_{h.id}</span>
                             </div>
                             <div className={cn("text-base font-black font-mono", h.amount > 0 ? "text-green-500" : (h.amount < 0 ? "text-red-500" : "text-neutral-500"))}>
                                 {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()}
                             </div>
                          </div>
                          <div className="text-[9px] text-neural-dim font-mono flex items-center gap-3 border-t border-neural-border/5 pt-4 opacity-60">
                              <Target size={12} className="opacity-50" /> {h.handSummary}
                          </div>
                       </motion.div>
                    ))}
                    {gameState.history.length === 0 && <div className="text-[11px] text-neural-dim text-center py-24 opacity-10 font-black tracking-[1em] italic">NULL_SET</div>}
                 </div>
              </div>

              
              <div className="p-8 border-t border-neural-border/20 bg-black/60">
                 <div className="flex items-center gap-3 text-[11px] mb-4 uppercase tracking-[0.3em] text-neural-cyan font-black italic">
                    <Shield size={14} className="animate-pulse" /> SECURITY_STATUS
                 </div>
                 <p className="text-[10px] leading-relaxed text-neural-dim/60 font-mono italic">
                    "Shoe integrity verified. All neural decision branches are synced to optimal basic strategy thresholds."
                 </p>
              </div>
           </section>
        </aside>
      </div>

      {/* Neural HUD Display */}
      <AnimatePresence>
        {hoveredAction && gameState.status === 'PLAYER_TURN' && (
           <NeuralHUD 
              action={hoveredAction} 
              recommendedAction={gameState.recommendedAction || null} 
              explanation={gameState.explanation || ""} 
              mouse={mouse}
           />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative neural-panel border-neural-cyan w-full max-w-xl p-10 bg-black flex flex-col gap-8">
                    <div className="flex justify-between items-center border-b border-neural-border/30 pb-6">
                        <div className="flex items-center gap-4">
                            <Settings className="text-neural-cyan" size={24} />
                            <h2 className="text-2xl font-black text-white italic tracking-widest">SYSTEM_CONFIGURATION</h2>
                        </div>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-neural-dim hover:text-white uppercase font-black text-xs tracking-widest border border-neural-border/30 px-3 py-1 mt-1">CLOSE</button>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Dealer Rules */}
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] text-neural-dim uppercase font-black tracking-widest border-l-2 border-neural-cyan pl-3">DEALER_ALGORITHM</span>
                            <div className="flex justify-between items-center p-4 bg-white/5 border border-neural-border/20">
                                <span className="text-sm font-black tracking-wider">HIT SOFT 17 (H17)</span>
                                <button 
                                    onClick={() => setGameState(prev => ({ ...prev, dealerHitsSoft17: !prev.dealerHitsSoft17 }))}
                                    className={cn("w-14 h-8 rounded-sm relative transition-all duration-300", gameState.dealerHitsSoft17 ? "bg-neural-cyan" : "bg-neural-border/40")}
                                >
                                    <div className={cn("absolute top-1 w-6 h-6 bg-white transition-all duration-300 shadow-xl", gameState.dealerHitsSoft17 ? "left-7" : "left-1")} />
                                </button>
                            </div>
                        </div>

                        {/* Deck Count */}
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] text-neural-dim uppercase font-black tracking-widest border-l-2 border-neural-pink pl-3">SHOE_DENSITY [NUMBER_OF_DECKS]</span>
                            <div className="flex gap-2">
                                {[1, 2, 4, 6, 8].map(count => (
                                    <button 
                                        key={count} 
                                        onClick={() => setGameState(prev => ({ ...prev, deckCount: count, deck: [] }))}
                                        className={cn("flex-1 py-4 border font-black transition-all", gameState.deckCount === count ? "border-neural-pink text-neural-pink bg-neural-pink/10 shadow-[0_0_20px_rgba(236,72,153,0.3)]" : "border-neural-border/20 text-neural-dim hover:border-neural-pink/50")}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-neural-pink/10 border border-neural-pink/30 flex items-start gap-4">
                        <Shield className="text-neural-pink shrink-0" size={18} />
                        <p className="text-[10px] leading-relaxed text-neural-pink/80 uppercase font-black tracking-wider">
                            WARNING: MODIFYING SYSTEM PARAMETERS WILL FLUSH CURRENT LOGS AND RESET THE DATA_BUFFER FOR SYNC INTEGRITY.
                        </p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-2 py-4 border-t border-neural-border/20 flex justify-between text-[9px] text-neural-dim uppercase tracking-[0.5em] font-black italic">
         <div className="flex gap-12 text-neural-cyan/50">
            <span className="text-white opacity-100">© 2124 NEURAL_ARCHITECT</span>
            <span className="hidden md:inline">SYSTEM: STABLE_V4.1_X86_AUTO</span>
         </div>
         <div className="flex gap-12">
            <span className="hidden md:inline">SIG: 0xFF8A9C22B1</span>
            <span className="text-neural-pink opacity-80 animate-pulse uppercase">UPLINK_PROTOCOL_ENCRYPTED</span>
         </div>
      </footer>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ResultAnimation result={handResult} onComplete={() => setHandResult(null)} />
    </div>
  );
}
