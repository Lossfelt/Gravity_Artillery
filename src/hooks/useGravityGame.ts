import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Planet, GravityBody, Projectile, GameStats, Simulation } from '../types/game';
import {
  PLANET_RADIUS,
  PROJECTILE_SPEED,
  initialPlanets
} from '../constants/game';
import { generateGravitationalBodies } from '../utils/generateGravitationalBodies';
import { createExplosion } from '../utils/createExplosion';
import { createPlanetFragments } from '../utils/createPlanetFragments';
import { stepFragments, stepParticles, stepProjectile } from '../utils/stepSimulation';

type UseGravityGameProps = {
  onExplosion?: () => void;
};

type PlayerNumber = 1 | 2;

const createProjectile = (planet: Planet, angleDeg: number, player: PlayerNumber): Projectile => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: planet.x + Math.cos(angleRad) * PLANET_RADIUS,
    y: planet.y + Math.sin(angleRad) * PLANET_RADIUS,
    vx: Math.cos(angleRad) * PROJECTILE_SPEED,
    vy: Math.sin(angleRad) * PROJECTILE_SPEED,
    trail: [],
    player,
    active: true
  };
};

const emptySimulation = (): Simulation => ({ projectiles: [], explosionParticles: [], planetFragments: [] });

export const useGravityGame = ({ onExplosion }: UseGravityGameProps = {}) => {
  const [player1Angle, setPlayer1Angle] = useState(0);
  const [player2Angle, setPlayer2Angle] = useState(180);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    player1: { lives: 3 },
    player2: { lives: 3 }
  });

  const [planets] = useState<{ player1: Planet; player2: Planet }>(initialPlanets);
  const [gravitationalBodies, setGravitationalBodies] = useState<GravityBody[]>(() =>
    generateGravitationalBodies(initialPlanets)
  );
  const [destroyedPlanets, setDestroyedPlanets] = useState<Set<PlayerNumber>>(new Set());

  const simulationRef = useRef<Simulation>(emptySimulation());
  // The round is resolved exactly once: the flag is set before lives are touched,
  // so extra animation frames can never subtract another life.
  const roundRef = useRef({ resolved: true });
  const destroyedRef = useRef<Set<PlayerNumber>>(new Set());
  const latestRef = useRef({ gravitationalBodies, planets, onExplosion });

  useEffect(() => {
    latestRef.current = { gravitationalBodies, planets, onExplosion };
  });

  const startGame = useCallback(() => {
    simulationRef.current.projectiles = [
      createProjectile(planets.player1, player1Angle, 1),
      createProjectile(planets.player2, player2Angle, 2)
    ];
    roundRef.current = { resolved: false };

    setGameState('firing');
    setWinner(null);
  }, [planets, player1Angle, player2Angle]);

  // Each destroyed planet costs its owner one life, no matter whose shot hit it
  const resolveRound = useCallback((planet1Destroyed: boolean, planet2Destroyed: boolean) => {
    setPlayer1Ready(false);
    setPlayer2Ready(false);

    if (!planet1Destroyed && !planet2Destroyed) {
      // Both missed: retry with same setup, trails stay visible until next fire
      setGameState('setup');
      return;
    }

    setGameStats(prev => ({
      player1: { lives: Math.max(0, prev.player1.lives - (planet1Destroyed ? 1 : 0)) },
      player2: { lives: Math.max(0, prev.player2.lives - (planet2Destroyed ? 1 : 0)) }
    }));
    setGameState('gameover');
  }, []);

  const destroyPlanet = useCallback((player: PlayerNumber, planet: Planet) => {
    const simulation = simulationRef.current;
    latestRef.current.onExplosion?.();
    simulation.explosionParticles.push(...createExplosion(planet.x, planet.y));
    simulation.planetFragments.push(...createPlanetFragments(planet));
    destroyedRef.current.add(player);
    setDestroyedPlanets(new Set(destroyedRef.current));
  }, []);

  const stepRound = useCallback((deltaTime: number) => {
    const { projectiles } = simulationRef.current;
    const { gravitationalBodies: bodies, planets: currentPlanets } = latestRef.current;

    for (const proj of projectiles) {
      if (!proj.active) continue;
      const hitPlayer = stepProjectile(proj, bodies, currentPlanets, destroyedRef.current, deltaTime);
      if (hitPlayer === null) continue;
      destroyPlanet(hitPlayer, hitPlayer === 1 ? currentPlanets.player1 : currentPlanets.player2);
    }

    // The round ends when both projectiles have hit or left the screen
    if (projectiles.every(p => !p.active)) {
      roundRef.current.resolved = true;
      resolveRound(destroyedRef.current.has(1), destroyedRef.current.has(2));
    }
  }, [destroyPlanet, resolveRound]);

  // Single simulation loop. Mutates simulationRef, the renderer draws from it.
  useEffect(() => {
    let frameId: number;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      // Target 60 FPS as baseline (16.67ms per frame), cap at 2x to prevent huge jumps
      const deltaTime = lastTime === null ? 1 : Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const simulation = simulationRef.current;
      stepParticles(simulation.explosionParticles, deltaTime);
      stepFragments(simulation.planetFragments, deltaTime);
      if (!roundRef.current.resolved) stepRound(deltaTime);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [stepRound]);

  // Show the match result 2 seconds after the final hit
  useEffect(() => {
    if (gameState !== 'gameover') return;
    const p1Lives = gameStats.player1.lives;
    const p2Lives = gameStats.player2.lives;
    if (p1Lives > 0 && p2Lives > 0) return;

    const timeoutId = window.setTimeout(() => {
      if (p1Lives <= 0 && p2Lives <= 0) setWinner('draw');
      else setWinner(p1Lives <= 0 ? 2 : 1);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [gameState, gameStats]);

  const resetGame = useCallback(() => {
    // Always reset angles and regenerate bodies when coming from gameover
    // (This function is only called from gameover state, which means someone hit)
    setPlayer1Angle(0);
    setPlayer2Angle(180);
    setGravitationalBodies(generateGravitationalBodies(planets));

    // Reset lives if someone won the match (not just a round)
    setGameStats(prev => {
      const shouldResetLives = prev.player1.lives <= 0 || prev.player2.lives <= 0;
      return shouldResetLives ? { player1: { lives: 3 }, player2: { lives: 3 } } : prev;
    });

    setGameState('setup');
    setWinner(null);
    setPlayer1Ready(false);
    setPlayer2Ready(false);

    simulationRef.current = emptySimulation();
    roundRef.current.resolved = true;
    destroyedRef.current = new Set();
    setDestroyedPlanets(new Set());
  }, [planets]);

  // Handle ready state transitions
  useEffect(() => {
    if (player1Ready && player2Ready) {
      if (gameState === 'setup') {
        startGame();
      } else if (gameState === 'gameover') {
        resetGame();
      }
    }
  }, [player1Ready, player2Ready, gameState, startGame, resetGame]);

  return {
    player1Angle,
    setPlayer1Angle,
    player2Angle,
    setPlayer2Angle,
    player1Ready,
    setPlayer1Ready,
    player2Ready,
    setPlayer2Ready,
    planets,
    gravitationalBodies,
    simulationRef,
    destroyedPlanets,
    gameState,
    winner,
    gameStats,
    resetGame
  };
};
