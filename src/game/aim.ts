import type { PlayerNumber } from './gameReducer';

// Players aim relative to facing the opponent: 0 is straight at the other side,
// negative is up and positive is down for both players. The model stores the
// world angle (degrees, canvas coordinates with y pointing down).
export const AIM_LIMIT = 90;

const BASE_ANGLE: Record<PlayerNumber, number> = { 1: 0, 2: 180 };
const MIRROR: Record<PlayerNumber, number> = { 1: 1, 2: -1 };

export const toRelativeAngle = (player: PlayerNumber, worldAngle: number) =>
  (worldAngle - BASE_ANGLE[player]) * MIRROR[player] + 0; // + 0 turns -0 into 0

export const toWorldAngle = (player: PlayerNumber, relativeAngle: number) =>
  BASE_ANGLE[player] + relativeAngle * MIRROR[player];

/** Changes a player's aim by delta degrees (negative = up), clamped to the allowed range. */
export const adjustAim = (player: PlayerNumber, worldAngle: number, delta: number) => {
  const relative = Math.max(-AIM_LIMIT, Math.min(AIM_LIMIT, toRelativeAngle(player, worldAngle) + delta));
  return toWorldAngle(player, relative);
};

// Launch power in percent of the base projectile speed
export const MIN_POWER = 50;
export const MAX_POWER = 150;
export const DEFAULT_POWER = 100;

export const adjustPower = (power: number, delta: number) =>
  Math.max(MIN_POWER, Math.min(MAX_POWER, power + delta));
