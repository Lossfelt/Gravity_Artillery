import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Planet, GravityBody, Projectile, ExplosionParticle, PlanetFragment, GameStats } from '../types/game';
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
import { createExplosion } from '../utils/createExplosion';
import { createPlanetFragments } from '../utils/createPlanetFragments';

type UseGravityGameProps = {
  onExplosion?: () => void;
};

export const useGravityGame = ({ onExplosion }: UseGravityGameProps = {}) => {
  const [player1Angle, setPlayer1Angle] = useState(0);
  const [player2Angle, setPlayer2Angle] = useState(180);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    player1: { lives: 3 },
    player2: { lives: 3 }
  });
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastParticleTimeRef = useRef<number>(0);
  const lastFragmentTimeRef = useRef<number>(0);

  const [planets] = useState<{ player1: Planet; player2: Planet }>(initialPlanets);
  const [gravitationalBodies, setGravitationalBodies] = useState<GravityBody[]>(() =>
    generateGravitationalBodies(initialPlanets)
  );
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]);
  const [planetFragments, setPlanetFragments] = useState<PlanetFragment[]>([]);
  const [destroyedPlanets, setDestroyedPlanets] = useState<Set<1 | 2>>(new Set());

  const resetProjectiles = useCallback(() => setProjectiles([]), []);

  const startGame = useCallback(() => {
    const angleRad1 = (player1Angle * Math.PI) / 180;
    const angleRad2 = (player2Angle * Math.PI) / 180;

    // Reset delta time tracking for new game
    lastFrameTimeRef.current = null;
    lastParticleTimeRef.current = 0;
    lastFragmentTimeRef.current = 0;

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

  // Animate explosion particles
  useEffect(() => {
    if (explosionParticles.length === 0) return;

    const animateParticles = (currentTime: number) => {
      const deltaTime = lastParticleTimeRef.current
        ? Math.min((currentTime - lastParticleTimeRef.current) / 16.67, 2)
        : 1;
      lastParticleTimeRef.current = currentTime;

      setExplosionParticles(prevParticles => {
        return prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx * deltaTime,
            y: particle.y + particle.vy * deltaTime,
            life: particle.life - 1 * deltaTime
          }))
          .filter(particle => particle.life > 0);
      });
    };

    const particleAnimRef = requestAnimationFrame(animateParticles);

    return () => {
      cancelAnimationFrame(particleAnimRef);
    };
  }, [explosionParticles]);

  // Animate planet fragments
  useEffect(() => {
    if (planetFragments.length === 0) return;

    const animateFragments = (currentTime: number) => {
      const deltaTime = lastFragmentTimeRef.current
        ? Math.min((currentTime - lastFragmentTimeRef.current) / 16.67, 2)
        : 1;
      lastFragmentTimeRef.current = currentTime;

      setPlanetFragments(prevFragments => {
        return prevFragments
          .map(fragment => ({
            ...fragment,
            x: fragment.x + fragment.vx * deltaTime,
            y: fragment.y + fragment.vy * deltaTime,
            rotation: fragment.rotation + fragment.rotationSpeed * deltaTime
          }))
          .filter(fragment => {
            // Remove fragments that are far off screen
            return fragment.x > -100 && fragment.x < CANVAS_WIDTH + 100 &&
                   fragment.y > -100 && fragment.y < CANVAS_HEIGHT + 100;
          });
      });
    };

    const fragmentAnimRef = requestAnimationFrame(animateFragments);

    return () => {
      cancelAnimationFrame(fragmentAnimRef);
    };
  }, [planetFragments]);

  useEffect(() => {
    if (gameState !== 'firing') return;

    // Track which players have hit their targets (outside animate to persist)
    let player1Hit = false;
    let player2Hit = false;
    // Track which planets have been destroyed in this animation cycle to prevent duplicates
    const localDestroyedPlanets = new Set(destroyedPlanets);

    const animate = (currentTime: number) => {
      // Calculate delta time (time since last frame) in seconds
      // Target 60 FPS as baseline (16.67ms per frame)
      const deltaTime = lastFrameTimeRef.current
        ? Math.min((currentTime - lastFrameTimeRef.current) / 16.67, 2) // Cap at 2x to prevent huge jumps
        : 1;
      lastFrameTimeRef.current = currentTime;

      setProjectiles(prevProjectiles => {
        const updated = prevProjectiles.map(proj => {
          if (!proj.active) return proj;

          const { ax, ay } = calculateGravity(proj.x, proj.y, gravitationalBodies);

          const newVx = proj.vx + ax * 0.1 * deltaTime;
          const newVy = proj.vy + ay * 0.1 * deltaTime;
          const newX = proj.x + newVx * deltaTime;
          const newY = proj.y + newVy * deltaTime;

          if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
            return { ...proj, active: false };
          }

          const enemyPlanet = proj.player === 1 ? planets.player2 : planets.player1;
          const enemyPlayerNumber = proj.player === 1 ? 2 : 1;

          // Only create fragments if this planet hasn't been destroyed yet
          if (!localDestroyedPlanets.has(enemyPlayerNumber as 1 | 2) &&
              checkCollision({ x: newX, y: newY }, enemyPlanet, PLANET_RADIUS)) {
            // Mark that this player hit, but don't end the game yet
            if (proj.player === 1) player1Hit = true;
            if (proj.player === 2) player2Hit = true;

            // Mark planet as destroyed locally to prevent duplicate fragments in same cycle
            localDestroyedPlanets.add(enemyPlayerNumber as 1 | 2);

            // Play explosion sound and create explosion particles
            onExplosion?.();
            setExplosionParticles(prev => [...prev, ...createExplosion(enemyPlanet.x, enemyPlanet.y)]);

            // Create planet fragments and mark planet as destroyed
            setPlanetFragments(prev => [...prev, ...createPlanetFragments(enemyPlanet)]);
            setDestroyedPlanets(prev => new Set(prev).add(enemyPlayerNumber as 1 | 2));

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
          // Determine the winner based on who hit their target
          if (player1Hit && player2Hit) {
            // Both hit - reduce both players' lives
            setGameStats(prev => {
              const newPlayer1Lives = prev.player1.lives - 1;
              const newPlayer2Lives = prev.player2.lives - 1;

              // Check if either player lost all lives
              // Use setTimeout to delay showing game over screen by 2 seconds
              setTimeout(() => {
                if (newPlayer1Lives <= 0 && newPlayer2Lives <= 0) {
                  setWinner('draw');
                } else if (newPlayer1Lives <= 0) {
                  setWinner(2);
                } else if (newPlayer2Lives <= 0) {
                  setWinner(1);
                } else {
                  // Both still have lives, continue playing
                  setWinner(null);
                }
              }, 2000);

              return {
                player1: { lives: Math.max(0, newPlayer1Lives) },
                player2: { lives: Math.max(0, newPlayer2Lives) }
              };
            });
            setGameState('gameover');
            setPlayer1Ready(false);
            setPlayer2Ready(false);
          } else if (player1Hit) {
            // Only player 1 hit - reduce player 2's lives
            setGameStats(prev => {
              const newPlayer2Lives = prev.player2.lives - 1;

              // Use setTimeout to delay showing game over screen by 2 seconds
              setTimeout(() => {
                if (newPlayer2Lives <= 0) {
                  setWinner(1); // Player 1 wins the match
                } else {
                  setWinner(null); // Continue to next round
                }
              }, 2000);

              return {
                ...prev,
                player2: { lives: Math.max(0, newPlayer2Lives) }
              };
            });
            setGameState('gameover');
            setPlayer1Ready(false);
            setPlayer2Ready(false);
          } else if (player2Hit) {
            // Only player 2 hit - reduce player 1's lives
            setGameStats(prev => {
              const newPlayer1Lives = prev.player1.lives - 1;

              // Use setTimeout to delay showing game over screen by 2 seconds
              setTimeout(() => {
                if (newPlayer1Lives <= 0) {
                  setWinner(2); // Player 2 wins the match
                } else {
                  setWinner(null); // Continue to next round
                }
              }, 2000);

              return {
                ...prev,
                player1: { lives: Math.max(0, newPlayer1Lives) }
              };
            });
            setGameState('gameover');
            setPlayer1Ready(false);
            setPlayer2Ready(false);
          } else {
            // Neither hit - both missed (retry with same setup)
            // Return to setup immediately, keep trails visible until next fire
            setWinner(null);
            setGameState('setup');
            setPlayer1Ready(false);
            setPlayer2Ready(false);
            // Projectiles are kept to show trails from previous attempt
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

    // Reset delta time tracking
    lastFrameTimeRef.current = null;
    lastParticleTimeRef.current = 0;
    lastFragmentTimeRef.current = 0;

    // Always reset angles and regenerate bodies when coming from gameover
    // (This function is only called from gameover state, which means someone hit)
    setPlayer1Angle(0);
    setPlayer2Angle(180);
    setGravitationalBodies(generateGravitationalBodies(planets));

    // Reset lives if someone won the match (not just a round)
    setGameStats(prev => {
      const shouldResetLives = prev.player1.lives <= 0 || prev.player2.lives <= 0;
      if (shouldResetLives) {
        return {
          player1: { lives: 3 },
          player2: { lives: 3 }
        };
      }
      return prev;
    });

    setGameState('setup');
    setWinner(null);
    setPlayer1Ready(false);
    setPlayer2Ready(false);
    resetProjectiles();
    setExplosionParticles([]);
    setPlanetFragments([]);
    setDestroyedPlanets(new Set());
  }, [planets, resetProjectiles]);

  // Handle ready state transitions
  useEffect(() => {
    if (player1Ready && player2Ready) {
      if (gameState === 'setup') {
        startGame();
      } else if (gameState === 'gameover') {
        resetGame();
      }
    }
  }, [player1Ready, player2Ready, gameState, startGame, resetGame]);

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
    explosionParticles,
    planetFragments,
    destroyedPlanets,
    gameState,
    winner,
    gameStats
  };
};
