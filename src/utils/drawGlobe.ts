import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';
import { GravityBody, Planet } from '../types/game';

// Player planets turn slowly like globes. The middle of the sprite is used as
// a surface texture and scrolled sideways inside the disc, squeezed towards
// the edges like a sphere. The planet is lit from the strongest stars and
// wrapped in a thin atmosphere in its own colour.
const SURFACE_CROP = 0.62; // Centre share of the sprite, skips its baked-in rim
const TEXTURE_SIZE = 128;
const SLICE_PX = 2;
const ROTATION_PERIOD_S = 70; // Seconds per full turn

const surfaces = new Map<string, HTMLCanvasElement>();

/**
 * A strip of [surface, mirrored surface, surface]. The mirror makes it tile
 * without seams, and the extra copy lets a slice run past the wrap point.
 */
const surfaceFor = (sprite: HTMLImageElement) => {
  const cached = surfaces.get(sprite.src);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE * 3;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const crop = sprite.naturalWidth * SURFACE_CROP;
    const start = (sprite.naturalWidth - crop) / 2;
    const draw = (x: number) => ctx.drawImage(sprite, start, start, crop, crop, x, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    draw(0);
    draw(TEXTURE_SIZE * 2);
    ctx.save();
    ctx.translate(TEXTURE_SIZE * 2, 0);
    ctx.scale(-1, 1);
    draw(0);
    ctx.restore();
  }
  surfaces.set(sprite.src, canvas);
  return canvas;
};

/** Unit vector from the planet towards its light, weighted by star mass over distance squared. */
export const lightDirection = (planet: Planet, bodies: GravityBody[]) => {
  let x = 0;
  let y = 0;
  for (const body of bodies) {
    if (body.type !== 'star') continue;
    const dx = body.x - planet.x;
    const dy = body.y - planet.y;
    const distSq = dx * dx + dy * dy;
    if (distSq === 0) continue;
    const weight = body.mass / distSq;
    const dist = Math.sqrt(distSq);
    x += (dx / dist) * weight;
    y += (dy / dist) * weight;
  }
  if (x === 0 && y === 0) {
    // No stars: light from the middle of the map
    x = CANVAS_WIDTH / 2 - planet.x;
    y = CANVAS_HEIGHT / 2 - planet.y;
  }
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};

/** Texture column (0..TEXTURE_SIZE*2) seen at u in [-1, 1] across the disc. */
export const textureColumn = (u: number, turn: number) => {
  // Half a turn (pi of longitude) spans one surface width
  const column = turn * TEXTURE_SIZE * 2 + (Math.asin(Math.max(-1, Math.min(1, u))) / Math.PI) * TEXTURE_SIZE;
  const period = TEXTURE_SIZE * 2;
  return ((column % period) + period) % period;
};

const drawSurface = (ctx: CanvasRenderingContext2D, planet: Planet, surface: HTMLCanvasElement, turn: number) => {
  const { x, y, radius } = planet;
  for (let dx = -radius; dx < radius; dx += SLICE_PX) {
    const left = textureColumn(dx / radius, turn);
    const right = textureColumn(Math.min(dx + SLICE_PX, radius) / radius, turn);
    // Unwrap so the slice never runs backwards across the wrap point
    const width = right >= left ? right - left : right + TEXTURE_SIZE * 2 - left;
    // A little overlap hides hairline gaps between slices
    ctx.drawImage(surface, left, 0, Math.max(width, 0.5), TEXTURE_SIZE, x + dx, y - radius, SLICE_PX + 0.5, radius * 2);
  }
};

const drawShading = (ctx: CanvasRenderingContext2D, planet: Planet, light: { x: number; y: number }) => {
  const { x, y, radius } = planet;
  const hx = x + light.x * radius * 0.55;
  const hy = y + light.y * radius * 0.55;
  const shade = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius * 2.1);
  shade.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  shade.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(0.8, 'rgba(0, 0, 10, 0.72)');
  shade.addColorStop(1, 'rgba(0, 0, 10, 0.85)');
  ctx.fillStyle = shade;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

const drawAtmosphere = (ctx: CanvasRenderingContext2D, planet: Planet, light: { x: number; y: number }, breath: number) => {
  const { x, y, radius, color } = planet;
  const outer = radius * 1.45;
  // Shifted a little towards the light, so the lit side glows more
  const cx = x + light.x * radius * 0.08;
  const cy = y + light.y * radius * 0.08;
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, outer);
  glow.addColorStop(0, `${color}00`);
  glow.addColorStop(0.3, `${color}${Math.round(150 * breath).toString(16).padStart(2, '0')}`);
  glow.addColorStop(1, `${color}00`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glow;
  ctx.fillRect(cx - outer, cy - outer, outer * 2, outer * 2);
  ctx.restore();
};

/** Draws a turning, lit planet. time is in seconds; spin is +1 or -1. */
export const drawGlobe = (
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  sprite: HTMLImageElement,
  light: { x: number; y: number },
  time: number,
  spin: number
) => {
  const turn = (spin * time) / ROTATION_PERIOD_S;
  ctx.save();
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
  ctx.clip();
  drawSurface(ctx, planet, surfaceFor(sprite), turn);
  drawShading(ctx, planet, light);
  ctx.restore();
  drawAtmosphere(ctx, planet, light, 0.85 + 0.15 * Math.sin(time * 0.9 + planet.x));
};
