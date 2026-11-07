import { ExplosionParticle, GravityBody, Planet, PlanetFragment } from '../types/game';
import { Aim, PlayerNumber } from '../game/gameReducer';
import { CANVAS_WIDTH } from '../constants/game';
import { drawGlowingSprite } from './glowSprites';
import { drawCoronas } from './drawCorona';
import { drawGlobe, lightDirection } from './drawGlobe';

export type SpriteCache = Record<string, HTMLImageElement>;
type Planets = { player1: Planet; player2: Planet };

export const drawGravityBodies = (
  ctx: CanvasRenderingContext2D,
  bodies: GravityBody[],
  sprites: SpriteCache,
  pulse: number,
  time: number
) => {
  drawCoronas(ctx, bodies, time);
  bodies.forEach(body => {
    if (body.type === 'blackhole') return; // Black holes are only visible through lensing

    const sprite = body.sprite ? sprites[body.sprite] : null;
    if (sprite) {
      drawGlowingSprite(ctx, sprite, body, pulse);
      return;
    }

    // Fallback while the sprite loads: circle with glow
    ctx.save();
    ctx.shadowBlur = body.radius * 1.5 * pulse;
    ctx.shadowColor = body.color;
    ctx.beginPath();
    ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
    ctx.fillStyle = body.color;
    ctx.fill();
    ctx.restore();
  });
};

type SceneTime = { bodies: GravityBody[]; time: number };

const drawPlanet = (ctx: CanvasRenderingContext2D, planet: Planet, sprites: SpriteCache, spin: number, scene: SceneTime) => {
  const sprite = planet.sprite ? sprites[planet.sprite] : null;
  if (sprite) {
    drawGlobe(ctx, planet, sprite, lightDirection(planet, scene.bodies), scene.time, spin);
    return;
  }
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
  ctx.fillStyle = planet.color;
  ctx.fill();
};

// Hearts are drawn as vector shapes, so they look the same on every platform
const HEART_SIZE = 11;
const HEART_SPACING = 15;

const heartPath = (x: number, y: number, s: number) => {
  const path = new Path2D();
  path.moveTo(x, y + s * 0.45);
  path.bezierCurveTo(x - s * 0.1, y + s * 0.3, x - s * 0.55, y + s * 0.1, x - s * 0.5, y - s * 0.15);
  path.bezierCurveTo(x - s * 0.45, y - s * 0.5, x - s * 0.05, y - s * 0.5, x, y - s * 0.2);
  path.bezierCurveTo(x + s * 0.05, y - s * 0.5, x + s * 0.45, y - s * 0.5, x + s * 0.5, y - s * 0.15);
  path.bezierCurveTo(x + s * 0.55, y + s * 0.1, x + s * 0.1, y + s * 0.3, x, y + s * 0.45);
  return path;
};

const drawHearts = (ctx: CanvasRenderingContext2D, planetY: number, lives: number, isPlayer1: boolean) => {
  const x = isPlayer1 ? 15 : CANVAS_WIDTH - 15;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const y = planetY - HEART_SPACING + i * HEART_SPACING;
    const heart = heartPath(x, y, HEART_SIZE);
    if (i < lives) {
      // A larger, faint heart behind gives a cheap glow (shadowBlur is slow on mobile)
      ctx.fillStyle = 'rgba(255, 90, 120, 0.25)';
      ctx.fill(heartPath(x, y, HEART_SIZE * 1.6));
      ctx.fillStyle = '#ff5c7a';
      ctx.fill(heart);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke(heart);
    }
  }
  ctx.restore();
};

/** Draws surviving planets, lit by the stars, with their lives. time is in seconds. */
export const drawPlanets = (
  ctx: CanvasRenderingContext2D,
  planets: Planets,
  destroyed: PlayerNumber[],
  sprites: SpriteCache,
  lives: Record<PlayerNumber, number>,
  scene: SceneTime
) => {
  // The planets turn in opposite directions, mirroring each other
  if (!destroyed.includes(1)) {
    drawPlanet(ctx, planets.player1, sprites, 1, scene);
    drawHearts(ctx, planets.player1.y, lives[1], true);
  }
  if (!destroyed.includes(2)) {
    drawPlanet(ctx, planets.player2, sprites, -1, scene);
    drawHearts(ctx, planets.player2.y, lives[2], false);
  }
};

// The aim line grows with launch power (40 px at 100 %)
const drawAimLine = (ctx: CanvasRenderingContext2D, planet: Planet, { angle, power }: Aim) => {
  const lineLength = 40 * (power / 100);
  const angleRad = (angle * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(planet.x, planet.y);
  ctx.lineTo(planet.x + Math.cos(angleRad) * lineLength, planet.y + Math.sin(angleRad) * lineLength);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawAimLines = (ctx: CanvasRenderingContext2D, planets: Planets, aims: Record<PlayerNumber, Aim>) => {
  drawAimLine(ctx, planets.player1, aims[1]);
  drawAimLine(ctx, planets.player2, aims[2]);
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: ExplosionParticle[]) => {
  particles.forEach(particle => {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

export const drawFragments = (ctx: CanvasRenderingContext2D, fragments: PlanetFragment[], sprites: SpriteCache) => {
  fragments.forEach(fragment => {
    const sprite = sprites[fragment.sprite];
    if (!sprite) return;

    ctx.save();
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.rotation);

    // Clip to an irregular polygon so the fragment looks broken off
    ctx.beginPath();
    fragment.clipPath.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      sprite,
      fragment.sourceX * sprite.naturalWidth, fragment.sourceY * sprite.naturalHeight,
      fragment.sourceWidth * sprite.naturalWidth, fragment.sourceHeight * sprite.naturalHeight,
      -fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height
    );
    ctx.restore();
  });
};
