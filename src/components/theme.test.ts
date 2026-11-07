import { describe, expect, it } from 'vitest';
import { powerFill } from './theme';
import { MAX_POWER, MIN_POWER } from '../game/aim';

describe('powerFill', () => {
  it('maps the power range onto 0..100 % of the meter', () => {
    expect(powerFill(MIN_POWER)).toBe(0);
    expect(powerFill((MIN_POWER + MAX_POWER) / 2)).toBe(50);
    expect(powerFill(MAX_POWER)).toBe(100);
  });

  it('stays inside the meter', () => {
    expect(powerFill(MIN_POWER - 20)).toBe(0);
    expect(powerFill(MAX_POWER + 20)).toBe(100);
  });
});
