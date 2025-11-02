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
  type: 'star' | 'planet' | 'blackhole';
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
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  sprite: string;
  // Polygon points for irregular shape clipping (relative to fragment center)
  clipPath: { x: number; y: number }[];
};

export type PlayerStats = {
  lives: number;
};

export type GameStats = {
  player1: PlayerStats;
  player2: PlayerStats;
};
