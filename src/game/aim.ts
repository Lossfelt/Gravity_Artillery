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

// Aim goes in tenths of a degree. Rounding after every step keeps sums like
// 0.1 + 0.2 from drifting into 0.30000000000000004.
const toTenths = (degrees: number) => Math.round(degrees * 10) / 10 + 0;

/** Changes a player's aim by delta degrees (negative = up), clamped to the allowed range. */
export const adjustAim = (player: PlayerNumber, worldAngle: number, delta: number) => {
  const relative = toTenths(Math.max(-AIM_LIMIT, Math.min(AIM_LIMIT, toRelativeAngle(player, worldAngle) + delta)));
  return toWorldAngle(player, relative);
};

/** The aim as the player sees it, always with one decimal so the readout does not jump in width. */
export const formatAim = (player: PlayerNumber, worldAngle: number) =>
  `${toTenths(toRelativeAngle(player, worldAngle)).toFixed(1)}°`;

