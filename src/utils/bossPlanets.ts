import { initialPlanets } from '../constants/game';
import { BOSSES, BossKind } from '../game/campaign';
import { Planet } from '../types/game';
import { createRandom } from './random';

// The bosses' looks are drawn in code rather than shipped as images: a grey,
// cratered moon (used as a globe texture like the planet sprites) and a ring
// station seen from above. Each becomes a data URL, so the rest of the game
// loads and draws it like any other sprite, explosion fragments included.

type Planets = { player1: Planet; player2: Planet };

const SIZE = 256;
const C = SIZE / 2;

const canvas2d = (draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  return canvas.toDataURL('image/png');
};

const drawMoon = (ctx: CanvasRenderingContext2D) => {
  const random = createRandom(7);
  const r = SIZE * 0.48;
  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, r, 0, Math.PI * 2);
  ctx.clip();
  const base = ctx.createRadialGradient(C - 30, C - 30, 10, C, C, r);
  base.addColorStop(0, '#d9dbe0');
  base.addColorStop(1, '#8d9099');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Dark plains (maria)
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(70, 74, 86, ${0.25 + random() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(C + (random() - 0.5) * r * 1.4, C + (random() - 0.5) * r * 1.4, 20 + random() * 40, 15 + random() * 30, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Craters: a dark bowl with a lit rim on one side
  for (let i = 0; i < 45; i++) {
    const x = C + (random() - 0.5) * r * 1.8;
    const y = C + (random() - 0.5) * r * 1.8;
    const size = 3 + Math.pow(random(), 2) * 22;
    ctx.fillStyle = 'rgba(60, 62, 72, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(235, 237, 245, 0.35)';
    ctx.lineWidth = Math.max(1, size / 6);
    ctx.beginPath();
    ctx.arc(x, y, size, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.restore();
};

const drawStation = (ctx: CanvasRenderingContext2D) => {
  const ring = SIZE * 0.4;
  ctx.lineCap = 'round';

  // Solar panels on two arms, behind the ring
  ctx.strokeStyle = '#6b7484';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(C - ring * 1.05, C);
  ctx.lineTo(C + ring * 1.05, C);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#1d3f7a';
    ctx.strokeStyle = '#7fa6e6';
    ctx.lineWidth = 2;
    const x = C + side * ring * 0.55 - 14;
    for (const dy of [-40, 18]) {
      ctx.fillRect(x, C + dy, 28, 22);
      ctx.strokeRect(x, C + dy, 28, 22);
    }
  }

  // Spokes
  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 8;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(C, C);
    ctx.lineTo(C + Math.cos(a) * ring, C + Math.sin(a) * ring);
    ctx.stroke();
  }

  // The ring, with segment seams
  ctx.strokeStyle = '#c3cad6';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(C, C, ring, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40, 46, 58, 0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(C + Math.cos(a) * (ring - 11), C + Math.sin(a) * (ring - 11));
    ctx.lineTo(C + Math.cos(a) * (ring + 11), C + Math.sin(a) * (ring + 11));
    ctx.stroke();
  }

  // Windows along the ring
  ctx.fillStyle = '#ffd98a';
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16 + 0.1;
    ctx.fillRect(C + Math.cos(a) * ring - 2, C + Math.sin(a) * ring - 2, 4, 4);
  }

  // Hub
  const hub = ctx.createRadialGradient(C - 8, C - 8, 2, C, C, 30);
  hub.addColorStop(0, '#eef2f8');
  hub.addColorStop(1, '#6f7889');
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(C, C, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(C, C, 7, 0, Math.PI * 2);
  ctx.fill();
};

const COLORS: Record<BossKind, string> = { moon: '#c3c7d1', station: '#9fc2ff' };
const cache = new Map<BossKind, Planets>();

/** The planets for a match: the usual two, or a boss in place of player 2. */
export const planetsFor = (boss: BossKind | null): Planets => {
  if (boss === null) return initialPlanets;
  let planets = cache.get(boss);
  if (!planets) {
    // Tests run without a DOM: the boss then has its size but no picture
    const sprite = typeof document === 'undefined' ? undefined : canvas2d(boss === 'moon' ? drawMoon : drawStation);
    planets = {
      player1: initialPlanets.player1,
      player2: { ...initialPlanets.player2, radius: BOSSES[boss].radius, color: COLORS[boss], kind: boss, sprite }
    };
    cache.set(boss, planets);
  }
  return planets;
};
