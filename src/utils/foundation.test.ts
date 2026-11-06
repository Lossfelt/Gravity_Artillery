import { describe, expect, it } from 'vitest';
import { initialPlanets } from '../constants/game';
import { consumeSteps, MAX_STEPS_PER_FRAME, PHYSICS_STEP_MS } from './fixedTimestep';
import { generateGravitationalBodies } from './generateGravitationalBodies';
import { createRandom } from './random';

describe('createRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect(seqA.every(n => n >= 0 && n < 1)).toBe(true);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });
});

describe('generateGravitationalBodies', () => {
  it('recreates the same map from the same seed', () => {
    const first = generateGravitationalBodies(initialPlanets, createRandom(1234));
    const second = generateGravitationalBodies(initialPlanets, createRandom(1234));
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });
});

describe('consumeSteps', () => {
  it('runs one step per 1/60 s and carries the remainder', () => {
    const { steps, accumulatorMs } = consumeSteps(0, PHYSICS_STEP_MS * 2.5);
    expect(steps).toBe(2);
    expect(accumulatorMs).toBeCloseTo(PHYSICS_STEP_MS / 2);
  });

  it('keeps real time at 30 FPS by running two steps per frame', () => {
    let accumulatorMs = 0;
    let total = 0;
    for (let frame = 0; frame < 30; frame++) {
      const result = consumeSteps(accumulatorMs, 1000 / 30);
      accumulatorMs = result.accumulatorMs;
      total += result.steps;
    }
    expect(total).toBeGreaterThanOrEqual(59);
    expect(total).toBeLessThanOrEqual(60);
  });

  it('caps the number of steps after a long pause', () => {
    expect(consumeSteps(0, 5000)).toEqual({ steps: MAX_STEPS_PER_FRAME, accumulatorMs: 0 });
  });
});
