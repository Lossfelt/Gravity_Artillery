import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { initialPlanets } from '../constants/game';
import { createInitialModel, gameReducer, isMatchOver, PlayerNumber } from '../game/gameReducer';
import { generateGravitationalBodies } from '../utils/generateGravitationalBodies';
import { createRandom, randomSeed } from '../utils/random';
import { useSimulation } from './useSimulation';

type UseGravityGameProps = {
  onExplosion?: () => void;
};

const RESULT_DELAY_MS = 2000;

export const useGravityGame = ({ onExplosion }: UseGravityGameProps = {}) => {
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
    angles: { 1: model.players[1].angle, 2: model.players[2].angle },
    planets,
    gravitationalBodies,
    dispatch,
    onExplosion
  });

  // Show the match result a moment after the final hit
  const matchOver = model.phase === 'gameover' && isMatchOver(model);
  useEffect(() => {
    if (!matchOver) return;
    const timeoutId = window.setTimeout(() => dispatch({ type: 'revealWinner' }), RESULT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [matchOver]);

  const setAngle = useCallback((player: PlayerNumber, angle: number) =>
    dispatch({ type: 'setAngle', player, angle }), []);
  const toggleReady = useCallback((player: PlayerNumber) =>
    dispatch({ type: 'toggleReady', player, mapSeed: randomSeed() }), []);
  const nextRound = useCallback(() => dispatch({ type: 'nextRound', mapSeed: randomSeed() }), []);

  return { model, planets, gravitationalBodies, simulationRef, setAngle, toggleReady, nextRound };
};
