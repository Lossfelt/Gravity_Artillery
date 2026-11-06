import { Dispatch, useEffect, useRef } from 'react';
import { GravityBody, Planet } from '../types/game';
import { Aim, GameAction, GameModel } from '../game/gameReducer';
import { aimWithError, Difficulty, findBestAim } from '../game/ai';
import { randomSeed } from '../utils/random';

type Params = {
  enabled: boolean;
  difficulty: Difficulty;
  model: GameModel;
  planets: { player1: Planet; player2: Planet };
  gravitationalBodies: GravityBody[];
  dispatch: Dispatch<GameAction>;
};

const AI_PLAYER = 2;
const THINK_MS = 900; // Feels like the computer is considering the shot
const NEXT_ROUND_MS = 600;

/**
 * Plays player 2. In setup it aims and presses Fire after a short pause; after
 * a hit it presses Next. It never looks at the human's aim.
 */
export const useAiOpponent = ({ enabled, difficulty, model, planets, gravitationalBodies, dispatch }: Params) => {
  // Best aim and number of shots so far, per star map
  const mapRef = useRef<{ seed: number; best: Aim | null; attempts: number }>({ seed: -1, best: null, attempts: 0 });
  const { phase, mapSeed } = model;
  const ready = model.players[AI_PLAYER].ready;

  useEffect(() => {
    if (!enabled || ready || phase === 'firing') return;

    const timeoutId = window.setTimeout(() => {
      if (phase === 'setup') {
        if (mapRef.current.seed !== mapSeed) mapRef.current = { seed: mapSeed, best: null, attempts: 0 };
        const map = mapRef.current;
        map.best ??= findBestAim(planets, gravitationalBodies, AI_PLAYER);
        const aim = aimWithError(map.best, AI_PLAYER, difficulty, map.attempts, Math.random);
        map.attempts++;
        dispatch({ type: 'setAim', player: AI_PLAYER, ...aim });
      }
      dispatch({ type: 'toggleReady', player: AI_PLAYER, mapSeed: randomSeed() });
    }, phase === 'setup' ? THINK_MS : NEXT_ROUND_MS);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, difficulty, ready, phase, mapSeed, planets, gravitationalBodies, dispatch]);
};
