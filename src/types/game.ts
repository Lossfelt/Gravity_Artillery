export type GameState = 'setup' | 'firing' | 'gameover';

export type Planet = {
  x: number;
  y: number;
  radius: number;
  color: string;
  sprite?: string;
};

export type GravityBody = {
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  type: 'star' | 'blackhole';
  sprite?: string;
};

export type TrailPoint = {
  x: number;
  y: number;
};

export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: TrailPoint[];
  player: 1 | 2;
  active: boolean;
};

export type ExplosionParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type PlanetFragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  // Source rectangle in the sprite, as fractions (0..1) of its size
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  sprite: string;
  // Polygon points for irregular shape clipping (relative to fragment center)
  clipPath: { x: number; y: number }[];
};

// Fast-changing game objects. Kept in a ref and mutated every frame instead of
// React state, so the animation does not re-render the component tree.
export type Simulation = {
  projectiles: Projectile[];
  explosionParticles: ExplosionParticle[];
  planetFragments: PlanetFragment[];
  impacts: Impact[];
};

// A planet being hit. Drives the shockwave, flash and screen shake.
export type Impact = {
  x: number;
  y: number;
  age: number; // Physics steps since the hit
  color: string; // "r, g, b"
  strength: number; // 1 for a normal hit, more for the match-deciding hit
};
