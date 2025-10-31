import { useEffect, useRef } from 'react';
import backgroundMusic from '../assets/sounds/Space_Harmony.mp3';
import explosionSound from '../assets/sounds/Spaceexplosion.mp3';

export const useSoundEffects = () => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const explosionRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    musicRef.current = new Audio(backgroundMusic);
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3; // Adjust volume as needed

    explosionRef.current = new Audio(explosionSound);
    explosionRef.current.volume = 0.5; // Adjust volume as needed

    // Start playing background music
    const playMusic = async () => {
      try {
        await musicRef.current?.play();
      } catch (error) {
        console.log('Auto-play was prevented. User interaction required.');
      }
    };

    playMusic();

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

  const playExplosion = () => {
    if (explosionRef.current) {
      explosionRef.current.currentTime = 0;
      explosionRef.current.play().catch(error => {
        console.log('Could not play explosion sound:', error);
      });
    }
  };

  return { playExplosion };
};
