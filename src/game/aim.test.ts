import { describe, expect, it } from 'vitest';
import { adjustAim, AIM_LIMIT, toRelativeAngle, toWorldAngle } from './aim';

describe('aim', () => {
  it('uses 0 as straight at the opponent for both players', () => {
    expect(toRelativeAngle(1, 0)).toBe(0);
    expect(toRelativeAngle(2, 180)).toBe(0);
  });

  it('treats negative as up for both players', () => {
    // Up on the canvas is a world angle of 270 (= -90)
    expect(toWorldAngle(1, -10)).toBe(-10);
    expect(toWorldAngle(2, -10)).toBe(190);
  });

  it('round-trips between relative and world angles', () => {
    for (const player of [1, 2] as const) {
      expect(toRelativeAngle(player, toWorldAngle(player, 37))).toBe(37);
    }
  });

  it('clamps adjustments to the aim limit', () => {
    expect(toRelativeAngle(1, adjustAim(1, toWorldAngle(1, 88), 5))).toBe(AIM_LIMIT);
    expect(toRelativeAngle(2, adjustAim(2, toWorldAngle(2, -88), -5))).toBe(-AIM_LIMIT);
  });
});
