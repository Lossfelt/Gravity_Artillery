import { CSSProperties } from 'react';
import { initialPlanets } from '../constants/game';
import { PlayerNumber } from '../game/gameReducer';

/** Inline style that gives a panel its player's planet colour as --accent. */
export const accentStyle = (player: PlayerNumber): CSSProperties =>
  ({ '--accent': player === 1 ? initialPlanets.player1.color : initialPlanets.player2.color }) as CSSProperties;

