import { describe, expect, it } from 'vitest';
import { lightDirection, textureColumn } from './drawGlobe';
import { coronaFlicker } from './drawCorona';
import { createBackgroundStars, driftX } from './backgroundStars';
import { CANVAS_WIDTH } from '../constants/game';
import { GravityBody, Planet } from '../types/game';

const planet: Planet = { x: 50, y: 300, radius: 25, color: '#4287f5' };
const star = (x: number, y: number, mass = 8000): GravityBody =>
  ({ x, y, mass, radius: 18, color: '#ffffff', type: 'star' });

describe('lightDirection', () => {
  it('points towards a single star', () => {
    const light = lightDirection(planet, [star(50, 100)]);
    expect(light.x).toBeCloseTo(0);
    expect(light.y).toBeCloseTo(-1);
  });

  it('favours the nearer star and ignores black holes', () => {
    const hole: GravityBody = { x: 50, y: 590, mass: 15000, radius: 12, color: '#000000', type: 'blackhole' };
    const light = lightDirection(planet, [star(300, 300), star(50, 0), hole]);
    expect(light.x).toBeGreaterThan(Math.abs(light.y));
  });

  it('falls back to the middle of the map without stars', () => {
    expect(lightDirection(planet, []).x).toBeCloseTo(1);
  });
});

describe('textureColumn', () => {
  it('scrolls the surface as the planet turns and wraps after a full turn', () => {
    expect(textureColumn(0, 0.1)).not.toBeCloseTo(textureColumn(0, 0));
    expect(textureColumn(0.3, 1)).toBeCloseTo(textureColumn(0.3, 0));
  });

  it('squeezes the surface towards the edge of the disc', () => {
    const middle = textureColumn(0.1, 0) - textureColumn(0, 0);
    const edge = textureColumn(1, 0) - textureColumn(0.9, 0);
    expect(edge).toBeGreaterThan(middle * 2);
  });
});

describe('scenery', () => {
  it('keeps the corona flicker in a gentle range', () => {
    for (let t = 0; t < 20; t += 0.37) {
      const flicker = coronaFlicker(t, 1.3);
      expect(flicker).toBeGreaterThan(0.79);
      expect(flicker).toBeLessThan(1.21);
    }
  });

  it('creates the same sky every time', () => {
    expect(createBackgroundStars()).toEqual(createBackgroundStars());
  });

  it('drifts stars leftwards and wraps them onto the canvas', () => {
    const [first] = createBackgroundStars();
    const later = driftX(first, 10);
    expect(later).toBeGreaterThanOrEqual(0);
    expect(later).toBeLessThan(CANVAS_WIDTH);
    expect(driftX(first, CANVAS_WIDTH / first.speed)).toBeCloseTo(first.x);
  });
});
