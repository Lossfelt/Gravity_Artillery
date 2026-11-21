import { describe, expect, it } from 'vitest';
import { GravityBody } from '../types/game';
import { initialPlanets } from '../constants/game';
import { mapScore, MapReport, pickChoices, scoutMap, tierOf } from './mapScouting';

const star = (x: number, y: number, mass = 8000): GravityBody =>
  ({ x, y, mass, radius: 18, color: '#fff', type: 'star' });

const report = (seed: number, score: number, fair = true): MapReport =>
  ({ seed, hitWidth: 3, nearestHit: 0, score, tier: tierOf(score), fair });

describe('scoutMap', () => {
  it('finds the straight shot in empty space', () => {
    const r = scoutMap(initialPlanets, [], 1);
    expect(r.nearestHit).toBe(0);
    expect(r.hitWidth).toBeGreaterThan(2);
    expect(r.fair).toBe(true);
    expect(r.tier).toBe('open');
  });

  it('rates a star bending the direct line away as harder', () => {
    const empty = scoutMap(initialPlanets, [], 1);
    // Shots pass through stars, so the star sits beside the line to pull the straight shot off target
    const blocked = scoutMap(initialPlanets, [star(500, 340, 12000)], 2);
    expect(blocked.nearestHit).toBeGreaterThan(0);
    expect(blocked.score).toBeGreaterThan(empty.score);
  });
});

describe('mapScore', () => {
  it('grows with distance from straight ahead and with narrower windows', () => {
    expect(mapScore(3, 5)).toBeGreaterThan(mapScore(3, 1));
    expect(mapScore(1, 1)).toBeGreaterThan(mapScore(4, 1));
    expect(mapScore(0, 0)).toBe(Infinity);
  });
});

describe('pickChoices', () => {
  it('offers the easiest and the hardest fair map', () => {
    const [easier, harder] = pickChoices([report(1, 7), report(2, 3), report(3, 30, false), report(4, 12)]);
    expect(easier.seed).toBe(2);
    expect(harder.seed).toBe(4);
  });

  it('falls back to unfair maps when fewer than two are fair', () => {
    const [easier, harder] = pickChoices([report(1, 7, false), report(2, 3)]);
    expect([easier.seed, harder.seed]).toEqual([2, 1]);
  });
});
