import { Planet, Projectile, ShotKind } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH, HOMING_RANGE, OFFSCREEN_MARGIN } from '../constants/game';

// Comet trails: while a shot flies, the tail fades out behind a glowing head
// and is drawn with additive blending, so it lights up the background. When
// the shot has ended, the whole trail stays as a calm line, so players can
// still use it to adjust their aim.

const COLORS: Record<1 | 2, string> = { 1: '66, 135, 245', 2: '245, 66, 66' };
// Special shots get their own colour, so they stand out from an ordinary shot
const SHOT_COLORS: Partial<Record<ShotKind, string>> = { homing: '255, 196, 70', phase: '170, 235, 255' };
const colorOf = (proj: Projectile) => SHOT_COLORS[proj.kind] ?? COLORS[proj.player];
// A phase shot leaves a broken, ghostly trail
const PHASE_DASH = [5, 7];

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

// A soft glowing dot, rendered once per colour and kind and reused every frame
const headSprites = new Map<string, HTMLCanvasElement>();
const HEAD_SIZE = 28;
// Splitter heads are smaller, so the three read as fragments of one shot
const HEAD_SCALE: Partial<Record<ShotKind, number>> = { splitter: 0.7, homing: 1.25 };

const headSprite = (color: string, kind: ShotKind) => {
  const key = `${color}|${kind}`;
  const cached = headSprites.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = HEAD_SIZE;
  canvas.height = HEAD_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const r = HEAD_SIZE / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    if (kind === 'phase') {
      // A hollow, ghostly ring
      gradient.addColorStop(0, `rgba(${color}, 0.15)`);
      gradient.addColorStop(0.3, `rgba(${color}, 0.9)`);
      gradient.addColorStop(0.45, `rgba(${color}, 0.25)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, `rgba(${color}, 0.9)`);
      gradient.addColorStop(0.5, `rgba(${color}, 0.3)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, HEAD_SIZE, HEAD_SIZE);
  }
  headSprites.set(key, canvas);
  return canvas;
};

type Planets = { player1: Planet; player2: Planet };

/** Brackets closing in on the target while a homing shot steers towards it. */
const drawLockOn = (ctx: CanvasRenderingContext2D, proj: Projectile, planets: Planets, destroyed: (1 | 2)[], time: number) => {
  const targetPlayer = proj.player === 1 ? 2 : 1;
  if (destroyed.includes(targetPlayer)) return;
  const target = targetPlayer === 1 ? planets.player1 : planets.player2;
  const dist = Math.hypot(target.x - proj.x, target.y - proj.y);
  if (dist > HOMING_RANGE) return;
  const closeness = 1 - dist / HOMING_RANGE;
  const size = target.radius + 14 - closeness * 6;
  const color = SHOT_COLORS.homing;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.rotate(time * 2);
  ctx.strokeStyle = `rgba(${color}, ${0.35 + closeness * 0.5})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, size, -0.35, 0.35);
    ctx.stroke();
  }
  ctx.restore();
  // A faint line from the shot to what it is locked on to
  ctx.strokeStyle = `rgba(${color}, ${0.12 + closeness * 0.2})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(proj.x, proj.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
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

// A shot above or below the board shows as an arrow on that edge, at its x.
// The arrow shrinks and fades the farther out the shot is.
export type OffscreenMarker = { x: number; edge: 'top' | 'bottom'; closeness: number };

const MARKER_INSET = 8; // Keeps the arrow clear of the corners

export const offscreenMarker = (proj: Projectile): OffscreenMarker | null => {
  if (!proj.active) return null;
  const distance = proj.y < 0 ? -proj.y : proj.y - CANVAS_HEIGHT;
  if (distance <= 0) return null;
  return {
    x: Math.max(MARKER_INSET, Math.min(CANVAS_WIDTH - MARKER_INSET, proj.x)),
    edge: proj.y < 0 ? 'top' : 'bottom',
    closeness: Math.max(0, 1 - distance / OFFSCREEN_MARGIN)
  };
};

const drawOffscreenMarker = (ctx: CanvasRenderingContext2D, { x, edge, closeness }: OffscreenMarker, color: string) => {
  const size = 8 + 6 * closeness;
  // Points out of the board, with its tip on the edge
  const tip = edge === 'top' ? 1 : CANVAS_HEIGHT - 1;
  const base = edge === 'top' ? tip + size * 1.3 : tip - size * 1.3;
  ctx.beginPath();
  ctx.moveTo(x, tip);
  ctx.lineTo(x - size, base);
  ctx.lineTo(x + size, base);
  ctx.closePath();
  ctx.fillStyle = `rgba(${color}, ${0.6 + 0.4 * closeness})`;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + 0.5 * closeness})`;
  ctx.stroke();
};

export const drawProjectiles = (
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  cache: TrailPaths,
  planets: Planets,
  destroyed: (1 | 2)[],
  time: number
) => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  projectiles.forEach(proj => {
    const color = colorOf(proj);
    const trail = updateTrail(proj, cache);
    ctx.setLineDash(proj.kind === 'phase' ? PHASE_DASH : []);

    if (!proj.active) {
      // Resting trail: kept in full as an aiming reference
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${color}, ${RESTING_ALPHA})`;
      ctx.stroke(trail.full);
      return;
    }

    drawFlyingTrail(ctx, trail, color);
    if (proj.kind === 'homing') drawLockOn(ctx, proj, planets, destroyed, time);
    const size = HEAD_SIZE * (HEAD_SCALE[proj.kind] ?? 1);
    // A phase shot flickers
    if (proj.kind === 'phase') ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 18);
    ctx.drawImage(headSprite(color, proj.kind), proj.x - size / 2, proj.y - size / 2, size, size);
    ctx.globalAlpha = 1;
  });

  ctx.globalCompositeOperation = 'source-over';
  ctx.setLineDash([]);
  for (const proj of projectiles) {
    const marker = offscreenMarker(proj);
    if (marker) drawOffscreenMarker(ctx, marker, colorOf(proj));
  }

  ctx.restore();
};
