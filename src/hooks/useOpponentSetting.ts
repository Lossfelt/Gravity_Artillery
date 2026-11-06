import { useCallback, useState } from 'react';
import { Difficulty } from '../game/ai';

// null = human opponent, otherwise the computer's difficulty
export type OpponentSetting = Difficulty | null;

const STORAGE_KEY = 'gravity-artillery:opponent';
const VALID: Difficulty[] = ['easy', 'normal', 'hard'];

const load = (): OpponentSetting => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(value as Difficulty) ? (value as Difficulty) : null;
  } catch {
    return null;
  }
};

/** The chosen opponent, remembered between visits on this device. */
export const useOpponentSetting = () => {
  const [opponent, setOpponentState] = useState<OpponentSetting>(load);

  const setOpponent = useCallback((value: OpponentSetting) => {
    setOpponentState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ?? 'human');
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts this visit only
    }
  }, []);

  return [opponent, setOpponent] as const;
};
