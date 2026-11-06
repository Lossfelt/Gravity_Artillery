import { describe, expect, it } from 'vitest';
import { createInitialModel, GameAction, gameReducer, GameModel } from './gameReducer';

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
      { type: 'planetDestroyed', player: 2 },
      { type: 'planetDestroyed', player: 2 },
      { type: 'roundEnded' },
      { type: 'roundEnded' });
    expect(model.phase).toBe('gameover');
    expect(lives(model)).toEqual([3, 2]);
  });

  it('lets a player destroy their own planet', () => {
    const model = run(createInitialModel(1), ...fire, { type: 'planetDestroyed', player: 1 }, { type: 'roundEnded' });
    expect(lives(model)).toEqual([2, 3]);
  });

  it('starts the next round with a new map when both are ready after a hit', () => {
    const model = run(createInitialModel(1), ...fire,
      { type: 'setAngle', player: 1, angle: 30 },
      { type: 'planetDestroyed', player: 2 },
      { type: 'roundEnded' },
      ...fire);
    expect(model.phase).toBe('setup');
    expect(model.mapSeed).toBe(7);
    expect(model.roundNumber).toBe(1);
    expect(model.destroyed).toEqual([]);
    expect(lives(model)).toEqual([3, 2]);
  });

  it('ignores angle changes while firing or ready', () => {
    const firing = run(createInitialModel(1), ...fire, { type: 'setAngle', player: 1, angle: 45 });
    expect(firing.players[1].angle).toBe(0);
    const ready = run(createInitialModel(1), fire[0], { type: 'setAngle', player: 1, angle: 45 });
    expect(ready.players[1].angle).toBe(0);
  });

  it('declares a winner and resets lives for a new match', () => {
    let model = createInitialModel(1);
    for (let round = 0; round < 3; round++) {
      model = run(model, ...fire, { type: 'planetDestroyed', player: 2 }, { type: 'roundEnded' });
      if (round < 2) model = run(model, { type: 'nextRound', mapSeed: round });
    }
    expect(lives(model)).toEqual([3, 0]);
    model = run(model, { type: 'revealWinner' });
    expect(model.winner).toBe(1);
    model = run(model, { type: 'nextRound', mapSeed: 99 });
    expect(lives(model)).toEqual([3, 3]);
    expect(model.winner).toBeNull();
  });

  it('declares a draw when both run out of lives together', () => {
    let model = createInitialModel(1);
    for (let round = 0; round < 3; round++) {
      model = run(model, ...fire,
        { type: 'planetDestroyed', player: 1 },
        { type: 'planetDestroyed', player: 2 },
        { type: 'roundEnded' },
        { type: 'revealWinner' });
      if (round < 2) model = run(model, { type: 'nextRound', mapSeed: round });
    }
    expect(model.winner).toBe('draw');
  });
});

describe('adjustAngle', () => {
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
