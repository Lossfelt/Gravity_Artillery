import { GravityBody } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';
import { drawSpacetimeGrid } from './drawSpacetimeGrid';

/**
 * Bends the background around a black hole (gravitational lensing).
 * Reads pixels back from the canvas, which is very slow on mobile GPUs,
 * so it must only run when the static layer is rebuilt, never per frame.
 */
const applyLensing = (ctx: CanvasRenderingContext2D, blackHole: GravityBody) => {
  const lensRadius = blackHole.radius * 3; // Area of effect
  const centerX = Math.round(blackHole.x);
  const centerY = Math.round(blackHole.y);

  // Calculate bounds for the affected area
  const x = Math.max(0, centerX - lensRadius);
  const y = Math.max(0, centerY - lensRadius);
  const width = Math.min(CANVAS_WIDTH - x, lensRadius * 2);
  const height = Math.min(CANVAS_HEIGHT - y, lensRadius * 2);

  if (width <= 0 || height <= 0) return;

  const pixels = ctx.getImageData(x, y, width, height).data;
  const newImageData = ctx.createImageData(width, height);
  const newPixels = newImageData.data;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const dx = x + px - centerX;
      const dy = y + py - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetIndex = (py * width + px) * 4;

      if (distance < lensRadius && distance > 0) {
        // Calculate displacement - stronger near the center
        const normalizedDist = distance / lensRadius;
        const displacementStrength = (1 - normalizedDist) * blackHole.radius * 1.9;
        const angle = Math.atan2(dy, dx);

        // Calculate source pixel (where to sample from), clamped
        const sourceX = px + Math.cos(angle + Math.PI / 2) * displacementStrength;
        const sourceY = py + Math.sin(angle + Math.PI / 2) * displacementStrength;
        const sx = Math.max(0, Math.min(width - 1, Math.floor(sourceX)));
        const sy = Math.max(0, Math.min(height - 1, Math.floor(sourceY)));
        const sourceIndex = (sy * width + sx) * 4;

        // Copy pixel and darken near the center
        const darkenFactor = 1 - (1 - normalizedDist) * 0.2;
        newPixels[targetIndex] = pixels[sourceIndex] * darkenFactor;
        newPixels[targetIndex + 1] = pixels[sourceIndex + 1] * darkenFactor;
        newPixels[targetIndex + 2] = pixels[sourceIndex + 2] * darkenFactor;
        newPixels[targetIndex + 3] = pixels[sourceIndex + 3];
      } else {
        // Outside lens radius, copy original
        newPixels[targetIndex] = pixels[targetIndex];
        newPixels[targetIndex + 1] = pixels[targetIndex + 1];
        newPixels[targetIndex + 2] = pixels[targetIndex + 2];
        newPixels[targetIndex + 3] = pixels[targetIndex + 3];
      }
    }
  }

  ctx.putImageData(newImageData, x, y);
};

/**
 * Draws everything that does not move during a round (background, spacetime
 * grid and lensing)
 * into an offscreen canvas that can be blitted each frame with one drawImage.
 */
export const createStaticLayer = (
  background: HTMLImageElement | null,
  bodies: GravityBody[]
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  if (background) {
    ctx.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // The grid goes under the lensing, so black holes bend it as well
  drawSpacetimeGrid(ctx, bodies);
  bodies.filter(body => body.type === 'blackhole').forEach(blackHole => applyLensing(ctx, blackHole));
  return canvas;
};
