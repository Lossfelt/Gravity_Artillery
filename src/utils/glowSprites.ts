import { GravityBody } from '../types/game';

// shadowBlur is expensive on mobile GPUs. Instead of blurring every star every
// frame, each star is pre-rendered with its glow at a fixed number of pulse
// levels, and the frame just picks the nearest level.
const GLOW_LEVELS = 16;
const MIN_PULSE = 0.4;
const MAX_PULSE = 1.0;

type GlowFrame = { canvas: HTMLCanvasElement; padding: number };

const cache = new Map<string, (GlowFrame | undefined)[]>();

const glowIntensity = (body: GravityBody, pulse: number) => body.radius * 1.5 * pulse;

const renderGlowFrame = (sprite: HTMLImageElement, body: GravityBody, pulse: number): GlowFrame => {
  // The blur reaches about 1.5x shadowBlur beyond the sprite edge
  const padding = Math.ceil(glowIntensity(body, MAX_PULSE) * 1.5) + 2;
  const size = (body.radius + padding) * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.shadowBlur = glowIntensity(body, pulse);
    ctx.shadowColor = body.color;
    ctx.drawImage(sprite, padding, padding, body.radius * 2, body.radius * 2);
  }
  return { canvas, padding };
};

/**
 * Draws a star sprite with a pulsing glow. pulse is expected in [0.4, 1.0].
 */
export const drawGlowingSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  body: GravityBody,
  pulse: number
) => {
  const key = `${sprite.src}|${body.radius}|${body.color}`;
  let frames = cache.get(key);
  if (!frames) {
    frames = new Array(GLOW_LEVELS);
    cache.set(key, frames);
  }

  const normalized = (pulse - MIN_PULSE) / (MAX_PULSE - MIN_PULSE);
  const level = Math.max(0, Math.min(GLOW_LEVELS - 1, Math.round(normalized * (GLOW_LEVELS - 1))));
  const levelPulse = MIN_PULSE + (level / (GLOW_LEVELS - 1)) * (MAX_PULSE - MIN_PULSE);
  const frame = frames[level] ?? (frames[level] = renderGlowFrame(sprite, body, levelPulse));

  const offset = body.radius + frame.padding;
  ctx.drawImage(frame.canvas, body.x - offset, body.y - offset);
};
