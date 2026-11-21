import { describe, expect, it } from 'vitest';
import { createInitialModel, GameAction, gameReducer, GameModel } from './gameReducer';
import { formatAim } from './aim';

const run = (model: GameModel, ...actions: GameAction[]) => actions.reduce(gameReducer, model);
const fire: GameAction[] = [
  { type: 'toggleReady', player: 1, mapSeed: 7 },
  { type: 'toggleReady', player: 2, mapSeed: 7 }
];
const lives = (model: GameModel) => [model.players[1].lives, model.players[2].lives];

describe('gameReducer', () => {
  it('fires when both players are ready', () => {
    const model = run(createInitialModel(1), ...fire);
    expect(model.phase).toBe('firing');
    expect(model.shotNumber).toBe(1);
  });

  it('does not fire when only one player is ready', () => {
    const model = run(createInitialModel(1), fire[0]);
    expect(model.phase).toBe('setup');
    expect(model.players[1].ready).toBe(true);
  });

  it('returns to setup with the same map when both miss', () => {
    const model = run(createInitialModel(1), ...fire, { type: 'roundEnded' });
    expect(model.phase).toBe('setup');
    expect(model.mapSeed).toBe(1);
    expect(lives(model)).toEqual([3, 3]);
    expect(model.players[1].ready).toBe(false);
  });

  it('costs the owner exactly one life per destroyed planet', () => {
    const model = run(createInitialModel(1), ...fire,
      { type: 'planetDestroyed', player: 2, shooter: 1 },
      { type: 'planetDestroyed', player: 2, shooter: 1 },
      { type: 'roundEnded' },
      { type: 'roundEnded' });
    expect(model.phase).toBe('gameover');
    expect(lives(model)).toEqual([3, 2]);
  });

  it('lets a player destroy their own planet', () => {
    const model = run(createInitialModel(1), ...fire, { type: 'planetDestroyed', player: 1, shooter: 1 }, { type: 'roundEnded' });
    expect(lives(model)).toEqual([2, 3]);
  });

  it('starts the next round with a new map when both are ready after a hit', () => {
    const model = run(createInitialModel(1), ...fire,
      { type: 'setAim', player: 1, angle: 30 },
      { type: 'planetDestroyed', player: 2, shooter: 1 },
      { type: 'roundEnded' },
      ...fire);
    expect(model.phase).toBe('setup');
    expect(model.mapSeed).toBe(7);
    expect(model.roundNumber).toBe(1);
    expect(model.destroyed).toEqual([]);
    expect(lives(model)).toEqual([3, 2]);
  });

  it('ignores aim changes while firing or ready', () => {
    const firing = run(createInitialModel(1), ...fire, { type: 'setAim', player: 1, angle: 45 });
    expect(firing.players[1].angle).toBe(0);
    const ready = run(createInitialModel(1), fire[0], { type: 'setAim', player: 1, angle: 45 });
    expect(ready.players[1].angle).toBe(0);
  });

  it('declares a winner and resets lives for a new match', () => {
    let model = createInitialModel(1);
    for (let round = 0; round < 3; round++) {
      model = run(model, ...fire, { type: 'planetDestroyed', player: 2, shooter: 1 }, { type: 'roundEnded' });
      if (round < 2) model = run(model, { type: 'nextRound', mapSeed: round });
    }
    expect(lives(model)).toEqual([3, 0]);
    model = run(model, { type: 'revealWinner' });
    expect(model.winner).toBe(1);
    model = run(model, { type: 'nextRound', mapSeed: 99 });
    expect(lives(model)).toEqual([3, 3]);
    expect(model.winner).toBeNull();
  });

  it('does not move on from a decided match before the result is shown', () => {
    let model = run(createInitialModel(1), { type: 'newMatch', mapSeed: 2, lives: { 1: 1, 2: 3 } });
    model = run(model, ...fire, { type: 'planetDestroyed', player: 1, shooter: 2 }, { type: 'roundEnded' });
    const decided = run(model, ...fire, { type: 'nextRound', mapSeed: 9 });
    expect(decided).toBe(model);
    model = run(model, { type: 'revealWinner' }, ...fire);
    expect(model.winner).toBeNull();
    expect(lives(model)).toEqual([1, 3]);
  });

  it('declares a draw when both run out of lives together', () => {
    let model = createInitialModel(1);
    for (let round = 0; round < 3; round++) {
      model = run(model, ...fire,
        { type: 'planetDestroyed', player: 1, shooter: 2 },
        { type: 'planetDestroyed', player: 2, shooter: 1 },
        { type: 'roundEnded' },
        { type: 'revealWinner' });
      if (round < 2) model = run(model, { type: 'nextRound', mapSeed: round });
    }
    expect(model.winner).toBe('draw');
  });
});

