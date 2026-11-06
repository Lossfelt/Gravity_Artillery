import { GameState } from '../types/game';
import { randomSeed } from '../utils/random';
import { adjustAim } from './aim';

export type PlayerNumber = 1 | 2;
export type Winner = PlayerNumber | 'draw' | null;

export type PlayerState = {
  angle: number;
  ready: boolean;
  lives: number;
};

export type GameModel = {
  phase: GameState;
  players: Record<PlayerNumber, PlayerState>;
  // Planets destroyed in the current round
  destroyed: PlayerNumber[];
  winner: Winner;
  mapSeed: number;
  // Increments on every shot / every new round. The simulation reacts to
  // these to spawn projectiles and to clear the board.
  shotNumber: number;
  roundNumber: number;
};

export type GameAction =
  | { type: 'setAngle'; player: PlayerNumber; angle: number }
  // Relative change in degrees (negative = up), applied to the current angle
  | { type: 'adjustAngle'; player: PlayerNumber; delta: number }
  // mapSeed is used if this toggle starts the next round (keeps the reducer pure)
  | { type: 'toggleReady'; player: PlayerNumber; mapSeed: number }
  | { type: 'planetDestroyed'; player: PlayerNumber }
  | { type: 'roundEnded' }
  | { type: 'revealWinner' }
  | { type: 'nextRound'; mapSeed: number };

export const START_LIVES = 3;
export const DEFAULT_ANGLES: Record<PlayerNumber, number> = { 1: 0, 2: 180 };

const initialPlayer = (player: PlayerNumber): PlayerState =>
  ({ angle: DEFAULT_ANGLES[player], ready: false, lives: START_LIVES });

export const createInitialModel = (mapSeed = randomSeed()): GameModel => ({
  phase: 'setup',
  players: { 1: initialPlayer(1), 2: initialPlayer(2) },
  destroyed: [],
  winner: null,
  mapSeed,
  shotNumber: 0,
  roundNumber: 0
});

const mapPlayers = (model: GameModel, fn: (p: PlayerState, n: PlayerNumber) => PlayerState) =>
  ({ 1: fn(model.players[1], 1), 2: fn(model.players[2], 2) });

export const isMatchOver = (model: GameModel) =>
  model.players[1].lives <= 0 || model.players[2].lives <= 0;

export const matchWinner = (model: GameModel): Winner => {
  const p1Out = model.players[1].lives <= 0;
  const p2Out = model.players[2].lives <= 0;
  if (p1Out && p2Out) return 'draw';
  if (p1Out) return 2;
  if (p2Out) return 1;
  return null;
};

// Aim can only change during setup, before the player has pressed Fire
const updatePlayer = (model: GameModel, player: PlayerNumber, changes: Partial<PlayerState>): GameModel => {
  if (model.phase !== 'setup' || model.players[player].ready) return model;
  return { ...model, players: { ...model.players, [player]: { ...model.players[player], ...changes } } };
};

const startShot = (model: GameModel): GameModel =>
  ({ ...model, phase: 'firing', destroyed: [], shotNumber: model.shotNumber + 1 });

// From gameover: new star map and default angles. Lives reset only when the match is over.
const nextRound = (model: GameModel, mapSeed: number): GameModel => {
  const resetLives = isMatchOver(model);
  return {
    ...model,
    phase: 'setup',
    players: mapPlayers(model, (p, n) => ({
      angle: DEFAULT_ANGLES[n],
      ready: false,
      lives: resetLives ? START_LIVES : p.lives
    })),
    destroyed: [],
    winner: null,
    mapSeed,
    roundNumber: model.roundNumber + 1
  };
};

const toggleReady = (model: GameModel, player: PlayerNumber, mapSeed: number): GameModel => {
  if (model.phase === 'firing') return model;
  const players = { ...model.players, [player]: { ...model.players[player], ready: !model.players[player].ready } };
  const toggled = { ...model, players };
  if (!players[1].ready || !players[2].ready) return toggled;
  return model.phase === 'setup' ? startShot(toggled) : nextRound(toggled, mapSeed);
};

// Each destroyed planet costs its owner one life, no matter whose shot hit it.
// A miss by both returns to setup with the same map so players can adjust.
const endRound = (model: GameModel): GameModel => {
  if (model.phase !== 'firing') return model;
  const players = mapPlayers(model, (p, n) => ({
    ...p,
    ready: false,
    lives: Math.max(0, p.lives - (model.destroyed.includes(n) ? 1 : 0))
  }));
  return { ...model, players, phase: model.destroyed.length > 0 ? 'gameover' : 'setup' };
};

/**
 * Pure game state machine: setup -> firing -> (setup on miss | gameover on hit)
 * -> setup (next round).
 */
export const gameReducer = (model: GameModel, action: GameAction): GameModel => {
  switch (action.type) {
    case 'setAngle':
      return updatePlayer(model, action.player, { angle: action.angle });
    case 'adjustAngle': {
      const current = model.players[action.player].angle;
      return updatePlayer(model, action.player, { angle: adjustAim(action.player, current, action.delta) });
    }
    case 'toggleReady':
      return toggleReady(model, action.player, action.mapSeed);
    case 'planetDestroyed':
      if (model.destroyed.includes(action.player)) return model;
      return { ...model, destroyed: [...model.destroyed, action.player] };
    case 'roundEnded':
      return endRound(model);
    case 'revealWinner':
      return model.phase === 'gameover' ? { ...model, winner: matchWinner(model) } : model;
    case 'nextRound':
      return model.phase === 'gameover' ? nextRound(model, action.mapSeed) : model;
  }
};
