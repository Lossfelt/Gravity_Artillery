export type GameState = 'setup' | 'firing' | 'gameover';

export type Planet = {
  x: number;
  y: number;
  radius: number;
  color: string;
};

export type GravityBody = {
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  type: 'star' | 'planet' | 'blackhole';
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
