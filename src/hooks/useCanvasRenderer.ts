import { RefObject, useEffect, useState } from 'react';
import { GameState, GravityBody, Planet, Projectile } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game';
import starscapeImage from '../assets/images/Starscape.png';

type Params = {
  canvasRef: RefObject<HTMLCanvasElement>;
  planets: { player1: Planet; player2: Planet };
  gravitationalBodies: GravityBody[];
  projectiles: Projectile[];
  gameState: GameState;
  player1Angle: number;
  player2Angle: number;
};

export const useCanvasRenderer = ({
  canvasRef,
  planets,
  gravitationalBodies,
  projectiles,
  gameState,
  player1Angle,
  player2Angle
}: Params) => {
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [spriteCache, setSpriteCache] = useState<Record<string, HTMLImageElement>>({});
  const [animationTime, setAnimationTime] = useState(0);

  // Animation loop for pulsing glow effect
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setAnimationTime(prev => prev + 0.02);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.src = starscapeImage;
    img.onload = () => {
      setBackgroundImage(img);
    };
  }, []);

  // Load all sprites for planets and gravitational bodies
  useEffect(() => {
    const allBodies = [...Object.values(planets), ...gravitationalBodies];
    const uniqueSpritePaths = [...new Set(allBodies.map(body => body.sprite).filter(Boolean))] as string[];

    uniqueSpritePaths.forEach(path => {
      if (!spriteCache[path]) {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          setSpriteCache(prevCache => ({ ...prevCache, [path]: img }));
        };
      }
    });
  }, [planets, gravitationalBodies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // --- Apply gravitational lensing effect for black holes ---
    const blackHoles = gravitationalBodies.filter(body => body.type === 'blackhole');
    blackHoles.forEach(blackHole => {
      const lensRadius = blackHole.radius * 3; // Area of effect
      const centerX = Math.round(blackHole.x);
      const centerY = Math.round(blackHole.y);

      // Calculate bounds for the affected area
      const x = Math.max(0, centerX - lensRadius);
      const y = Math.max(0, centerY - lensRadius);
      const width = Math.min(CANVAS_WIDTH - x, lensRadius * 2);
      const height = Math.min(CANVAS_HEIGHT - y, lensRadius * 2);

      if (width <= 0 || height <= 0) return;

      // Get the image data from the background
      const imageData = ctx.getImageData(x, y, width, height);
      const pixels = imageData.data;

      // Create a new image data for the distorted result
      const newImageData = ctx.createImageData(width, height);
      const newPixels = newImageData.data;

      // Apply radial displacement
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          // Calculate position relative to black hole center
          const worldX = x + px;
          const worldY = y + py;
          const dx = worldX - centerX;
          const dy = worldY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < lensRadius && distance > 0) {
            // Calculate displacement - stronger near the center
            const normalizedDist = distance / lensRadius;
            const displacementStrength = (1 - normalizedDist) * blackHole.radius * 1.9;
            const angle = Math.atan2(dy, dx);

            // Calculate source pixel (where to sample from)
            const sourceX = px + Math.cos(angle + Math.PI / 2) * displacementStrength;
            const sourceY = py + Math.sin(angle + Math.PI / 2) * displacementStrength;

            // Clamp and sample
            const sx = Math.max(0, Math.min(width - 1, Math.floor(sourceX)));
            const sy = Math.max(0, Math.min(height - 1, Math.floor(sourceY)));

            const sourceIndex = (sy * width + sx) * 4;
            const targetIndex = (py * width + px) * 4;

            // Copy pixel data
            newPixels[targetIndex] = pixels[sourceIndex];         // R
            newPixels[targetIndex + 1] = pixels[sourceIndex + 1]; // G
            newPixels[targetIndex + 2] = pixels[sourceIndex + 2]; // B
            newPixels[targetIndex + 3] = pixels[sourceIndex + 3]; // A

            // Darken pixels near the center
            const darkenFactor = 1 - (1 - normalizedDist) * 0.2;
            newPixels[targetIndex] *= darkenFactor;
            newPixels[targetIndex + 1] *= darkenFactor;
            newPixels[targetIndex + 2] *= darkenFactor;
          } else {
            // Outside lens radius, copy original
            const sourceIndex = (py * width + px) * 4;
            const targetIndex = (py * width + px) * 4;
            newPixels[targetIndex] = pixels[sourceIndex];
            newPixels[targetIndex + 1] = pixels[sourceIndex + 1];
            newPixels[targetIndex + 2] = pixels[sourceIndex + 2];
            newPixels[targetIndex + 3] = pixels[sourceIndex + 3];
          }
        }
      }

      // Put the distorted image back
      ctx.putImageData(newImageData, x, y);
    });

    // --- Draw gravitational bodies with glow effect ---
    gravitationalBodies.forEach(body => {
      if (body.type === 'blackhole') return; // Still don't render black holes

      // Calculate pulsing glow intensity
      const pulseValue = Math.sin(animationTime) * 0.3 + 0.7; // Oscillates between 0.4 and 1.0
      const glowIntensity = body.radius * 1.5 * pulseValue;

      ctx.save();

      // Add glow effect
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = body.color;

      const sprite = body.sprite ? spriteCache[body.sprite] : null;

      if (sprite) {
        // Draw sprite with glow
        const radius = body.radius;
        ctx.drawImage(sprite, body.x - radius, body.y - radius, radius * 2, radius * 2);
      } else {
        // Fallback to drawing a circle with glow
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
      }

      ctx.restore();
    });

    // --- Draw player planets (without glow) ---
    [planets.player1, planets.player2].forEach(planet => {
      const sprite = planet.sprite ? spriteCache[planet.sprite] : null;

      if (sprite) {
        // Draw sprite
        ctx.drawImage(sprite, planet.x - planet.radius, planet.y - planet.radius, planet.radius * 2, planet.radius * 2);
      } else {
        // Fallback to drawing a circle
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();
      }
    });
    

    // --- Draw aiming indicators ---
    if (gameState === 'setup') {
      const lineLength = 40;
      const angleRad1 = (player1Angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(planets.player1.x, planets.player1.y);
      ctx.lineTo(
        planets.player1.x + Math.cos(angleRad1) * lineLength,
        planets.player1.y + Math.sin(angleRad1) * lineLength
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const angleRad2 = (player2Angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(planets.player2.x, planets.player2.y);
      ctx.lineTo(
        planets.player2.x + Math.cos(angleRad2) * lineLength,
        planets.player2.y + Math.sin(angleRad2) * lineLength
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // --- Draw projectiles ---
    projectiles.forEach(proj => {
      ctx.strokeStyle = proj.player === 1 ? 'rgba(66, 135, 245, 0.6)' : 'rgba(245, 66, 66, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      proj.trail.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      if (proj.active) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = proj.player === 1 ? '#4287f5' : '#f54242';
        ctx.fill();
      }
    });
  }, [
    canvasRef,
    planets,
    gravitationalBodies,
    projectiles,
    gameState,
    player1Angle,
    player2Angle,
    backgroundImage,
    spriteCache,
    animationTime
  ]);
};