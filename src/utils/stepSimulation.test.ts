import { describe, expect, it } from 'vitest';
import { ExplosionParticle, GravityBody, PlanetFragment, Projectile } from '../types/game';
import { initialPlanets } from '../constants/game';
import { stepFragments, stepParticles, stepProjectile } from './stepSimulation';

const projectile = (overrides: Partial<Projectile>): Projectile => ({
  x: 500, y: 300, vx: 0, vy: 0, trail: [], player: 1, active: true, ...overrides
});

const noBodies: GravityBody[] = [];
const noneDestroyed = new Set<1 | 2>();

describe('stepProjectile', () => {
  it('moves in a straight line without gravity and records the trail', () => {
    const proj = projectile({ vx: 5, vy: -2 });
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBeNull();
    expect(proj).toMatchObject({ x: 505, y: 298, active: true });
    expect(proj.trail).toEqual([{ x: 500, y: 300 }]);
  });

  it('is pulled towards a gravitational body', () => {
    const star: GravityBody = { x: 600, y: 300, mass: 10000, radius: 20, color: '#fff', type: 'star' };
    const proj = projectile({});
    stepProjectile(proj, [star], initialPlanets, noneDestroyed, 1);
    expect(proj.vx).toBeGreaterThan(0);
    expect(proj.vy).toBe(0);
  });

  it('deactivates when leaving the canvas', () => {
    const proj = projectile({ x: 998, vx: 5 });
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBeNull();
    expect(proj.active).toBe(false);
  });

  it('hits the enemy planet', () => {
    const proj = projectile({ x: 915, vx: 20, player: 1 });
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBe(2);
    expect(proj.active).toBe(false);
  });

  it('hits its own planet when slung back home', () => {
    const proj = projectile({ x: 90, vx: -20, player: 1 });
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBe(1);
  });

  it('passes through a destroyed planet', () => {
    const proj = projectile({ x: 90, vx: -20, player: 1 });
    expect(stepProjectile(proj, noBodies, initialPlanets, new Set([1]), 1)).toBeNull();
    expect(proj.active).toBe(true);
  });

  it('does not hit its own planet at launch', () => {
    const { player1 } = initialPlanets;
    const proj = projectile({ x: player1.x + 25, y: player1.y, vx: 5, player: 1 });
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBeNull();
  });
});

describe('stepParticles', () => {
  it('moves particles and removes dead ones', () => {
    const particle = (life: number): ExplosionParticle =>
      ({ x: 0, y: 0, vx: 1, vy: 2, life, maxLife: 100, color: '#fff', size: 2 });
    const particles = [particle(5), particle(0.5)];
    stepParticles(particles, 1);
    expect(particles).toHaveLength(1);
    expect(particles[0]).toMatchObject({ x: 1, y: 2, life: 4 });
  });
});

describe('stepFragments', () => {
  it('removes fragments far off screen', () => {
    const fragment = (x: number): PlanetFragment => ({
      x, y: 300, vx: 1, vy: 0, rotation: 0, rotationSpeed: 0.1, width: 10, height: 10,
      sourceX: 0, sourceY: 0, sourceWidth: 10, sourceHeight: 10, sprite: '', clipPath: []
    });
    const fragments = [fragment(500), fragment(1100)];
    stepFragments(fragments, 1);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]).toMatchObject({ x: 501, rotation: 0.1 });
  });
});
