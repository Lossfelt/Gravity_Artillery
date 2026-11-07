import { GravityBody } from '../types/game';

// A flickering corona of soft rays behind each star. One ray texture is
// pre-rendered per colour; each frame draws it twice, turning slowly in
// opposite directions, with a flicker made from a few out-of-step sines.
const TEXTURE_SIZE = 160;
const RAYS = 16;
const CORONA_SCALE = 3.4; // Corona radius relative to the star radius

const textures = new Map<string, HTMLCanvasElement>();

// Stable pseudo-random value in [0, 1) for ray i, so every star of a colour looks the same
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const coronaTexture = (color: string) => {
  const cached = textures.get(color);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = TEXTURE_SIZE / 2;
    ctx.globalCompositeOperation = 'lighter';

    const core = ctx.createRadialGradient(c, c, 0, c, c, c);
    core.addColorStop(0, `${color}aa`);
    core.addColorStop(0.35, `${color}33`);
    core.addColorStop(1, `${color}00`);
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    const rays = ctx.createRadialGradient(c, c, 0, c, c, c);
    rays.addColorStop(0, `${color}99`);
    rays.addColorStop(1, `${color}00`);
    ctx.fillStyle = rays;
    for (let i = 0; i < RAYS; i++) {
      const angle = (i / RAYS) * Math.PI * 2 + hash(i) * 0.3;
      const length = c * (0.5 + 0.5 * hash(i + 50));
      const halfWidth = 0.05 + 0.06 * hash(i + 100);
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle - halfWidth * 4) * c * 0.15, c + Math.sin(angle - halfWidth * 4) * c * 0.15);
      ctx.lineTo(c + Math.cos(angle) * length, c + Math.sin(angle) * length);
      ctx.lineTo(c + Math.cos(angle + halfWidth * 4) * c * 0.15, c + Math.sin(angle + halfWidth * 4) * c * 0.15);
      ctx.closePath();
      ctx.fill();
    }
  }
  textures.set(color, canvas);
  return canvas;
};

/** Flicker around 1, roughly within [0.8, 1.2]. phase separates the stars. */
export const coronaFlicker = (time: number, phase: number) =>
  1 + 0.1 * Math.sin(time * 7.3 + phase) + 0.06 * Math.sin(time * 13.7 + phase * 2) + 0.04 * Math.sin(time * 2.1 + phase * 3);

const drawLayer = (
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  body: GravityBody,
  rotation: number,
  size: number,
  alpha: number
) => {
  ctx.save();
  ctx.translate(body.x, body.y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.drawImage(texture, -size, -size, size * 2, size * 2);
  ctx.restore();
};

/** Draws the corona behind every star. time is in seconds. */
export const drawCoronas = (ctx: CanvasRenderingContext2D, bodies: GravityBody[], time: number) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const body of bodies) {
    if (body.type !== 'star') continue;
    const texture = coronaTexture(body.color);
    const phase = body.x * 0.37 + body.y * 0.11;
    const flicker = coronaFlicker(time, phase);
    const size = body.radius * CORONA_SCALE;
    drawLayer(ctx, texture, body, time * 0.05 + phase, size * flicker, 0.45 * flicker);
    drawLayer(ctx, texture, body, -time * 0.03 + phase * 2, size * 0.8 * (2 - flicker), 0.35);
  }
  ctx.restore();
};
