import { ExplosionParticle, GravityBody, Impact, Planet, PlanetFragment, Projectile } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PLANET_RADIUS, PROJECTILE_SPEED } from '../constants/game';
import { calculateGravity } from './calculateGravity';
import { checkCollision } from './checkCollision';

// The simulation mutates its arrays and objects in place. It runs every frame,
// and copying arrays (especially the ever-growing trails) made each frame
// slower the longer a shot lasted.

type PlayerNumber = 1 | 2;

/** Creates a projectile on the edge of a planet, at the fixed launch speed. */
export const createProjectile = (planet: Planet, angleDeg: number, player: PlayerNumber): Projectile => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: planet.x + Math.cos(angleRad) * PLANET_RADIUS,
    y: planet.y + Math.sin(angleRad) * PLANET_RADIUS,
    vx: Math.cos(angleRad) * PROJECTILE_SPEED,
    vy: Math.sin(angleRad) * PROJECTILE_SPEED,
    trail: [],
    player,
    active: true
  };
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
  const { ax, ay } = calculateGravity(proj.x, proj.y, bodies);

  const newVx = proj.vx + ax * 0.1 * deltaTime;
  const newVy = proj.vy + ay * 0.1 * deltaTime;
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
    if (!destroyed.has(player) && checkCollision({ x: newX, y: newY }, planet, PLANET_RADIUS)) {
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
