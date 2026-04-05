# Project Architecture: Black Jack Trainer (v4.0)

## Overview
Black Jack Trainer is a high-fidelity web application designed to help players master basic Blackjack strategy through interactive practice. It features a deterministic game engine, real-time strategy evaluation (Neural Advisor), statistical win-probabilities, and a Hi-Lo card counting engine, all wrapped in a premium "Neural" dark-mode UI.

## Tech Stack
- **Framework**: [React](https://reactjs.org/) (v18+)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks (useState, useEffect, useCallback)

## Directory Structure
```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # UI components
│   ├── Card.tsx           # Individual card rendering with flip animations
│   ├── HelpModal.tsx      # Strategy chart overlay
│   └── ResultAnimation.tsx # Game outcome overlays
├── logic/           # Core game engine and strategy logic
│   ├── deck.ts            # Deck creation, shuffling, and management
│   └── strategy.ts        # Strategy lookup-tables, probability stats, and advisor
├── types/           # TypeScript interfaces and enums
│   └── game.ts            # Centralized game state and type definitions
├── App.tsx          # Main game orchestration, counting engine, and UI
├── main.tsx         # Application entry point
└── index.css        # Global styles and Tailwind configuration
```

## Core Modules & Logic

### 1. Game Orchestration (`App.tsx`)
The central engine of the application. It manages:
- **Game Lifecycle**: Betting -> Dealing -> Player actions -> Dealer resolution -> Settlement.
- **Multi-hand Support**: Handles splitting logic and sequential play across multiple hands.
- **Counting Engine**: Implements the Hi-Lo system (2-6: +1, 7-9: 0, 10-A: -1) with True Count calculations based on remaining decks.
- **Session Analytics**: Tracks real-time accuracy, streak data, and category-specific stats (Hard, Soft, Pairs).
- **Insurance Logic**: Integrated insurance offer phase when dealer shows an Ace.

### 2. Strategy & Neural Advisor (`src/logic/strategy.ts`)
- **Strategy Engine**: Provides the optimal "Basic Strategy" move for any given hand vs. dealer upcard.
- **Neural Advisor**: Generates human-readable strategic explanations (Tactical Heuristics) justifying why a specific move is optimal.
- **Win-Probability Stats**: Calculates and displays the estimated win-likelihood for every possible action (Hit, Stand, Double, etc.) based on standard heuristics.

### 3. Deck & Shoe Management (`src/logic/deck.ts`)
- Implements standard 52-card deck logic with multi-deck "Shoe" support (1, 2, 4, 6, 8 deck configurations).
- **Shoe Management**: Automatically reshuffles when the shoe depth reaches the 25% threshold.

### 4. UI Components
- **Card**: Premium visual representation with responsive formatting and entrance animations.
- **ResultAnimation**: High-impact overlays informing the player of outcomes (Blackjack, Win, Bust, etc.).
- **Diagnostic Node**: A toggleable UI panel displaying real-time Running Count and True Count for card counting practice.

## Data Flow
1. **Initiation**: User selects a stake and triggers "SYNC_INITIAL_DEAL".
2. **Setup**: `App.tsx` draws cards from `deck.ts`, updates the `runningCount`, and calculates initial `trueCount`.
3. **Strategy Analysis**: The `strategy.ts` engine evaluates the state, generating the `recommendedAction`, `actionProbabilities`, and `explanation`.
4. **Player turn**: The user interacts with the UI (Hit/Stand/Split/Double/Surrender). Each action updates the `accuracyPercent` and session stats.
5. **Dealer Workflow**: `dealerPlay` logic executes based on H17/S17 rules, drawing cards and updating the count until the hand is finalized.
6. **Settlement**: Results are calculated, bankroll is updated, and `ResultAnimation` triggers the final visual feedback.

## Future Roadmap (V5.0)
- **Historical Performance Graphs**: Visualizing accuracy and bankroll trends over time.
- **Advanced Side Bets**: Implementing Perfect Pairs, 21+3, and other popular casino variations.
- **Drill Modes**: Specific practice sessions for difficult hands (e.g., only Soft totals or 12-16 vs 7-A).
- **Mobile optimization**: Enhancing the "Neural" interface for mobile touch interaction.

