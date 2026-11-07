import { CSSProperties } from 'react';
import { initialPlanets } from '../constants/game';
import { MAX_POWER, MIN_POWER } from '../game/aim';
import { PlayerNumber } from '../game/gameReducer';

/** Inline style that gives a panel its player's planet colour as --accent. */
export const accentStyle = (player: PlayerNumber): CSSProperties =>
  ({ '--accent': player === 1 ? initialPlanets.player1.color : initialPlanets.player2.color }) as CSSProperties;

/** Share of the power range filled, 0..100, for the power meter. */
export const powerFill = (power: number) =>
  Math.max(0, Math.min(100, ((power - MIN_POWER) / (MAX_POWER - MIN_POWER)) * 100));
