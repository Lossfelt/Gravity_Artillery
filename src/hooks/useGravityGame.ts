import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Planet, GravityBody, Projectile } from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLANET_RADIUS,
  PROJECTILE_SPEED,
  initialPlanets
} from '../constants/game';
import { calculateGravity } from '../utils/calculateGravity';
import { checkCollision } from '../utils/checkCollision';
import { generateGravitationalBodies } from '../utils/generateGravitationalBodies';

export const useGravityGame = () => {
  const [player1Angle, setPlayer1Angle] = useState(0);
  const [player2Angle, setPlayer2Angle] = useState(180);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const animationRef = useRef<number | null>(null);

  const [planets] = useState<{ player1: Planet; player2: Planet }>(initialPlanets);
  const [gravitationalBodies, setGravitationalBodies] = useState<GravityBody[]>(() =>
    generateGravitationalBodies(initialPlanets)
  );
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  const resetProjectiles = useCallback(() => setProjectiles([]), []);

  const startGame = useCallback(() => {
    const angleRad1 = (player1Angle * Math.PI) / 180;
    const angleRad2 = (player2Angle * Math.PI) / 180;

    setProjectiles([
      {
        x: planets.player1.x + PLANET_RADIUS,
        y: planets.player1.y,
        vx: Math.cos(angleRad1) * PROJECTILE_SPEED,
        vy: Math.sin(angleRad1) * PROJECTILE_SPEED,
        trail: [],
        player: 1,
        active: true
      },
      {
        x: planets.player2.x - PLANET_RADIUS,
        y: planets.player2.y,
        vx: Math.cos(angleRad2) * PROJECTILE_SPEED,
        vy: Math.sin(angleRad2) * PROJECTILE_SPEED,
        trail: [],
        player: 2,
        active: true
      }
    ]);

    setGameState('firing');
    setWinner(null);
  }, [planets, player1Angle, player2Angle]);

  useEffect(() => {
    if (player1Ready && player2Ready && gameState === 'setup') {
      startGame();
    }
  }, [player1Ready, player2Ready, gameState, startGame]);

  useEffect(() => {
    if (gameState !== 'firing') return;

    // Track which players have hit their targets (outside animate to persist)
    let player1Hit = false;
    let player2Hit = false;

    const animate = () => {
      setProjectiles(prevProjectiles => {
        const updated = prevProjectiles.map(proj => {
          if (!proj.active) return proj;

          const { ax, ay } = calculateGravity(proj.x, proj.y, gravitationalBodies);

          const newVx = proj.vx + ax * 0.1;
          const newVy = proj.vy + ay * 0.1;
          const newX = proj.x + newVx;
          const newY = proj.y + newVy;

          if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
            return { ...proj, active: false };
          }

          const enemyPlanet = proj.player === 1 ? planets.player2 : planets.player1;
          if (checkCollision({ x: newX, y: newY }, enemyPlanet, PLANET_RADIUS)) {
            // Mark that this player hit, but don't end the game yet
            if (proj.player === 1) player1Hit = true;
            if (proj.player === 2) player2Hit = true;
            return { ...proj, active: false };
          }

          const newTrail = [...proj.trail, { x: proj.x, y: proj.y }];

          return {
            ...proj,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            trail: newTrail
          };
        });

        // Only end the game when both projectiles are inactive
        if (updated.every(p => !p.active)) {
          setGameState('gameover');

          // Determine the winner based on who hit their target
          if (player1Hit && player2Hit) {
            // Both hit - it's a draw (new game)
            setWinner('draw');
          } else if (player1Hit) {
            // Only player 1 hit
            setWinner(1);
          } else if (player2Hit) {
            // Only player 2 hit
            setWinner(2);
          } else {
            // Neither hit - both missed (retry with same setup)
            setWinner(null);
          }
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gravitationalBodies, planets]);

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset angles and regenerate bodies if someone won or both hit (new game)
    // If both missed (winner === null), keep the same setup
    if (winner !== null) {
      setPlayer1Angle(0);
      setPlayer2Angle(180);
      setGravitationalBodies(generateGravitationalBodies(planets));
    }

    setGameState('setup');
    setWinner(null);
    setPlayer1Ready(false);
    setPlayer2Ready(false);
    resetProjectiles();
  }, [winner, planets, resetProjectiles]);

  const forceWin = useCallback(
    (player: 1 | 2) => {
      setWinner(player);
      setGameState('gameover');
    },
    []
  );

  const forceDraw = useCallback(() => {
    setWinner('draw');
    setGameState('gameover');
  }, []);

  return {
    player1Angle,
    setPlayer1Angle,
    player2Angle,
    setPlayer2Angle,
    player1Ready,
    setPlayer1Ready,
    player2Ready,
    setPlayer2Ready,
    planets,
    gravitationalBodies,
    projectiles,
    gameState,
    winner,
    resetGame,
    forceWin,
    forceDraw
  };
};
