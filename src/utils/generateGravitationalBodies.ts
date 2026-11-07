import { GravityBody, Planet } from '../types/game';
import { Random } from './random';
import {
  BODY_TYPES,
  GRAVITY_BODY_COUNT,
  BLACK_HOLE_CHANCE,
  MIN_BODY_DISTANCE,
  MIN_PLAYER_DISTANCE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants/game';

type Planets = { player1: Planet; player2: Planet };
type BodyType = (typeof BODY_TYPES)[keyof typeof BODY_TYPES];

const STAR_TYPES = [BODY_TYPES.BLUE_STAR, BODY_TYPES.WHITE_STAR, BODY_TYPES.RED_STAR];

/** Black holes are rare; otherwise one of the three star types. */
const pickBodyType = (random: Random): BodyType =>
  random() < BLACK_HOLE_CHANCE ? BODY_TYPES.BLACK_HOLE : STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];

/** Far enough from both players and from every body already placed. */
const isFree = (x: number, y: number, radius: number, bodies: GravityBody[], planets: Planets) =>
  Math.hypot(x - planets.player1.x, y - planets.player1.y) >= MIN_PLAYER_DISTANCE + radius &&
  Math.hypot(x - planets.player2.x, y - planets.player2.y) >= MIN_PLAYER_DISTANCE + radius &&
  bodies.every(body => Math.hypot(x - body.x, y - body.y) >= MIN_BODY_DISTANCE + radius + body.radius);

/**
 * A number from 0 to 1 that is most likely near 0.5: the average of two
 * random numbers. Bodies cluster towards the middle, where they bend the
 * shots, but can still end up near the edges.
 */
const towardsMiddle = (random: Random) => (random() + random()) / 2;

/** A free position inside the board, weighted towards the middle, or null after maxAttempts. */
const findPosition = (radius: number, bodies: GravityBody[], planets: Planets, random: Random, maxAttempts: number) => {
  for (let i = 0; i < maxAttempts; i++) {
    const x = radius + towardsMiddle(random) * (CANVAS_WIDTH - 2 * radius);
    const y = radius + towardsMiddle(random) * (CANVAS_HEIGHT - 2 * radius);
    if (isFree(x, y, radius, bodies, planets)) return { x, y };
  }
  return null;
};

/**
 * Places the stars and black holes. Pass a seeded Random (see createRandom)
 * to get the same map for the same seed. A body that does not fit is retried
 * as the smallest star, and left out if that does not fit either.
 */
export const generateGravitationalBodies = (planets: Planets, random: Random): GravityBody[] => {
  const bodies: GravityBody[] = [];

  for (let i = 0; i < GRAVITY_BODY_COUNT; i++) {
    let type: BodyType = pickBodyType(random);
    let position = findPosition(type.radius, bodies, planets, random, 100);
    if (!position) {
      type = BODY_TYPES.RED_STAR;
      position = findPosition(type.radius, bodies, planets, random, 200);
    }
    if (!position) continue;

    const { mass, radius, color } = type;
    bodies.push({ ...position, mass, radius, color, type: type.type, ...('sprite' in type && { sprite: type.sprite }) });
  }

  return bodies;
};
