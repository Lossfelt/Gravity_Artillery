import { GravityBody, Planet } from '../types/game';
import {
  BODY_TYPES,
  GRAVITY_BODY_COUNT,
  BLACK_HOLE_CHANCE,
  MIN_BODY_DISTANCE,
  MIN_PLAYER_DISTANCE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants/game';

/**
 * Calculate distance between two points
 */
const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Check if a position is valid (doesn't overlap with existing bodies or players)
 */
const isValidPosition = (
  x: number,
  y: number,
  radius: number,
  existingBodies: GravityBody[],
  playerPlanets: { player1: Planet; player2: Planet }
): boolean => {
  // Check distance from player planets
  const distToPlayer1 = getDistance(x, y, playerPlanets.player1.x, playerPlanets.player1.y);
  const distToPlayer2 = getDistance(x, y, playerPlanets.player2.x, playerPlanets.player2.y);

  if (distToPlayer1 < MIN_PLAYER_DISTANCE + radius || distToPlayer2 < MIN_PLAYER_DISTANCE + radius) {
    return false;
  }

  // Check distance from existing bodies
  for (const body of existingBodies) {
    const dist = getDistance(x, y, body.x, body.y);
    if (dist < MIN_BODY_DISTANCE + radius + body.radius) {
      return false;
    }
  }

  return true;
};

/**
 * Generate a random position within canvas bounds
 */
const generateRandomPosition = (
  radius: number,
  existingBodies: GravityBody[],
  playerPlanets: { player1: Planet; player2: Planet },
  maxAttempts = 100
): { x: number; y: number } | null => {
  for (let i = 0; i < maxAttempts; i++) {
    const x = radius + Math.random() * (CANVAS_WIDTH - 2 * radius);
    const y = radius + Math.random() * (CANVAS_HEIGHT - 2 * radius);

    if (isValidPosition(x, y, radius, existingBodies, playerPlanets)) {
      return { x, y };
    }
  }

  return null;
};

/**
 * Select a random body type based on probability
 */
const selectRandomBodyType = () => {
  // Check if we should spawn a black hole (rare)
  if (Math.random() < BLACK_HOLE_CHANCE) {
    return BODY_TYPES.BLACK_HOLE;
  }

  // Otherwise, randomly select a star type
  const starTypes = [BODY_TYPES.BLUE_STAR, BODY_TYPES.WHITE_STAR, BODY_TYPES.RED_STAR];
  return starTypes[Math.floor(Math.random() * starTypes.length)];
};

/**
 * Generate an array of random gravitational bodies
 */
export const generateGravitationalBodies = (
  playerPlanets: { player1: Planet; player2: Planet }
): GravityBody[] => {
  const bodies: GravityBody[] = [];

  for (let i = 0; i < GRAVITY_BODY_COUNT; i++) {
    const bodyType = selectRandomBodyType();
    const position = generateRandomPosition(bodyType.radius, bodies, playerPlanets);

    if (!position) {
      // If we can't find a valid position, try with a smaller body
      console.warn(`Could not find valid position for body ${i}, retrying with smaller radius`);
      const smallerBodyType = BODY_TYPES.RED_STAR; // Use smallest star as fallback
      const fallbackPosition = generateRandomPosition(smallerBodyType.radius, bodies, playerPlanets, 200);

      if (fallbackPosition) {
        bodies.push({
          x: fallbackPosition.x,
          y: fallbackPosition.y,
          mass: smallerBodyType.mass,
          radius: smallerBodyType.radius,
          color: smallerBodyType.color,
          type: smallerBodyType.type
        });
      } else {
        console.error(`Failed to place body ${i}`);
      }
      continue;
    }

    bodies.push({
      x: position.x,
      y: position.y,
      mass: bodyType.mass,
      radius: bodyType.radius,
      color: bodyType.color,
      type: bodyType.type
    });
  }

  return bodies;
};
