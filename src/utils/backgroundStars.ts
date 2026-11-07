import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';
import { GravityBody } from '../types/game';
import { createRandom } from './random';

// Two thin layers of small stars drift slowly over the static background at
// different speeds, which gives depth (parallax). Each star twinkles a little.
// Black holes hide the stars that pass behind them.
type Layer = { count: number; speed: number; minSize: number; maxSize: number; minAlpha: number; maxAlpha: number };

const LAYERS: Layer[] = [
  { count: 110, speed: 1.6, minSize: 0.7, maxSize: 1.2, minAlpha: 0.25, maxAlpha: 0.6 }, // Far
  { count: 35, speed: 4, minSize: 1.2, maxSize: 1.9, minAlpha: 0.45, maxAlpha: 0.85 } // Near
];
const SEED = 20260411; // The same sky every time
const SHADOW_SCALE = 1.6; // Radius of a black hole's shadow relative to its radius

type BackgroundStar = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number; // px per second, leftwards
  twinkleRate: number;
  phase: number;
};

export const createBackgroundStars = (): BackgroundStar[] => {
  const random = createRandom(SEED);
  const between = (min: number, max: number) => min + random() * (max - min);
  return LAYERS.flatMap(layer =>
    Array.from({ length: layer.count }, () => ({
      x: random() * CANVAS_WIDTH,
      y: random() * CANVAS_HEIGHT,
      size: between(layer.minSize, layer.maxSize),
      alpha: between(layer.minAlpha, layer.maxAlpha),
      speed: layer.speed,
      twinkleRate: between(0.6, 2.2),
      phase: random() * Math.PI * 2
    }))
  );
};

/** Horizontal position after drifting for time seconds, wrapped onto the canvas. */
export const driftX = (star: BackgroundStar, time: number) => {
  const x = (star.x - star.speed * time) % CANVAS_WIDTH;
  return x < 0 ? x + CANVAS_WIDTH : x;
};

const behindBlackHole = (x: number, y: number, blackHoles: GravityBody[]) =>
  blackHoles.some(hole => Math.hypot(x - hole.x, y - hole.y) < hole.radius * SHADOW_SCALE);

export const drawBackgroundStars = (
  ctx: CanvasRenderingContext2D,
  stars: BackgroundStar[],
  bodies: GravityBody[],
  time: number
) => {
  const blackHoles = bodies.filter(body => body.type === 'blackhole');
  ctx.save();
  ctx.fillStyle = '#dfe8ff';
  for (const star of stars) {
    const x = driftX(star, time);
    if (behindBlackHole(x, star.y, blackHoles)) continue;
    ctx.globalAlpha = star.alpha * (0.7 + 0.3 * Math.sin(time * star.twinkleRate + star.phase));
    ctx.fillRect(x - star.size / 2, star.y - star.size / 2, star.size, star.size);
  }
  ctx.restore();
};
