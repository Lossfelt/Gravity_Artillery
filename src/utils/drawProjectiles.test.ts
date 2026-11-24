import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, OFFSCREEN_MARGIN } from '../constants/game';
import { Projectile } from '../types/game';
import { offscreenMarker } from './drawProjectiles';

const shot = (x: number, y: number, active = true): Projectile =>
  ({ x, y, vx: 0, vy: 0, trail: [], player: 1, active, kind: 'standard' });

describe('offscreenMarker', () => {
  it('shows nothing while the shot is on the board or has ended', () => {
    expect(offscreenMarker(shot(500, 300))).toBeNull();
    expect(offscreenMarker(shot(500, -50, false))).toBeNull();
  });

  it('marks the edge the shot left by, at its x, fading with distance', () => {
    expect(offscreenMarker(shot(420, -1))).toMatchObject({ x: 420, edge: 'top' });
    expect(offscreenMarker(shot(420, -1))!.closeness).toBeCloseTo(1, 1);
    expect(offscreenMarker(shot(420, CANVAS_HEIGHT + OFFSCREEN_MARGIN / 2))).toMatchObject({ edge: 'bottom', closeness: 0.5 });
  });

  it('keeps the marker clear of the corners', () => {
    expect(offscreenMarker(shot(-3, -10))!.x).toBeGreaterThan(0);
    expect(offscreenMarker(shot(CANVAS_WIDTH + 3, -10))!.x).toBeLessThan(CANVAS_WIDTH);
  });
});
