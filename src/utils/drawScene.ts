import { ExplosionParticle, GameStats, GravityBody, Planet, PlanetFragment, Projectile } from '../types/game';
import { CANVAS_WIDTH } from '../constants/game';
import { drawGlowingSprite } from './glowSprites';

export type SpriteCache = Record<string, HTMLImageElement>;
type Planets = { player1: Planet; player2: Planet };

export const drawGravityBodies = (
  ctx: CanvasRenderingContext2D,
  bodies: GravityBody[],
  sprites: SpriteCache,
  pulse: number
) => {
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

const drawPlanet = (ctx: CanvasRenderingContext2D, planet: Planet, sprites: SpriteCache) => {
  const sprite = planet.sprite ? sprites[planet.sprite] : null;
  if (sprite) {
    ctx.drawImage(sprite, planet.x - planet.radius, planet.y - planet.radius, planet.radius * 2, planet.radius * 2);
    return;
  }
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
  ctx.fillStyle = planet.color;
  ctx.fill();
};

const drawHearts = (ctx: CanvasRenderingContext2D, planetY: number, lives: number, isPlayer1: boolean) => {
  const heartSpacing = 15;
  const heartX = isPlayer1 ? 15 : CANVAS_WIDTH - 15;
  const startY = planetY - 15;

  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 3; i++) {
    const heartY = startY + i * heartSpacing;
    if (i < lives) {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('❤', heartX, heartY);
    } else {
      // Empty heart outline
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 0.75;
      ctx.strokeText('❤', heartX, heartY);
    }
  }
};

/** Draws surviving planets with their lives. */
export const drawPlanets = (
  ctx: CanvasRenderingContext2D,
  planets: Planets,
  destroyed: Set<1 | 2>,
  sprites: SpriteCache,
  stats: GameStats
) => {
  if (!destroyed.has(1)) {
    drawPlanet(ctx, planets.player1, sprites);
    drawHearts(ctx, planets.player1.y, stats.player1.lives, true);
  }
  if (!destroyed.has(2)) {
    drawPlanet(ctx, planets.player2, sprites);
    drawHearts(ctx, planets.player2.y, stats.player2.lives, false);
  }
};

const drawAimLine = (ctx: CanvasRenderingContext2D, planet: Planet, angleDeg: number) => {
  const lineLength = 40;
  const angleRad = (angleDeg * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(planet.x, planet.y);
  ctx.lineTo(planet.x + Math.cos(angleRad) * lineLength, planet.y + Math.sin(angleRad) * lineLength);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawAimLines = (ctx: CanvasRenderingContext2D, planets: Planets, angle1: number, angle2: number) => {
  drawAimLine(ctx, planets.player1, angle1);
  drawAimLine(ctx, planets.player2, angle2);
};

// Trails are never shortened, so they are built up incrementally in a Path2D
// instead of walking every point again each frame.
export type TrailPaths = WeakMap<Projectile, { path: Path2D; count: number }>;

const trailPath = (proj: Projectile, cache: TrailPaths) => {
  let entry = cache.get(proj);
  if (!entry) {
    entry = { path: new Path2D(), count: 0 };
    cache.set(proj, entry);
  }
  for (let i = entry.count; i < proj.trail.length; i++) {
    const point = proj.trail[i];
    if (i === 0) entry.path.moveTo(point.x, point.y);
    else entry.path.lineTo(point.x, point.y);
  }
  entry.count = proj.trail.length;
  return entry.path;
};

export const drawProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Projectile[], cache: TrailPaths) => {
  projectiles.forEach(proj => {
    // Always draw trail (even for inactive projectiles that went off-screen)
    if (proj.trail.length > 0) {
      ctx.strokeStyle = proj.player === 1 ? 'rgba(66, 135, 245, 0.6)' : 'rgba(245, 66, 66, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke(trailPath(proj, cache));
    }

    if (proj.active) {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = proj.player === 1 ? '#4287f5' : '#f54242';
      ctx.fill();
    }
  });
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
      fragment.sourceX, fragment.sourceY, fragment.sourceWidth, fragment.sourceHeight,
      -fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height
    );
    ctx.restore();
  });
};
