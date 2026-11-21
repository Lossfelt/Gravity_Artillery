import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { initialPlanets } from '../constants/game';
import { createInitialModel, GameModel, gameReducer, isMatchOver, Lives, matchWinner, PlayerNumber, Winner } from '../game/gameReducer';
import { DEFAULT_MAP, generateGravitationalBodies, MapOptions } from '../utils/generateGravitationalBodies';
import { createRandom, randomSeed } from '../utils/random';
import { SimulationSounds, useSimulation } from './useSimulation';
import { useAiOpponent } from './useAiOpponent';
import { Difficulty } from '../game/ai';

type UseGravityGameProps = {
  sounds?: SimulationSounds;
  // When set, the computer plays player 2
  aiDifficulty?: Difficulty | null;
  // Multiplies the computer's aiming error (see aimWithError)
  aiErrorScale?: number;
  map?: MapOptions;
  // Stops the computer from playing, e.g. while a menu is open
  paused?: boolean;
  // Called once per match, when the result is shown
  onMatchEnd?: (winner: Exclude<Winner, null>, model: GameModel) => void;
};

const RESULT_DELAY_MS = 2000;

export const useGravityGame = ({
  sounds,
  aiDifficulty = null,
  aiErrorScale = 1,
  map = DEFAULT_MAP,
  paused = false,
  onMatchEnd
}: UseGravityGameProps = {}) => {
  const [model, dispatch] = useReducer(gameReducer, undefined, () => createInitialModel());
  const planets = initialPlanets;

  // The star map is derived from a seed, so the same seed recreates the same map
  const { bodyCount, blackHoleChance } = map;
  const gravitationalBodies = useMemo(
    () => generateGravitationalBodies(planets, createRandom(model.mapSeed), { bodyCount, blackHoleChance }),
    [planets, model.mapSeed, bodyCount, blackHoleChance]
  );

  const simulationRef = useSimulation({
    shotNumber: model.shotNumber,
    roundNumber: model.roundNumber,
    aims: { 1: model.players[1], 2: model.players[2] },
    lives: { 1: model.players[1].lives, 2: model.players[2].lives },
    planets,
    gravitationalBodies,
    dispatch,
    sounds
  });

  useAiOpponent({
    enabled: aiDifficulty !== null && !paused,
    difficulty: aiDifficulty ?? 'normal',
    errorScale: aiErrorScale,
    model,
    planets,
    gravitationalBodies,
    dispatch
  });

  const latestRef = useRef({ model, onMatchEnd });
  useEffect(() => {
    latestRef.current = { model, onMatchEnd };
  });

  // Show the match result a moment after the final hit
  const matchOver = model.phase === 'gameover' && isMatchOver(model);
  useEffect(() => {
    if (!matchOver) return;
    const timeoutId = window.setTimeout(() => {
      const { model: latest, onMatchEnd: report } = latestRef.current;
      const winner = matchWinner(latest);
      if (winner !== null) report?.(winner, latest);
      dispatch({ type: 'revealWinner' });
    }, RESULT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [matchOver]);

  const adjustAngle = useCallback((player: PlayerNumber, delta: number) =>
    dispatch({ type: 'adjustAngle', player, delta }), []);
  const toggleReady = useCallback((player: PlayerNumber) =>
    dispatch({ type: 'toggleReady', player, mapSeed: randomSeed() }), []);
  const nextRound = useCallback(() => dispatch({ type: 'nextRound', mapSeed: randomSeed() }), []);
  const startMatch = useCallback((lives: Lives) => dispatch({ type: 'newMatch', mapSeed: randomSeed(), lives }), []);

  return { model, planets, gravitationalBodies, simulationRef, adjustAngle, toggleReady, nextRound, startMatch };
};
