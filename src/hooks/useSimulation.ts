import { Dispatch, useCallback, useEffect, useRef } from 'react';
import { GravityBody, Planet, Simulation } from '../types/game';
import { Aim, GameAction, PlayerNumber } from '../game/gameReducer';
import { createExplosion } from '../utils/createExplosion';
import { createPlanetFragments } from '../utils/createPlanetFragments';
import { createProjectile, stepFragments, stepImpacts, stepParticles, stepProjectile } from '../utils/stepSimulation';
import { consumeSteps } from '../utils/fixedTimestep';

type Planets = { player1: Planet; player2: Planet };

type Params = {
  shotNumber: number;
  roundNumber: number;
  aims: Record<PlayerNumber, Aim>;
  planets: Planets;
  gravitationalBodies: GravityBody[];
  lives: Record<PlayerNumber, number>;
  dispatch: Dispatch<GameAction>;
  sounds?: SimulationSounds;
};

// Called when something audible happens, with its x position for stereo panning
export type SimulationSounds = {
  onLaunch?: (x: number) => void;
  onExplosion?: (x: number, decisive: boolean) => void;
};

// The hit that ends the match plays in slow motion for a moment
const SLOW_MOTION_MS = 1500;
const SLOW_MOTION_SCALE = 0.3;
const DECISIVE_STRENGTH = 1.6;

const planetOf = (planets: Planets, player: PlayerNumber) => (player === 1 ? planets.player1 : planets.player2);

const emptySimulation = (): Simulation =>
  ({ projectiles: [], explosionParticles: [], planetFragments: [], impacts: [] });

// "#4287f5" -> "66, 135, 245"
const hexToRgb = (hex: string) =>
  [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ');

/**
 * Runs projectiles, explosions and fragments in a fixed-timestep loop outside
 * React state, and reports hits and round ends to the game reducer.
 */
export const useSimulation = (params: Params) => {
  const { shotNumber, roundNumber, dispatch } = params;
  const simulationRef = useRef<Simulation>(emptySimulation());
  // Set before the round is reported, so extra frames can never end a round twice
  const resolvedRef = useRef(true);
  const destroyedRef = useRef(new Set<PlayerNumber>());
  const latestRef = useRef(params);
  const slowMotionUntilRef = useRef(0);

  useEffect(() => {
    latestRef.current = params;
  });

  // A new shot: both players fire at once
  useEffect(() => {
    if (shotNumber === 0) return;
    const { planets, aims, sounds } = latestRef.current;
    sounds?.onLaunch?.(planets.player1.x);
    sounds?.onLaunch?.(planets.player2.x);
    simulationRef.current.projectiles = [
      createProjectile(planets.player1, aims[1].angle, 1),
      createProjectile(planets.player2, aims[2].angle, 2)
    ];
    destroyedRef.current = new Set();
    resolvedRef.current = false;
  }, [shotNumber]);

  // A new round: clear trails, explosions and fragments
  useEffect(() => {
    simulationRef.current = emptySimulation();
    resolvedRef.current = true;
  }, [roundNumber]);

  const destroyPlanet = useCallback((player: PlayerNumber, planet: Planet) => {
    const simulation = simulationRef.current;
    const decisive = latestRef.current.lives[player] <= 1;
    latestRef.current.sounds?.onExplosion?.(planet.x, decisive);
    simulation.explosionParticles.push(...createExplosion(planet.x, planet.y));
    simulation.planetFragments.push(...createPlanetFragments(planet));

    simulation.impacts.push({
      x: planet.x,
      y: planet.y,
      age: 0,
      color: hexToRgb(planet.color),
      strength: decisive ? DECISIVE_STRENGTH : 1
    });
    if (decisive) slowMotionUntilRef.current = performance.now() + SLOW_MOTION_MS;

    destroyedRef.current.add(player);
    dispatch({ type: 'planetDestroyed', player });
  }, [dispatch]);

  const stepRound = useCallback(() => {
    const { projectiles } = simulationRef.current;
    const { gravitationalBodies, planets } = latestRef.current;

    for (const proj of projectiles) {
      if (!proj.active) continue;
      const hitPlayer = stepProjectile(proj, gravitationalBodies, planets, destroyedRef.current, 1);
      if (hitPlayer !== null) destroyPlanet(hitPlayer, planetOf(planets, hitPlayer));
    }

    // The round ends when both projectiles have hit or left the screen
    if (projectiles.every(p => !p.active)) {
      resolvedRef.current = true;
      dispatch({ type: 'roundEnded' });
    }
  }, [destroyPlanet, dispatch]);

  useEffect(() => {
    let frameId: number;
    let lastTime: number | null = null;
    let accumulatorMs = 0;

    const tick = (now: number) => {
      // Slow motion runs fewer physics steps per real second; the physics itself is unchanged
      const timeScale = now < slowMotionUntilRef.current ? SLOW_MOTION_SCALE : 1;
      const elapsed = lastTime === null ? 0 : now - lastTime;
      const consumed = consumeSteps(accumulatorMs, elapsed * timeScale);
      accumulatorMs = consumed.accumulatorMs;
      lastTime = now;

      for (let i = 0; i < consumed.steps; i++) {
        const simulation = simulationRef.current;
        stepParticles(simulation.explosionParticles, 1);
        stepFragments(simulation.planetFragments, 1);
        stepImpacts(simulation.impacts, 1);
        if (!resolvedRef.current) stepRound();
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [stepRound]);

  return simulationRef;
};
