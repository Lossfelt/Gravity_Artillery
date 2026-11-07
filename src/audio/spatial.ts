import { CANVAS_WIDTH } from '../constants/game';
import { GravityBody, Projectile } from '../types/game';

// Pure helpers for where a sound sits and how loud the gravity hum is.
// Kept apart from the Web Audio code so they can be tested.

const MAX_PAN = 0.8; // Never fully into one ear

/** Stereo position from -0.8 (left edge) to 0.8 (right edge). */
export const panFor = (x: number) =>
  Math.max(-MAX_PAN, Math.min(MAX_PAN, ((x / CANVAS_WIDTH) * 2 - 1) * MAX_PAN));

// Pull (mass / distance squared) below this is silent, and the hum is full at FULL_PULL
const QUIET_PULL = 0.15;
const FULL_PULL = 2.5;

/** How strongly a projectile is being pulled, as 0 (silent) to 1 (full hum). */
export const humIntensity = (projectile: Projectile, bodies: GravityBody[]) => {
  if (!projectile.active) return 0;
  let pull = 0;
  for (const body of bodies) {
    const distSq = (body.x - projectile.x) ** 2 + (body.y - projectile.y) ** 2;
    pull += body.mass / Math.max(distSq, body.radius * body.radius);
  }
  return Math.max(0, Math.min(1, (pull - QUIET_PULL) / (FULL_PULL - QUIET_PULL)));
};
