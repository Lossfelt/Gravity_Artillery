import { Planet } from '../types/game';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 600;
export const PLANET_RADIUS = 25;
export const PROJECTILE_SPEED = 5;

export const initialPlanets: { player1: Planet; player2: Planet } = {
  player1: { x: 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#4287f5' },
  player2: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT / 2, radius: PLANET_RADIUS, color: '#f54242' }
};

// Gravitational body types with fixed properties
export const BODY_TYPES = {
  BLUE_STAR: {
    type: 'star' as const,
    mass: 12000,
    radius: 22,
    color: '#4d9fff'
  },
  WHITE_STAR: {
    type: 'star' as const,
    mass: 8000,
    radius: 18,
    color: '#ffffff'
  },
  RED_STAR: {
    type: 'star' as const,
    mass: 5000,
    radius: 15,
    color: '#ff4d4d'
  },
  BLACK_HOLE: {
    type: 'blackhole' as const,
    mass: 15000,
    radius: 12,
    color: '#000000'
  }
};

export const GRAVITY_BODY_COUNT = 5;
export const BLACK_HOLE_CHANCE = 0.12; // 12% chance
export const MIN_BODY_DISTANCE = 80; // Minimum distance between bodies
export const MIN_PLAYER_DISTANCE = 150; // Minimum distance from player planets
