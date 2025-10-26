import { GravityBody, Planet } from '../types/game';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 600;
export const PLANET_RADIUS = 25;
export const PROJECTILE_SPEED = 5;

export const initialPlanets: { player1: Planet; player2: Planet } = {
  player1: { x: 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#4287f5' },
  player2: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#f54242' }
};

export const initialGravitationalBodies: GravityBody[] = [
  { x: 300, y: 200, mass: 8000, radius: 20, color: '#ffaa00', type: 'star' },
  { x: 500, y: 400, mass: 5000, radius: 15, color: '#aa88ff', type: 'planet' },
  { x: 700, y: 250, mass: 6000, radius: 18, color: '#88ff88', type: 'planet' },
  { x: 400, y: 450, mass: 10000, radius: 12, color: '#ff0088', type: 'blackhole' },
  { x: 650, y: 100, mass: 4000, radius: 13, color: '#ffff88', type: 'planet' }
];
