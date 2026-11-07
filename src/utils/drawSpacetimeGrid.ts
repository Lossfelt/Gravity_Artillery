import { GravityBody } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';

// A faint grid that is pulled towards every mass, like a rubber sheet seen
// from above. It shows where gravity is strong. Black holes bend it too, so
// the grid dips where nothing is visible. It is drawn into the static layer,
// so it costs nothing per frame.
const SPACING = 40;
const SAMPLE_STEP = 8;
const PULL = 0.1; // Pull in px at distance d is mass * PULL / d
const MAX_PULL_FRACTION = 0.7; // Never pull a point more than this share of the way to the centre
const SOFTENING = 12;

/** Where a grid point at (x, y) ends up after being pulled towards the masses. */
export const displacePoint = (x: number, y: number, bodies: GravityBody[]) => {
  let dx = 0;
  let dy = 0;
  for (const body of bodies) {
    const bx = body.x - x;
    const by = body.y - y;
    const dist = Math.hypot(bx, by);
    if (dist < 0.001) continue;
    const pull = Math.min(dist * MAX_PULL_FRACTION, (body.mass * PULL) / (dist + SOFTENING));
    dx += (bx / dist) * pull;
    dy += (by / dist) * pull;
  }
  return { x: x + dx, y: y + dy };
};

const traceLine = (ctx: CanvasRenderingContext2D, bodies: GravityBody[], point: (t: number) => [number, number], length: number) => {
  ctx.beginPath();
  for (let t = 0; t <= length; t += SAMPLE_STEP) {
    const [x, y] = point(t);
    const p = displacePoint(x, y, bodies);
    if (t === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
};

export const drawSpacetimeGrid = (ctx: CanvasRenderingContext2D, bodies: GravityBody[]) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(140, 170, 255, 0.13)';
  ctx.lineWidth = 1;
  for (let y = 0; y <= CANVAS_HEIGHT; y += SPACING) {
    traceLine(ctx, bodies, t => [t, y], CANVAS_WIDTH);
  }
  for (let x = 0; x <= CANVAS_WIDTH; x += SPACING) {
    traceLine(ctx, bodies, t => [x, t], CANVAS_HEIGHT);
  }
  ctx.restore();
};
