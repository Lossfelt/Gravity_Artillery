import { Ammo, GameState, Reward, ShotKind, SpecialShot } from '../types/game';
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
  ammo: Ammo;
  // Fired with the next Fire; goes back to standard after every shot
  shot: ShotKind;
};

export type Lives = Record<PlayerNumber, number>;

// A campaign reward at stake for player 1 on the current map: paid when the
// round ends if player 1 destroyed the enemy planet on it, lost if the map
// changes otherwise (the enemy hit), kept while both miss
export type MapReward = { reward: Reward; lifeCap: number; ammoCap: number; earned: boolean };

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
  // What each player fired in the latest shot
  firedShots: Record<PlayerNumber, ShotKind>;
  mapReward: MapReward | null;
  // Paid when the last round ended, so it can be shown until the next round
  paidReward: Reward | null;
};

export type GameAction =
  | { type: 'setAim'; player: PlayerNumber; angle: number }
  // Relative change in degrees (negative = up), applied to the current angle
  | { type: 'adjustAngle'; player: PlayerNumber; delta: number }
  | { type: 'selectShot'; player: PlayerNumber; shot: ShotKind }
  // mapSeed is used if this toggle starts the next round (keeps the reducer pure)
  | { type: 'toggleReady'; player: PlayerNumber; mapSeed: number }
  | { type: 'planetDestroyed'; player: PlayerNumber; shooter: PlayerNumber }
  | { type: 'roundEnded' }
  | { type: 'revealWinner' }
  | { type: 'nextRound'; mapSeed: number }
  // Throws away the current match and starts a new one with the given lives
  | { type: 'newMatch'; mapSeed: number; lives: Lives; ammo?: Partial<Record<PlayerNumber, Ammo>>; mapReward?: Omit<MapReward, 'earned'> };

export const START_LIVES = 3;
const DEFAULT_LIVES: Lives = { 1: START_LIVES, 2: START_LIVES };
const DEFAULT_ANGLES: Record<PlayerNumber, number> = { 1: 0, 2: 180 };

export const NO_AMMO: Ammo = { homing: 0, splitter: 0, phase: 0 };
const STANDARD_SHOTS: Record<PlayerNumber, ShotKind> = { 1: 'standard', 2: 'standard' };

const initialPlayer = (player: PlayerNumber, lives: number, ammo = NO_AMMO): PlayerState =>
  ({ angle: DEFAULT_ANGLES[player], ready: false, lives, maxLives: lives, hits: 0, ammo, shot: 'standard' });

export const createInitialModel = (
  mapSeed = randomSeed(),
  lives = DEFAULT_LIVES,
  ammo: Partial<Record<PlayerNumber, Ammo>> = {}
): GameModel => ({
  phase: 'setup',
  players: { 1: initialPlayer(1, lives[1], ammo[1]), 2: initialPlayer(2, lives[2], ammo[2]) },
  destroyed: [],
  winner: null,
  mapSeed,
  shotNumber: 0,
  roundNumber: 0,
  matchShots: 0,
  firedShots: STANDARD_SHOTS,
  mapReward: null,
  paidReward: null
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

// A special shot uses up one of its kind when fired
const fire = (p: PlayerState): PlayerState =>
  p.shot === 'standard' ? p : { ...p, ammo: { ...p.ammo, [p.shot]: p.ammo[p.shot] - 1 }, shot: 'standard' };

const startShot = (model: GameModel): GameModel => ({
  ...model,
  phase: 'firing',
  destroyed: [],
  shotNumber: model.shotNumber + 1,
  matchShots: model.matchShots + 1,
  firedShots: { 1: model.players[1].shot, 2: model.players[2].shot },
  players: mapPlayers(model, fire)
});

const canUse = (p: PlayerState, shot: ShotKind) => shot === 'standard' || p.ammo[shot as SpecialShot] > 0;

// From gameover: new star map and default aim. When the match is over, a new
// match starts with the same lives as the last one.
const nextRound = (model: GameModel, mapSeed: number): GameModel => {
  // Ammunition is not restored: it is only handed out by the campaign
  if (isMatchOver(model)) {
    const { 1: p1, 2: p2 } = model.players;
    return newMatch(model, mapSeed, { 1: p1.maxLives, 2: p2.maxLives }, { 1: p1.ammo, 2: p2.ammo });
  }
  return {
    ...model,
    phase: 'setup',
    players: mapPlayers(model, (p, n) => ({ ...p, angle: DEFAULT_ANGLES[n], ready: false })),
    destroyed: [],
    winner: null,
    mapSeed,
    roundNumber: model.roundNumber + 1,
    paidReward: null
  };
};

// Keeps shotNumber and bumps roundNumber, so the simulation clears the board
// without firing
const newMatch = (model: GameModel, mapSeed: number, lives: Lives, ammo: Partial<Record<PlayerNumber, Ammo>> = {}): GameModel => ({
  ...createInitialModel(mapSeed, lives, ammo),
  shotNumber: model.shotNumber,
  roundNumber: model.roundNumber + 1
});

const destroyPlanet = (model: GameModel, player: PlayerNumber, shooter: PlayerNumber): GameModel => {
  if (model.phase !== 'firing' || model.destroyed.includes(player)) return model;
  const destroyed = [...model.destroyed, player];
  if (shooter === player) return { ...model, destroyed };
  const players = { ...model.players, [shooter]: { ...model.players[shooter], hits: model.players[shooter].hits + 1 } };
  // A reward at stake belongs to player 1
  const mapReward = model.mapReward && shooter === 1 ? { ...model.mapReward, earned: true } : model.mapReward;
  return { ...model, destroyed, players, mapReward };
};

const payReward = (p: PlayerState, { reward, lifeCap, ammoCap }: MapReward): PlayerState =>
  reward.kind === 'life'
    ? { ...p, lives: Math.min(lifeCap, p.lives + 1) }
    : { ...p, ammo: { ...p.ammo, [reward.shot]: Math.min(ammoCap, p.ammo[reward.shot] + 1) } };

const toggleReady = (model: GameModel, player: PlayerNumber, mapSeed: number): GameModel => {
  if (model.phase === 'firing' || isAwaitingResult(model)) return model;
  const players = { ...model.players, [player]: { ...model.players[player], ready: !model.players[player].ready } };
  const toggled = { ...model, players };
  if (!players[1].ready || !players[2].ready) return toggled;
  return model.phase === 'setup' ? startShot(toggled) : nextRound(toggled, mapSeed);
};

// Each destroyed planet costs its owner one life, no matter whose shot hit it.
// A miss by both returns to setup with the same map so players can adjust.
// A hit means a new map, which settles a reward at stake: paid if earned, otherwise lost.
const endRound = (model: GameModel): GameModel => {
  if (model.phase !== 'firing') return model;
  const hit = model.destroyed.length > 0;
  const reward = hit && model.mapReward?.earned ? model.mapReward : null;
  const players = mapPlayers(model, (p, n) => {
    const after = { ...p, ready: false, lives: Math.max(0, p.lives - (model.destroyed.includes(n) ? 1 : 0)) };
    return n === 1 && reward ? payReward(after, reward) : after;
  });
  return { ...model, players, phase: hit ? 'gameover' : 'setup', mapReward: hit ? null : model.mapReward, paidReward: reward?.reward ?? null };
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
    case 'selectShot':
      return canUse(model.players[action.player], action.shot) ? updatePlayer(model, action.player, { shot: action.shot }) : model;
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
      return {
        ...newMatch(model, action.mapSeed, action.lives, action.ammo),
        mapReward: action.mapReward ? { ...action.mapReward, earned: false } : null
      };
  }
};