describe('newMatch', () => {
  it('starts a match with the given lives as heart slots', () => {
    const model = run(createInitialModel(1), ...fire, { type: 'roundEnded' },
      { type: 'newMatch', mapSeed: 5, lives: { 1: 2, 2: 1 } });
    expect(model.phase).toBe('setup');
    expect(lives(model)).toEqual([2, 1]);
    expect([model.players[1].maxLives, model.players[2].maxLives]).toEqual([2, 1]);
    expect(model.mapSeed).toBe(5);
    expect(model.matchShots).toBe(0);
  });

  it('keeps shotNumber and bumps roundNumber, so the board clears without firing', () => {
    const before = run(createInitialModel(1), ...fire, { type: 'roundEnded' });
    const after = gameReducer(before, { type: 'newMatch', mapSeed: 5, lives: { 1: 3, 2: 3 } });
    expect(after.shotNumber).toBe(before.shotNumber);
    expect(after.roundNumber).toBe(before.roundNumber + 1);
  });

  it('plays again with the same lives as the last match', () => {
    let model = run(createInitialModel(1), { type: 'newMatch', mapSeed: 2, lives: { 1: 3, 2: 1 } });
    model = run(model, ...fire, { type: 'planetDestroyed', player: 2, shooter: 1 }, { type: 'roundEnded' });
    model = run(model, { type: 'revealWinner' }, { type: 'nextRound', mapSeed: 3 });
    expect(lives(model)).toEqual([3, 1]);
  });
});

describe('match statistics', () => {
  it('counts shots and hits on the opponent, but not self-hits', () => {
    let model = run(createInitialModel(1), ...fire,
      { type: 'planetDestroyed', player: 2, shooter: 1 },
      { type: 'planetDestroyed', player: 1, shooter: 1 },
      { type: 'roundEnded' });
    model = run(model, { type: 'nextRound', mapSeed: 2 }, ...fire, { type: 'roundEnded' });
    expect(model.matchShots).toBe(2);
    expect(model.players[1].hits).toBe(1);
    expect(model.players[2].hits).toBe(0);
  });

  it('ignores a hit outside a shot', () => {
    const model = gameReducer(createInitialModel(1), { type: 'planetDestroyed', player: 2, shooter: 1 });
    expect(model.destroyed).toEqual([]);
    expect(model.players[1].hits).toBe(0);
  });
});

describe('special shots', () => {
  const armed = () => createInitialModel(1, { 1: 3, 2: 3 }, { 1: { homing: 1, splitter: 0, phase: 2 } });

  it('uses up the chosen shot when fired, then goes back to standard', () => {
    const model = run(armed(), { type: 'selectShot', player: 1, shot: 'homing' }, ...fire);
    expect(model.firedShots).toEqual({ 1: 'homing', 2: 'standard' });
    expect(model.players[1].ammo).toEqual({ homing: 0, splitter: 0, phase: 2 });
    expect(model.players[1].shot).toBe('standard');
  });

  it('cannot choose a shot there is no ammunition for', () => {
    expect(run(armed(), { type: 'selectShot', player: 1, shot: 'splitter' }).players[1].shot).toBe('standard');
    expect(run(createInitialModel(1), { type: 'selectShot', player: 2, shot: 'phase' }).players[2].shot).toBe('standard');
  });

  it('cannot change the shot after pressing Fire', () => {
    const model = run(armed(), fire[0], { type: 'selectShot', player: 1, shot: 'phase' });
    expect(model.players[1].shot).toBe('standard');
  });

  it('keeps the ammunition left between rounds', () => {
    const model = run(armed(), { type: 'selectShot', player: 1, shot: 'phase' }, ...fire,
      { type: 'planetDestroyed', player: 2, shooter: 1 }, { type: 'roundEnded' }, { type: 'nextRound', mapSeed: 4 });
    expect(model.players[1].ammo.phase).toBe(1);
  });
});

describe('adjustAngle', () => {
  it('steps in tenths of a degree without rounding drift', () => {
    let model = createInitialModel(1);
    for (let i = 0; i < 3; i++) model = gameReducer(model, { type: 'adjustAngle', player: 1, delta: 0.1 });
    expect(model.players[1].angle).toBe(0.3);
    model = run(model, { type: 'adjustAngle', player: 2, delta: -0.1 }, { type: 'adjustAngle', player: 2, delta: -0.2 });
    expect(model.players[2].angle).toBe(180.3);
  });

  it('applies several quick adjustments on top of each other', () => {
    const model = run(createInitialModel(1),
      { type: 'adjustAngle', player: 2, delta: -5 },
      { type: 'adjustAngle', player: 2, delta: -5 },
      { type: 'adjustAngle', player: 2, delta: 1 });
    // Player 2 faces left (180); up is a larger world angle
    expect(model.players[2].angle).toBe(189);
  });

  it('clamps to the aim limit', () => {
    let model = createInitialModel(1);
    for (let i = 0; i < 30; i++) model = gameReducer(model, { type: 'adjustAngle', player: 1, delta: 5 });
    expect(model.players[1].angle).toBe(90);
  });
});

describe('formatAim', () => {
  it('always shows one decimal, relative to facing the opponent', () => {
    expect(formatAim(1, 0)).toBe('0.0°');
    expect(formatAim(1, -12.3)).toBe('-12.3°');
    expect(formatAim(2, 180.3)).toBe('-0.3°');
  });
});
