import { RefObject, useEffect } from 'react';
import { GameState, GravityBody, Planet, Projectile } from '../types/game';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PLANET_RADIUS } from '../constants/game';

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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 117) % CANVAS_WIDTH;
      const y = (i * 211) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    gravitationalBodies.forEach(body => {
      // Skip rendering black holes - they are invisible
      if (body.type === 'blackhole') {
        return;
      }

      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(planets.player1.x, planets.player1.y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = planets.player1.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(planets.player2.x, planets.player2.y, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = planets.player2.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

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
  }, [canvasRef, planets, gravitationalBodies, projectiles, gameState, player1Angle, player2Angle]);
};
