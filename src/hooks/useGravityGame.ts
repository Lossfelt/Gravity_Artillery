import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { initialPlanets } from '../constants/game';
import { createInitialModel, gameReducer, isMatchOver, PlayerNumber } from '../game/gameReducer';
import { generateGravitationalBodies } from '../utils/generateGravitationalBodies';
import { createRandom, randomSeed } from '../utils/random';
import { useSimulation } from './useSimulation';
import { useAiOpponent } from './useAiOpponent';
import { Difficulty } from '../game/ai';

type UseGravityGameProps = {
  onExplosion?: () => void;
  // When set, the computer plays player 2
  aiDifficulty?: Difficulty | null;
};

const RESULT_DELAY_MS = 2000;

export const useGravityGame = ({ onExplosion, aiDifficulty = null }: UseGravityGameProps = {}) => {
  const [model, dispatch] = useReducer(gameReducer, undefined, () => createInitialModel());
  const planets = initialPlanets;

  // The star map is derived from a seed, so the same seed recreates the same map
  const gravitationalBodies = useMemo(
    () => generateGravitationalBodies(planets, createRandom(model.mapSeed)),
    [planets, model.mapSeed]
  );

  const simulationRef = useSimulation({
    shotNumber: model.shotNumber,
    roundNumber: model.roundNumber,
    aims: { 1: model.players[1], 2: model.players[2] },
    lives: { 1: model.players[1].lives, 2: model.players[2].lives },
    planets,
    gravitationalBodies,
    dispatch,
    onExplosion
  });

  useAiOpponent({
    enabled: aiDifficulty !== null,
    difficulty: aiDifficulty ?? 'normal',
    model,
    planets,
    gravitationalBodies,
    dispatch
  });

  // Show the match result a moment after the final hit
  const matchOver = model.phase === 'gameover' && isMatchOver(model);
  useEffect(() => {
    if (!matchOver) return;
    const timeoutId = window.setTimeout(() => dispatch({ type: 'revealWinner' }), RESULT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [matchOver]);

  const adjustPower = useCallback((player: PlayerNumber, delta: number) =>
    dispatch({ type: 'adjustPower', player, delta }), []);
  const adjustAngle = useCallback((player: PlayerNumber, delta: number) =>
    dispatch({ type: 'adjustAngle', player, delta }), []);
  const toggleReady = useCallback((player: PlayerNumber) =>
    dispatch({ type: 'toggleReady', player, mapSeed: randomSeed() }), []);
  const nextRound = useCallback(() => dispatch({ type: 'nextRound', mapSeed: randomSeed() }), []);

  return { model, planets, gravitationalBodies, simulationRef, adjustAngle, adjustPower, toggleReady, nextRound };
};
