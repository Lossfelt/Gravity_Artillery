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

    // --- Draw all bodies (planets and gravitational) ---
    const allBodies = [...Object.values(planets), ...gravitationalBodies];

    allBodies.forEach(body => {
      if ('type' in body && body.type === 'blackhole') return; // Still don't render black holes

      const sprite = body.sprite ? spriteCache[body.sprite] : null;

      if (sprite) {
        // Draw sprite
        const radius = body.radius;
        ctx.drawImage(sprite, body.x - radius, body.y - radius, radius * 2, radius * 2);
      } else {
        // Fallback to drawing a circle
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
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
    spriteCache
  ]);
};