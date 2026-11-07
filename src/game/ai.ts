import { GravityBody, Planet } from '../types/game';
import { createProjectile, stepProjectile } from '../utils/stepSimulation';
import { Random } from '../utils/random';
import { AIM_LIMIT, toRelativeAngle, toWorldAngle } from './aim';
import type { Aim, PlayerNumber } from './gameReducer';

// The physics is deterministic (fixed timestep), so the AI can simulate shots
// exactly as the game will fly them. Difficulty comes from deliberate aiming
// error that shrinks with each attempt on the same map, much like a human
// adjusting after seeing their trail.

type Planets = { player1: Planet; player2: Planet };
export type Difficulty = 'easy' | 'normal' | 'hard';

const MAX_FLIGHT_STEPS = 1200; // 20 s of flight
const SELF_HIT_PENALTY = 10_000;
const NOTHING_DESTROYED = new Set<PlayerNumber>();

const planetOf = (planets: Planets, player: PlayerNumber) => (player === 1 ? planets.player1 : planets.player2);
const opponentOf = (player: PlayerNumber): PlayerNumber => (player === 1 ? 2 : 1);

export type ShotResult = { hit: PlayerNumber | null; closest: number };

/** Flies a shot to the end and reports what it hit and how close it came to the opponent. */
export const simulateShot = (planets: Planets, bodies: GravityBody[], player: PlayerNumber, aim: Aim): ShotResult => {
  const target = planetOf(planets, opponentOf(player));
  const proj = createProjectile(planetOf(planets, player), aim.angle, player);
  let closest = Infinity;

  for (let step = 0; step < MAX_FLIGHT_STEPS; step++) {
    const hit = stepProjectile(proj, bodies, planets, NOTHING_DESTROYED, 1);
    proj.trail.length = 0; // The trail is not needed here and would only cost memory
    if (hit !== null) return { hit, closest: hit === opponentOf(player) ? 0 : closest };
    if (!proj.active) break;
    closest = Math.min(closest, Math.hypot(proj.x - target.x, proj.y - target.y));
  }
  return { hit: null, closest };
};

/** Lower is better. A hit on the opponent scores 0, hitting yourself is heavily penalised. */
const scoreShot = (result: ShotResult, player: PlayerNumber) => {
  if (result.hit === player) return SELF_HIT_PENALTY;
  return result.closest;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** The middle of the longest run of hits, so small aiming errors still hit. */
const middleOfWidestHit = (scores: number[]) => {
  let best = { start: -1, length: 0 };
  let start = -1;
  scores.forEach((score, i) => {
    if (score !== 0) { start = -1; return; }
    if (start < 0) start = i;
    if (i - start + 1 > best.length) best = { start, length: i - start + 1 };
  });
  return best.length > 0 ? best.start + Math.floor((best.length - 1) / 2) : -1;
};

/**
 * Tries every whole degree, like the human controls. Picks the middle of the
 * widest hit window, or the closest miss when nothing hits.
 */
export const findBestAim = (planets: Planets, bodies: GravityBody[], player: PlayerNumber): Aim & { score: number } => {
  const scores: number[] = [];
  for (let relative = -AIM_LIMIT; relative <= AIM_LIMIT; relative++) {
    scores.push(scoreShot(simulateShot(planets, bodies, player, { angle: toWorldAngle(player, relative) }), player));
  }
  const hit = middleOfWidestHit(scores);
  const index = hit >= 0 ? hit : scores.indexOf(Math.min(...scores));
  return { angle: toWorldAngle(player, index - AIM_LIMIT), score: scores[index] };
};

const AIM_ERROR: Record<Difficulty, { angle: number; shrink: number }> = {
  easy: { angle: 15, shrink: 0.85 },
  normal: { angle: 8, shrink: 0.65 },
  hard: { angle: 4, shrink: 0.4 }
};

/**
 * Adds aiming error to the best aim. attempt is the number of earlier shots on
 * this map; the error shrinks with every attempt.
 */
export const aimWithError = (best: Aim, player: PlayerNumber, difficulty: Difficulty, attempt: number, random: Random): Aim => {
  const error = AIM_ERROR[difficulty];
  const factor = Math.pow(error.shrink, attempt);
  const jitter = (size: number) => Math.round((random() * 2 - 1) * size * factor);
  const relative = clamp(toRelativeAngle(player, best.angle) + jitter(error.angle), -AIM_LIMIT, AIM_LIMIT);
  return { angle: toWorldAngle(player, relative) };
};
