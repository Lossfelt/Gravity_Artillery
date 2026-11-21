import { useEffect, useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH, initialPlanets } from '../constants/game';
import { createStaticLayer } from '../utils/createStaticLayer';
import { drawGravityBodies, drawPlanets, SpriteCache } from '../utils/drawScene';
import { generateGravitationalBodies, MapOptions } from '../utils/generateGravitationalBodies';
import { loadImageOnce } from '../utils/imageCache';
import { createRandom } from '../utils/random';
import starscapeImage from '../assets/images/Starscape.webp';

type MapPreviewProps = {
  seed: number;
  map: MapOptions;
  className?: string;
};

const SCALE = 0.4;
const NO_HEARTS = { 1: { lives: 0, maxLives: 0 }, 2: { lives: 0, maxLives: 0 } };

/** A still, small picture of a star map, drawn the way the game draws it (black holes only show through lensing). */
export const MapPreview = ({ seed, map, className }: MapPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { bodyCount, blackHoleChance } = map;

  useEffect(() => {
    let cancelled = false;
    const bodies = generateGravitationalBodies(initialPlanets, createRandom(seed), { bodyCount, blackHoleChance });
    const sources = [...new Set([...bodies, ...Object.values(initialPlanets)].flatMap(b => (b.sprite ? [b.sprite] : [])))];

    Promise.all([loadImageOnce(starscapeImage), ...sources.map(loadImageOnce)]).then(([background, ...images]) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (cancelled || !ctx) return;
      const sprites: SpriteCache = Object.fromEntries(sources.map((src, i) => [src, images[i]]));
      const full = createStaticLayer(background, bodies);
      const fullCtx = full.getContext('2d');
      if (!fullCtx) return;
      drawGravityBodies(fullCtx, bodies, sprites, 1, 0);
      drawPlanets(fullCtx, initialPlanets, [], sprites, NO_HEARTS, { bodies, time: 0 });
      ctx.drawImage(full, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }).catch(() => {
      // Without images the preview stays dark; the tier and reward still show
    });

    return () => { cancelled = true; };
  }, [seed, bodyCount, blackHoleChance]);

  return (
    <canvas
      ref={canvasRef}
      width={Math.round(CANVAS_WIDTH * SCALE)}
      height={Math.round(CANVAS_HEIGHT * SCALE)}
      className={`block w-full h-auto bg-[#000814] ${className ?? ''}`}
      aria-hidden="true"
    />
  );
};
