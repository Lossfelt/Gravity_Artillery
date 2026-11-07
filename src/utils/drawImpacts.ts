import { Impact } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';
import { IMPACT_STEPS } from './stepSimulation';

// Effects that give a hit weight: an expanding shockwave ring, a short white
// flash and a screen shake. All of them fade with the impact's age.
const FLASH_STEPS = 10;
const SHAKE_STEPS = 30;
const MAX_SHAKE_PX = 7; // In CSS pixels, at strength 1

const ease = (t: number) => (1 - t) * (1 - t);

export const drawShockwaves = (ctx: CanvasRenderingContext2D, impacts: Impact[]) => {
  if (impacts.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const impact of impacts) {
    const t = impact.age / IMPACT_STEPS;
    const radius = 20 + t * 170 * impact.strength;
    const fade = ease(t);

    ctx.beginPath();
    ctx.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2 + 8 * fade * impact.strength;
    ctx.strokeStyle = `rgba(${impact.color}, ${0.7 * fade})`;
    ctx.stroke();

    // A thinner, brighter inner ring
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, radius * 0.75, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * fade})`;
    ctx.stroke();
  }
  ctx.restore();
};

const youngest = (impacts: Impact[]) =>
  impacts.reduce<Impact | null>((best, impact) => (!best || impact.age < best.age ? impact : best), null);

export const drawFlash = (ctx: CanvasRenderingContext2D, impacts: Impact[]) => {
  const impact = youngest(impacts);
  if (!impact || impact.age >= FLASH_STEPS) return;
  const alpha = Math.min(0.8, 0.45 * impact.strength * ease(impact.age / FLASH_STEPS));
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

/** Random offset for the screen shake this frame, or null when nothing shakes. */
export const shakeOffset = (impacts: Impact[]) => {
  let amplitude = 0;
  for (const impact of impacts) {
    if (impact.age < SHAKE_STEPS) {
      amplitude = Math.max(amplitude, MAX_SHAKE_PX * impact.strength * ease(impact.age / SHAKE_STEPS));
    }
  }
  if (amplitude < 0.3) return null;
  return { dx: (Math.random() * 2 - 1) * amplitude, dy: (Math.random() * 2 - 1) * amplitude };
};
