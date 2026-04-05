export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number[];
  revealed: boolean;
  id: string;
}

export type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER' | 'INSURANCE_YES' | 'INSURANCE_NO';

export interface Hand {
  cards: Card[];
  score: number;
  isBust: boolean;
  isBlackjack: boolean;
  isSoft: boolean;
  bet: number;
  settlement?: 'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER';
}

export type GameStatus = 'BETTING' | 'DEALING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'SETTLEMENT' | 'INSURANCE_OFFER';

export interface GameState {
  deck: Card[];
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: Hand;
  status: GameStatus;
  bankroll: number;
  currentBet: number;
  streak: number;
  bestStreak: number;
  lastDecisionCorrect?: boolean;
  recommendedAction?: Action;
  actionProbabilities?: Partial<Record<Action, number>>;
  history: GameHistory[];
  isInsuranceBet?: number;
  explanation?: string;
  // Phase 3 Analytics
  totalDecisions: number;
  correctDecisions: number;
  categoryStats: {
    hard: { total: number; correct: number };
    soft: { total: number; correct: number };
    pairs: { total: number; correct: number };
  };
  // Phase 4 Simulation & Counting
  dealerHitsSoft17: boolean;
  deckCount: number;
  runningCount: number;
  trueCount: number;
  isCountingNodeVisible: boolean;
}

export interface GameHistory {
  id: string;
  result: 'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER';
  amount: number;
  handSummary: string;
  timestamp: number;
}
