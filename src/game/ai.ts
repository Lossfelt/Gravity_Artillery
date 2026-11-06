import { GravityBody, Planet } from '../types/game';
import { createProjectile, stepProjectile } from '../utils/stepSimulation';
import { Random } from '../utils/random';
import { AIM_LIMIT, MAX_POWER, MIN_POWER, toRelativeAngle, toWorldAngle } from './aim';
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
  const proj = createProjectile(planetOf(planets, player), aim.angle, aim.power, player);
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

type Candidate = { relative: number; power: number; score: number };

const evaluate = (planets: Planets, bodies: GravityBody[], player: PlayerNumber, relative: number, power: number): Candidate => {
  const result = simulateShot(planets, bodies, player, { angle: toWorldAngle(player, relative), power });
  return { relative, power, score: scoreShot(result, player) };
};

const range = (from: number, to: number, step: number) => {
  const values: number[] = [];
  for (let v = from; v <= to; v += step) values.push(v);
  return values;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Searches for the best aim: a coarse grid over all angles and powers, then a
 * fine search around the most promising candidates. Uses whole degrees and
 * percent, like the human controls.
 */
export const findBestAim = (planets: Planets, bodies: GravityBody[], player: PlayerNumber): Aim & { score: number } => {
  const coarse: Candidate[] = [];
  for (const relative of range(-AIM_LIMIT, AIM_LIMIT, 3)) {
    for (const power of range(MIN_POWER, MAX_POWER, 10)) {
      coarse.push(evaluate(planets, bodies, player, relative, power));
    }
  }
  coarse.sort((a, b) => a.score - b.score);

  let best = coarse[0];
  for (const candidate of coarse.slice(0, 6)) {
    if (best.score === 0) break;
    for (const relative of range(candidate.relative - 3, candidate.relative + 3, 1)) {
      for (const power of range(candidate.power - 10, candidate.power + 10, 2)) {
        const r = clamp(relative, -AIM_LIMIT, AIM_LIMIT);
        const p = clamp(power, MIN_POWER, MAX_POWER);
        const result = evaluate(planets, bodies, player, r, p);
        if (result.score < best.score) best = result;
      }
    }
  }
  return { angle: toWorldAngle(player, best.relative), power: best.power, score: best.score };
};

const AIM_ERROR: Record<Difficulty, { angle: number; power: number; shrink: number }> = {
  easy: { angle: 10, power: 15, shrink: 0.75 },
  normal: { angle: 5, power: 8, shrink: 0.6 },
  hard: { angle: 2, power: 3, shrink: 0.4 }
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
  return {
    angle: toWorldAngle(player, relative),
    power: clamp(best.power + jitter(error.power), MIN_POWER, MAX_POWER)
  };
};
