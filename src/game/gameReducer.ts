import { GameState } from '../types/game';
import { randomSeed } from '../utils/random';
import { adjustAim } from './aim';

export type PlayerNumber = 1 | 2;
export type Winner = PlayerNumber | 'draw' | null;

export type Aim = { angle: number };

type PlayerState = {
  angle: number;
  ready: boolean;
  lives: number;
  // Lives at the start of the match, shown as heart slots
  maxLives: number;
  // Shots this match that destroyed the opponent's planet
  hits: number;
};

export type Lives = Record<PlayerNumber, number>;

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
  // Shots fired this match (each player fires once per shot)
  matchShots: number;
};

export type GameAction =
  | { type: 'setAim'; player: PlayerNumber; angle: number }
  // Relative change in degrees (negative = up), applied to the current angle
  | { type: 'adjustAngle'; player: PlayerNumber; delta: number }
  // mapSeed is used if this toggle starts the next round (keeps the reducer pure)
  | { type: 'toggleReady'; player: PlayerNumber; mapSeed: number }
  | { type: 'planetDestroyed'; player: PlayerNumber; shooter: PlayerNumber }
  | { type: 'roundEnded' }
  | { type: 'revealWinner' }
  | { type: 'nextRound'; mapSeed: number }
  // Throws away the current match and starts a new one with the given lives
  | { type: 'newMatch'; mapSeed: number; lives: Lives };

export const START_LIVES = 3;
const DEFAULT_LIVES: Lives = { 1: START_LIVES, 2: START_LIVES };
const DEFAULT_ANGLES: Record<PlayerNumber, number> = { 1: 0, 2: 180 };

const initialPlayer = (player: PlayerNumber, lives: number): PlayerState =>
  ({ angle: DEFAULT_ANGLES[player], ready: false, lives, maxLives: lives, hits: 0 });

export const createInitialModel = (mapSeed = randomSeed(), lives = DEFAULT_LIVES): GameModel => ({
  phase: 'setup',
  players: { 1: initialPlayer(1, lives[1]), 2: initialPlayer(2, lives[2]) },
  destroyed: [],
  winner: null,
  mapSeed,
  shotNumber: 0,
  roundNumber: 0,
  matchShots: 0
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

/** The match is decided, but the result is not shown yet. Nothing may move on until it is. */
export const isAwaitingResult = (model: GameModel) =>
  model.phase === 'gameover' && isMatchOver(model) && model.winner === null;

// Aim can only change during setup, before the player has pressed Fire
const updatePlayer = (model: GameModel, player: PlayerNumber, changes: Partial<PlayerState>): GameModel => {
  if (model.phase !== 'setup' || model.players[player].ready) return model;
  return { ...model, players: { ...model.players, [player]: { ...model.players[player], ...changes } } };
};

const startShot = (model: GameModel): GameModel =>
  ({ ...model, phase: 'firing', destroyed: [], shotNumber: model.shotNumber + 1, matchShots: model.matchShots + 1 });

// From gameover: new star map and default aim. When the match is over, a new
// match starts with the same lives as the last one.
const nextRound = (model: GameModel, mapSeed: number): GameModel => {
  if (isMatchOver(model)) return newMatch(model, mapSeed, { 1: model.players[1].maxLives, 2: model.players[2].maxLives });
  return {
    ...model,
    phase: 'setup',
    players: mapPlayers(model, (p, n) => ({ ...p, angle: DEFAULT_ANGLES[n], ready: false })),
    destroyed: [],
    winner: null,
    mapSeed,
    roundNumber: model.roundNumber + 1
  };
};

// Keeps shotNumber and bumps roundNumber, so the simulation clears the board
// without firing
const newMatch = (model: GameModel, mapSeed: number, lives: Lives): GameModel => ({
  ...createInitialModel(mapSeed, lives),
  shotNumber: model.shotNumber,
  roundNumber: model.roundNumber + 1
});

const destroyPlanet = (model: GameModel, player: PlayerNumber, shooter: PlayerNumber): GameModel => {
  if (model.phase !== 'firing' || model.destroyed.includes(player)) return model;
  const destroyed = [...model.destroyed, player];
  if (shooter === player) return { ...model, destroyed };
  const players = { ...model.players, [shooter]: { ...model.players[shooter], hits: model.players[shooter].hits + 1 } };
  return { ...model, destroyed, players };
};

const toggleReady = (model: GameModel, player: PlayerNumber, mapSeed: number): GameModel => {
  if (model.phase === 'firing' || isAwaitingResult(model)) return model;
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
    case 'setAim':
      return updatePlayer(model, action.player, { angle: action.angle });
    case 'adjustAngle': {
      const current = model.players[action.player].angle;
      return updatePlayer(model, action.player, { angle: adjustAim(action.player, current, action.delta) });
    }
    case 'toggleReady':
      return toggleReady(model, action.player, action.mapSeed);
    case 'planetDestroyed':
      return destroyPlanet(model, action.player, action.shooter);
    case 'roundEnded':
      return endRound(model);
    case 'revealWinner':
      return model.phase === 'gameover' ? { ...model, winner: matchWinner(model) } : model;
    case 'nextRound':
      return model.phase === 'gameover' && !isAwaitingResult(model) ? nextRound(model, action.mapSeed) : model;
    case 'newMatch':
      return newMatch(model, action.mapSeed, action.lives);
  }
};
