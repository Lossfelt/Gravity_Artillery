import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import backgroundMusic from '../assets/sounds/Space_Harmony.mp3';
import { SoundEngine } from '../audio/soundEngine';
import { humIntensity } from '../audio/spatial';
import { GravityBody, Simulation } from '../types/game';
import { SimulationSounds } from './useSimulation';

/**
 * Background music plus the sound effects. Audio can only start after a user
 * gesture, so startAudio must be called from a click.
 */
export const useSoundEffects = () => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);
  const engine = useMemo(() => new SoundEngine(), []);

  useEffect(() => {
    const music = new Audio(backgroundMusic);
    music.loop = true;
    music.volume = 0.3;
    musicRef.current = music;
    return () => {
      music.pause();
      musicRef.current = null;
    };
  }, []);

  // Effects pause while the tab is hidden, so a hum never hangs in the background
  useEffect(() => {
    const onVisibility = () => engine.setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [engine]);

  const startAudio = useCallback(async () => {
    engine.unlock();
    if (musicStartedRef.current) return;
    try {
      await musicRef.current?.play();
      musicStartedRef.current = true;
    } catch (error) {
      console.warn('Could not start music:', error);
    }
  }, [engine]);

  const sounds: SimulationSounds = useMemo(() => ({
    onLaunch: x => engine.playLaunch(x),
    onExplosion: (x, decisive) => engine.playExplosion(x, decisive)
  }), [engine]);

  return { engine, sounds, startAudio };
};

/** A deep hum that swells while a projectile passes close to a heavy mass. */
export const useGravityHum = (
  engine: SoundEngine,
  simulationRef: RefObject<Simulation>,
  bodies: GravityBody[]
) => {
  const bodiesRef = useRef(bodies);
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const voices = simulationRef.current.projectiles.map(projectile => ({
        intensity: humIntensity(projectile, bodiesRef.current),
        x: projectile.x
      }));
      engine.updateHum(voices);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      engine.updateHum([]);
    };
  }, [engine, simulationRef]);
};
