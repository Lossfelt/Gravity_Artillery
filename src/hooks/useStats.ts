import { useCallback, useState } from 'react';
import { parseStats, Stats } from '../game/stats';
import { loadJson, saveJson } from '../utils/storage';

const STORAGE_KEY = 'gravity-artillery:stats';

/** Statistics against the computer, saved on this device. */
export const useStats = () => {
  const [stats, setStats] = useState<Stats>(() => parseStats(loadJson(STORAGE_KEY)));

  // Saving inside the updater keeps two updates in a row from losing one. It
  // may run twice in development (StrictMode), which saves the same value twice.
  const update = useCallback((fn: (stats: Stats) => Stats) => {
    setStats(previous => {
      const next = fn(previous);
      saveJson(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { stats, update };
};
