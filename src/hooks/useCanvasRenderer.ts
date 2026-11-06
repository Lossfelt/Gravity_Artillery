import { RefObject, useEffect, useRef } from 'react';
import { GameState, GravityBody, Planet, Simulation } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import starscapeImage from '../assets/images/Starscape.png';
import { createStaticLayer } from '../utils/createStaticLayer';
import {
  SpriteCache,
  TrailPaths,
  drawAimLines,
  drawFragments,
  drawGravityBodies,
  drawParticles,
  drawPlanets,
  drawProjectiles
} from '../utils/drawScene';

type Params = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  planets: { player1: Planet; player2: Planet };
  gravitationalBodies: GravityBody[];
  simulationRef: RefObject<Simulation>;
  destroyed: PlayerNumber[];
  gameState: GameState;
  player1Angle: number;
  player2Angle: number;
  lives: Record<PlayerNumber, number>;
};

// Star glow pulse speed in radians per second (was 0.02 per frame at 60 FPS)
const PULSE_SPEED = 1.2;

type StaticLayer = { canvas: HTMLCanvasElement; bodies: GravityBody[]; background: HTMLImageElement | null };

const loadImage = (src: string, onLoad: (img: HTMLImageElement) => void) => {
  const img = new Image();
  img.onload = () => onLoad(img);
  img.src = src;
};

/**
 * Draws the game in its own requestAnimationFrame loop. It reads the latest
 * props and the mutable simulation through refs, so animation never triggers
 * React re-renders.
 */
export const useCanvasRenderer = (params: Params) => {
  const paramsRef = useRef(params);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const spritesRef = useRef<SpriteCache>({});
  const requestedSpritesRef = useRef(new Set<string>());

  useEffect(() => {
    paramsRef.current = params;
  });

  useEffect(() => {
    loadImage(starscapeImage, img => { backgroundRef.current = img; });
  }, []);

  // Load all sprites for planets and gravitational bodies
  const { planets, gravitationalBodies } = params;
  useEffect(() => {
    const allBodies = [...Object.values(planets), ...gravitationalBodies];
    allBodies.forEach(({ sprite }) => {
      if (!sprite || requestedSpritesRef.current.has(sprite)) return;
      requestedSpritesRef.current.add(sprite);
      loadImage(sprite, img => { spritesRef.current[sprite] = img; });
    });
  }, [planets, gravitationalBodies]);

  useEffect(() => {
    let frameId: number;
    let staticLayer: StaticLayer | null = null;
    const trailPaths: TrailPaths = new WeakMap();

    const draw = (ctx: CanvasRenderingContext2D, now: number) => {
      const p = paramsRef.current;
      const background = backgroundRef.current;
      const sprites = spritesRef.current;
      const simulation = p.simulationRef.current;

      // Background and black hole lensing only change between rounds
      if (!staticLayer || staticLayer.bodies !== p.gravitationalBodies || staticLayer.background !== background) {
        staticLayer = { canvas: createStaticLayer(background, p.gravitationalBodies), bodies: p.gravitationalBodies, background };
      }
      ctx.drawImage(staticLayer.canvas, 0, 0);

      const pulse = Math.sin((now / 1000) * PULSE_SPEED) * 0.3 + 0.7; // Oscillates between 0.4 and 1.0
      drawGravityBodies(ctx, p.gravitationalBodies, sprites, pulse);
      drawPlanets(ctx, p.planets, p.destroyed, sprites, p.lives);
      if (p.gameState === 'setup') drawAimLines(ctx, p.planets, p.player1Angle, p.player2Angle);
      drawProjectiles(ctx, simulation.projectiles, trailPaths);
      drawParticles(ctx, simulation.explosionParticles);
      drawFragments(ctx, simulation.planetFragments, sprites);
    };

    const tick = (now: number) => {
      const ctx = paramsRef.current.canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx, now);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
};
