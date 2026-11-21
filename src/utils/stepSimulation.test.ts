import { describe, expect, it } from 'vitest';
import { ExplosionParticle, GravityBody, PlanetFragment, Projectile } from '../types/game';
import { initialPlanets, MAX_FLIGHT_STEPS } from '../constants/game';
import { burnOutProjectiles, createProjectile, createShot, stepFragments, stepImpacts, stepParticles, stepProjectile } from './stepSimulation';

const projectile = (overrides: Partial<Projectile>): Projectile => ({
  x: 500, y: 300, vx: 0, vy: 0, trail: [], player: 1, active: true, kind: 'standard', ...overrides
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

describe('createProjectile', () => {
  it('launches from the planet edge at the fixed speed', () => {
    const { player1 } = initialPlanets;
    const proj = createProjectile(player1, 0, 1);
    expect(proj.vx).toBeCloseTo(5);
    expect(proj.x).toBeCloseTo(player1.x + 25);
  });

  it('does not hit its own planet on the first step', () => {
    const proj = createProjectile(initialPlanets.player1, 0, 1);
    expect(stepProjectile(proj, noBodies, initialPlanets, noneDestroyed, 1)).toBeNull();
  });
});

describe('special shots', () => {
  const star: GravityBody = { x: 520, y: 300, mass: 8000, radius: 18, color: '#fff', type: 'star' };
  const hole: GravityBody = { ...star, radius: 12, type: 'blackhole', color: '#000' };
  // Downward speed after one step next to a body straight below
  const pull = (kind: 'standard' | 'phase', body: GravityBody) => {
    const proj = projectile({ y: 280, vx: 0, kind });
    stepProjectile(proj, [body], initialPlanets, noneDestroyed, 1);
    return proj.vy;
  };

  it('steers a homing shot towards the enemy planet, but only within range', () => {
    const { player2 } = initialPlanets;
    const near = projectile({ x: player2.x - 100, y: player2.y - 60, vx: 5, vy: 0, kind: 'homing' });
    stepProjectile(near, noBodies, initialPlanets, noneDestroyed, 1);
    expect(near.vy).toBeGreaterThan(0);
    const far = projectile({ x: 300, y: 100, vx: 5, vy: 0, kind: 'homing' });
    stepProjectile(far, noBodies, initialPlanets, noneDestroyed, 1);
    expect(far.vy).toBe(0);
    const targetGone = projectile({ x: player2.x - 100, y: player2.y - 60, vx: 5, vy: 0, kind: 'homing' });
    stepProjectile(targetGone, noBodies, initialPlanets, new Set([2 as const]), 1);
    expect(targetGone.vy).toBe(0);
  });

  it('ignores stars but not black holes in phase', () => {
    expect(pull('phase', star)).toBe(0);
    expect(pull('phase', hole)).toBeCloseTo(pull('standard', hole));
  });

  it('splits into three shots 3° apart', () => {
    const shots = createShot(initialPlanets.player1, 10, 1, 'splitter');
    const angles = shots.map(p => Math.round((Math.atan2(p.vy, p.vx) * 180) / Math.PI));
    expect(angles).toEqual([7, 10, 13]);
    expect(createShot(initialPlanets.player1, 10, 1, 'homing')).toHaveLength(1);
  });
});

describe('target size', () => {
  it('uses each planet\'s own radius, so a boss is a smaller target', () => {
    const { player2 } = initialPlanets;
    const passBy = () => projectile({ x: player2.x - 20, y: player2.y - 18, vx: 5, vy: 0 });
    expect(stepProjectile(passBy(), noBodies, initialPlanets, noneDestroyed, 1)).toBe(2);
    const moon = { ...initialPlanets, player2: { ...player2, radius: 16 } };
    expect(stepProjectile(passBy(), noBodies, moon, noneDestroyed, 1)).toBeNull();
  });

  it('launches from the edge of a small planet too', () => {
    const moon = { ...initialPlanets.player2, radius: 16 };
    expect(createProjectile(moon, 180, 2).x).toBeCloseTo(moon.x - 16);
  });
});

describe('burnOutProjectiles', () => {
  it('stops only the shots still flying, and only once the time is up', () => {
    const flying = projectile({});
    const landed = projectile({ active: false });
    expect(burnOutProjectiles([flying, landed], MAX_FLIGHT_STEPS - 1)).toEqual([]);
    expect(flying.active).toBe(true);
    expect(burnOutProjectiles([flying, landed], MAX_FLIGHT_STEPS)).toEqual([flying]);
    expect(flying.active).toBe(false);
  });
});

describe('stepImpacts', () => {
  it('ages impacts and removes them after a second', () => {
    const impacts = [
      { x: 0, y: 0, age: 0, color: '255, 0, 0', strength: 1 },
      { x: 0, y: 0, age: 59.5, color: '255, 0, 0', strength: 1 }
    ];
    stepImpacts(impacts, 1);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].age).toBe(1);
  });
});
