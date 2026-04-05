import type { Card, Rank, Suit } from '../types/game';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(numDecks = 6): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = [parseInt(rank)];
        if (rank === 'A') value = [1, 11];
        else if (['J', 'Q', 'K'].includes(rank)) value = [10];
        else if (rank === '10') value = [10];

        deck.push({
          suit,
          rank,
          value,
          revealed: false,
          id: `${i}-${suit}-${rank}`
        });
      }
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function calculateScore(cards: Card[]): { score: number; isSoft: boolean; isBust: boolean; isBlackjack: boolean } {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      score += 11;
    } else {
      score += card.value[0];
    }
  }

  let isSoft = false;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  if (aces > 0 && score <= 21) {
    // If we have an ace counted as 11, it's a soft hand
    // Wait, the "soft" hand definition is technically if one ace is currently 11.
    isSoft = true;
  }

  const isBust = score > 21;
  const isBlackjack = cards.length === 2 && score === 21;

  return { score, isSoft, isBust, isBlackjack };
}
