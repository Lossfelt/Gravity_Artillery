import { RefObject, useEffect, useRef } from 'react';
import { GameState, GravityBody, Planet, Simulation } from '../types/game';
import { Aim, PlayerNumber } from '../game/gameReducer';
import starscapeImage from '../assets/images/Starscape.webp';
import { createStaticLayer } from '../utils/createStaticLayer';
import {
  SpriteCache,
  drawAimLines,
  drawFragments,
  drawGravityBodies,
  drawParticles,
  drawPlanets
} from '../utils/drawScene';
import { TrailPaths, drawProjectiles } from '../utils/drawProjectiles';
import { drawFlash, drawShockwaves, shakeOffset } from '../utils/drawImpacts';

type Params = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  planets: { player1: Planet; player2: Planet };
  gravitationalBodies: GravityBody[];
  simulationRef: RefObject<Simulation>;
  destroyed: PlayerNumber[];
  gameState: GameState;
  aims: Record<PlayerNumber, Aim>;
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
      if (p.gameState === 'setup') drawAimLines(ctx, p.planets, p.aims);
      drawProjectiles(ctx, simulation.projectiles, trailPaths);
      drawShockwaves(ctx, simulation.impacts);
      drawParticles(ctx, simulation.explosionParticles);
      drawFragments(ctx, simulation.planetFragments, sprites);
      if (!reducedMotion.matches) drawFlash(ctx, simulation.impacts);
    };

    // Screen shake moves the whole canvas element, so no blank edges show.
    // Skipped when the player has asked the system for reduced motion.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let shaking = false;
    const applyShake = (canvas: HTMLCanvasElement) => {
      const offset = reducedMotion.matches ? null : shakeOffset(paramsRef.current.simulationRef.current.impacts);
      if (offset) {
        canvas.style.transform = `translate(${offset.dx.toFixed(1)}px, ${offset.dy.toFixed(1)}px)`;
        shaking = true;
      } else if (shaking) {
        canvas.style.transform = '';
        shaking = false;
      }
    };

    const tick = (now: number) => {
      const canvas = paramsRef.current.canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        draw(ctx, now);
        applyShake(canvas);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
};
