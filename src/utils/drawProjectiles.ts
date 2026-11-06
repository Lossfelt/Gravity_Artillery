import { Projectile } from '../types/game';

// Comet trails: while a shot flies, the tail fades out behind a glowing head
// and is drawn with additive blending, so it lights up the background. When
// the shot has ended, the whole trail stays as a calm line, so players can
// still use it to adjust their aim.

const COLORS: Record<1 | 2, string> = { 1: '66, 135, 245', 2: '245, 66, 66' };

// Trails are never shortened, so they are built up incrementally: one Path2D
// for the whole trail (drawn with a single stroke) plus chunks of points for
// the fading tail. Only the newest chunk grows; the rest never change.
const CHUNK_POINTS = 10;
const FADE_CHUNKS = 12; // Tail length that fades out, about 120 steps
const MIN_FLYING_ALPHA = 0.15;
const GLOW_CHUNKS = 6; // Only the newest part of the tail gets the wide glow
const RESTING_ALPHA = 0.45;

type TrailCache = { full: Path2D; chunks: Path2D[]; count: number };
export type TrailPaths = WeakMap<Projectile, TrailCache>;

const updateTrail = (proj: Projectile, cache: TrailPaths) => {
  let entry = cache.get(proj);
  if (!entry) {
    entry = { full: new Path2D(), chunks: [], count: 0 };
    cache.set(proj, entry);
  }
  for (let i = entry.count; i < proj.trail.length; i++) {
    const point = proj.trail[i];
    if (i === 0) entry.full.moveTo(point.x, point.y);
    else entry.full.lineTo(point.x, point.y);

    const chunkIndex = Math.floor(i / CHUNK_POINTS);
    if (!entry.chunks[chunkIndex]) {
      const path = new Path2D();
      // Start where the previous chunk ended so the line has no gaps
      const start = proj.trail[Math.max(0, i - 1)];
      path.moveTo(start.x, start.y);
      entry.chunks[chunkIndex] = path;
    }
    entry.chunks[chunkIndex].lineTo(proj.trail[i].x, proj.trail[i].y);
  }
  entry.count = proj.trail.length;
  return entry;
};

// A soft glowing dot, rendered once per player and reused every frame
const headSprites = new Map<1 | 2, HTMLCanvasElement>();
const HEAD_SIZE = 28;

const headSprite = (player: 1 | 2) => {
  const cached = headSprites.get(player);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = HEAD_SIZE;
  canvas.height = HEAD_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const r = HEAD_SIZE / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, `rgba(${COLORS[player]}, 0.9)`);
    gradient.addColorStop(0.5, `rgba(${COLORS[player]}, 0.3)`);
    gradient.addColorStop(1, `rgba(${COLORS[player]}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, HEAD_SIZE, HEAD_SIZE);
  }
  headSprites.set(player, canvas);
  return canvas;
};

const drawFlyingTrail = (ctx: CanvasRenderingContext2D, { full, chunks }: TrailCache, color: string) => {
  // The whole trail as one faint stroke, so long orbits stay cheap to draw
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${color}, ${MIN_FLYING_ALPHA})`;
  ctx.stroke(full);

  // The fading tail on top; with additive blending the brightness adds up
  const head = chunks.length - 1;
  for (let c = Math.max(0, head - FADE_CHUNKS); c <= head; c++) {
    const age = head - c;
    const extra = Math.max(0, 1 - age / FADE_CHUNKS - MIN_FLYING_ALPHA);
    if (age < GLOW_CHUNKS) {
      ctx.lineWidth = 7;
      ctx.strokeStyle = `rgba(${color}, ${extra * 0.18})`;
      ctx.stroke(chunks[c]);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${color}, ${extra * 0.9})`;
    ctx.stroke(chunks[c]);
  }
};

export const drawProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Projectile[], cache: TrailPaths) => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  projectiles.forEach(proj => {
    const color = COLORS[proj.player];
    const trail = updateTrail(proj, cache);

    if (!proj.active) {
      // Resting trail: kept in full as an aiming reference
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${color}, ${RESTING_ALPHA})`;
      ctx.stroke(trail.full);
      return;
    }

    drawFlyingTrail(ctx, trail, color);
    ctx.drawImage(headSprite(proj.player), proj.x - HEAD_SIZE / 2, proj.y - HEAD_SIZE / 2);
  });

  ctx.restore();
};
