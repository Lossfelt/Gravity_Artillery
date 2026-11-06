import { describe, expect, it } from 'vitest';
import { GravityBody } from '../types/game';
import { initialPlanets } from '../constants/game';
import { createRandom } from '../utils/random';
import { generateGravitationalBodies } from '../utils/generateGravitationalBodies';
import { aimWithError, findBestAim, simulateShot } from './ai';
import { toRelativeAngle } from './aim';

const star = (x: number, y: number, mass = 8000): GravityBody =>
  ({ x, y, mass, radius: 18, color: '#fff', type: 'star' });

describe('simulateShot', () => {
  it('hits the opponent with a straight shot in empty space', () => {
    expect(simulateShot(initialPlanets, [], 2, { angle: 180, power: 100 })).toEqual({ hit: 1, closest: 0 });
  });

  it('reports the closest approach on a miss', () => {
    const result = simulateShot(initialPlanets, [], 1, { angle: -30, power: 100 });
    expect(result.hit).toBeNull();
    expect(result.closest).toBeGreaterThan(25);
  });
});

describe('findBestAim', () => {
  it('finds a hit in empty space', () => {
    const best = findBestAim(initialPlanets, [], 2);
    expect(best.score).toBe(0);
    expect(simulateShot(initialPlanets, [], 2, best).hit).toBe(1);
  });

  it('finds a way around a star in the direct line', () => {
    const bodies = [star(500, 300, 12000)];
    const best = findBestAim(initialPlanets, bodies, 2);
    expect(best.score).toBe(0);
    expect(simulateShot(initialPlanets, bodies, 2, best).hit).toBe(1);
  });

  it('gets close on random maps', () => {
    for (const seed of [1, 2, 3]) {
      const bodies = generateGravitationalBodies(initialPlanets, createRandom(seed));
      const best = findBestAim(initialPlanets, bodies, 2);
      expect(best.score).toBeLessThan(100);
    }
  });
});

describe('aimWithError', () => {
  const best = { angle: 180, power: 100 };

  it('misses by less on later attempts', () => {
    const spread = (attempt: number) => {
      const random = createRandom(5);
      let total = 0;
      for (let i = 0; i < 200; i++) {
        total += Math.abs(toRelativeAngle(2, aimWithError(best, 2, 'easy', attempt, random).angle));
      }
      return total / 200;
    };
    expect(spread(3)).toBeLessThan(spread(0));
  });

  it('is more precise on hard than on easy', () => {
    const maxError = (difficulty: 'easy' | 'hard') => {
      const random = createRandom(9);
      let max = 0;
      for (let i = 0; i < 200; i++) {
        max = Math.max(max, Math.abs(toRelativeAngle(2, aimWithError(best, 2, difficulty, 0, random).angle)));
      }
      return max;
    };
    expect(maxError('hard')).toBeLessThanOrEqual(2);
    expect(maxError('easy')).toBeGreaterThan(2);
  });

  it('keeps aim within the allowed range', () => {
    const random = createRandom(3);
    for (let i = 0; i < 100; i++) {
      const aim = aimWithError({ angle: 270, power: 150 }, 2, 'easy', 0, random);
      expect(Math.abs(toRelativeAngle(2, aim.angle))).toBeLessThanOrEqual(90);
      expect(aim.power).toBeLessThanOrEqual(150);
    }
  });
});
