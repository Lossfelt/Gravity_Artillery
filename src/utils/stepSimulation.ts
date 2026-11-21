import { ExplosionParticle, GravityBody, Impact, Planet, PlanetFragment, Projectile, ShotKind } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH, HOMING_PULL, HOMING_RANGE, MAX_FLIGHT_STEPS, PROJECTILE_SPEED, SPLIT_ANGLE } from '../constants/game';
import { calculateGravity } from './calculateGravity';
import { checkCollision } from './checkCollision';

// The simulation mutates its arrays and objects in place. It runs every frame,
// and copying arrays (especially the ever-growing trails) made each frame
// slower the longer a shot lasted.

type PlayerNumber = 1 | 2;

/** Creates a projectile on the edge of a planet, at the fixed launch speed. */
export const createProjectile = (planet: Planet, angleDeg: number, player: PlayerNumber, kind: ShotKind = 'standard'): Projectile => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: planet.x + Math.cos(angleRad) * planet.radius,
    y: planet.y + Math.sin(angleRad) * planet.radius,
    vx: Math.cos(angleRad) * PROJECTILE_SPEED,
    vy: Math.sin(angleRad) * PROJECTILE_SPEED,
    trail: [],
    player,
    active: true,
    kind
  };
};

/** Everything one player fires in a shot: three projectiles for a splitter, otherwise one. */
export const createShot = (planet: Planet, angleDeg: number, player: PlayerNumber, kind: ShotKind = 'standard'): Projectile[] =>
  kind === 'splitter'
    ? [-SPLIT_ANGLE, 0, SPLIT_ANGLE].map(offset => createProjectile(planet, angleDeg + offset, player, kind))
    : [createProjectile(planet, angleDeg, player, kind)];

// A phase shot only feels the black holes
const pullOf = (proj: Projectile, bodies: GravityBody[]) =>
  calculateGravity(proj.x, proj.y, proj.kind === 'phase' ? bodies.filter(b => b.type === 'blackhole') : bodies);

const NO_STEER = { sx: 0, sy: 0 };

/** A homing shot turns towards the enemy planet once within range, with a fixed pull. */
const steerOf = (proj: Projectile, planets: { player1: Planet; player2: Planet }, destroyed: Set<PlayerNumber>) => {
  if (proj.kind !== 'homing') return NO_STEER;
  const target: PlayerNumber = proj.player === 1 ? 2 : 1;
  if (destroyed.has(target)) return NO_STEER;
  const planet = target === 1 ? planets.player1 : planets.player2;
  const dx = planet.x - proj.x;
  const dy = planet.y - proj.y;
  const dist = Math.hypot(dx, dy);
  if (dist > HOMING_RANGE || dist < 1) return NO_STEER;
  return { sx: (HOMING_PULL * dx) / dist, sy: (HOMING_PULL * dy) / dist };
};

/**
 * Advances one active projectile one step. Returns the player whose planet it
 * hit, or null. Either planet can be hit, so a shot slung back home destroys
 * its own planet. Already destroyed planets are ignored.
 */
export const stepProjectile = (
  proj: Projectile,
  bodies: GravityBody[],
  planets: { player1: Planet; player2: Planet },
  destroyed: Set<PlayerNumber>,
  deltaTime: number
): PlayerNumber | null => {
  const { ax, ay } = pullOf(proj, bodies);
  const { sx, sy } = steerOf(proj, planets, destroyed);

  const newVx = proj.vx + (ax * 0.1 + sx) * deltaTime;
  const newVy = proj.vy + (ay * 0.1 + sy) * deltaTime;
  const newX = proj.x + newVx * deltaTime;
  const newY = proj.y + newVy * deltaTime;

  if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
    proj.active = false;
    return null;
  }

  // Shots launch from the own planet's edge moving outward, so the first step
  // already puts them outside it and they cannot hit themselves at launch.
  const targets: [PlayerNumber, Planet][] = [[1, planets.player1], [2, planets.player2]];
  for (const [player, planet] of targets) {
    if (!destroyed.has(player) && checkCollision({ x: newX, y: newY }, planet, planet.radius)) {
      proj.active = false;
      return player;
    }
  }

  proj.trail.push({ x: proj.x, y: proj.y });
  proj.x = newX;
  proj.y = newY;
  proj.vx = newVx;
  proj.vy = newVy;
  return null;
};

/**
 * Stops the projectiles that are still flying once the shot has lasted
 * MAX_FLIGHT_STEPS, and returns them so they can fizzle out on screen.
 */
export const burnOutProjectiles = (projectiles: Projectile[], flightSteps: number) => {
  if (flightSteps < MAX_FLIGHT_STEPS) return [];
  const burnedOut = projectiles.filter(p => p.active);
  for (const proj of burnedOut) proj.active = false;
  return burnedOut;
};

export const stepParticles = (particles: ExplosionParticle[], deltaTime: number) => {
  let kept = 0;
  for (const particle of particles) {
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.life -= deltaTime;
    if (particle.life > 0) particles[kept++] = particle;
  }
  particles.length = kept;
};

export const stepFragments = (fragments: PlanetFragment[], deltaTime: number) => {
  let kept = 0;
  for (const fragment of fragments) {
    fragment.x += fragment.vx * deltaTime;
    fragment.y += fragment.vy * deltaTime;
    fragment.rotation += fragment.rotationSpeed * deltaTime;
    // Remove fragments that are far off screen
    const onScreen = fragment.x > -100 && fragment.x < CANVAS_WIDTH + 100 &&
      fragment.y > -100 && fragment.y < CANVAS_HEIGHT + 100;
    if (onScreen) fragments[kept++] = fragment;
  }
  fragments.length = kept;
};

// How long an impact lives, in physics steps (1 s)
export const IMPACT_STEPS = 60;

export const stepImpacts = (impacts: Impact[], deltaTime: number) => {
  let kept = 0;
  for (const impact of impacts) {
    impact.age += deltaTime;
    if (impact.age < IMPACT_STEPS) impacts[kept++] = impact;
  }
  impacts.length = kept;
};
