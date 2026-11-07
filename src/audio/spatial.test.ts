import { describe, expect, it } from 'vitest';
import { humIntensity, panFor } from './spatial';
import { CANVAS_WIDTH } from '../constants/game';
import { GravityBody, Projectile } from '../types/game';

const star: GravityBody = { x: 500, y: 300, mass: 8000, radius: 18, color: '#ffffff', type: 'star' };
const projectileAt = (x: number, y: number, active = true): Projectile =>
  ({ x, y, vx: 0, vy: 0, trail: [], player: 1, active });

describe('panFor', () => {
  it('places sounds left, centre and right without going fully into one ear', () => {
    expect(panFor(0)).toBeCloseTo(-0.8);
    expect(panFor(CANVAS_WIDTH / 2)).toBeCloseTo(0);
    expect(panFor(CANVAS_WIDTH)).toBeCloseTo(0.8);
    expect(panFor(CANVAS_WIDTH * 2)).toBeCloseTo(0.8);
  });
});

describe('humIntensity', () => {
  it('is silent far from any mass and full right next to a star', () => {
    expect(humIntensity(projectileAt(100, 300), [star])).toBe(0);
    expect(humIntensity(projectileAt(530, 300), [star])).toBe(1);
  });

  it('swells as the projectile gets closer', () => {
    const far = humIntensity(projectileAt(620, 300), [star]);
    const near = humIntensity(projectileAt(580, 300), [star]);
    expect(far).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(far);
  });

  it('is silent for a projectile that has stopped', () => {
    expect(humIntensity(projectileAt(530, 300, false), [star])).toBe(0);
  });
});
