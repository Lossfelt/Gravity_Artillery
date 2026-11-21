import { Difficulty } from '../game/ai';

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' }
];

export const difficultyLabel = (difficulty: Difficulty) =>
  DIFFICULTIES.find(d => d.value === difficulty)?.label ?? difficulty;
