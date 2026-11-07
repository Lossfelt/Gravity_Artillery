import { describe, expect, it } from 'vitest';
import { GravityBody } from '../types/game';
import { displacePoint } from './drawSpacetimeGrid';

const body = (x: number, y: number, mass: number): GravityBody =>
  ({ x, y, mass, radius: 15, color: '#fff', type: 'star' });

describe('displacePoint', () => {
  it('leaves points alone without masses', () => {
    expect(displacePoint(100, 200, [])).toEqual({ x: 100, y: 200 });
  });

  it('pulls points towards a mass, more when closer', () => {
    const star = body(500, 300, 10000);
    const near = displacePoint(450, 300, [star]);
    const far = displacePoint(300, 300, [star]);
    expect(near.x - 450).toBeGreaterThan(far.x - 300);
    expect(far.x).toBeGreaterThan(300);
    expect(near.y).toBe(300);
  });

  it('never pulls a point past the centre of the mass', () => {
    const p = displacePoint(495, 300, [body(500, 300, 15000)]);
    expect(p.x).toBeLessThan(500);
  });
});
