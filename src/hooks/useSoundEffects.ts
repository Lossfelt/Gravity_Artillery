import { useEffect, useRef, useCallback } from 'react';
import backgroundMusic from '../assets/sounds/Space_Harmony.mp3';
import explosionSound from '../assets/sounds/Spaceexplosion.mp3';

export const useSoundEffects = () => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const explosionRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);

  // Initialize audio elements
  useEffect(() => {
    musicRef.current = new Audio(backgroundMusic);
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3; // Adjust volume as needed

    explosionRef.current = new Audio(explosionSound);
    explosionRef.current.volume = 0.5; // Adjust volume as needed

    // Don't auto-play music - wait for user interaction

    // Cleanup
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      if (explosionRef.current) {
        explosionRef.current = null;
      }
    };
  }, []);

  const startMusic = useCallback(async () => {
    // Only start music once
    if (musicStartedRef.current) return;

    try {
      await musicRef.current?.play();
      musicStartedRef.current = true;
    } catch (error) {
      console.log('Could not start music:', error);
    }
  }, []);

  const playExplosion = () => {
    if (explosionRef.current) {
      explosionRef.current.currentTime = 0;
      explosionRef.current.play().catch(error => {
        console.log('Could not play explosion sound:', error);
      });
    }
  };

  return { playExplosion, startMusic };
};
