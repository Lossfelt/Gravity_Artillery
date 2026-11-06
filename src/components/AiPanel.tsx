import { GameState } from '../types/game';
import { Difficulty } from '../game/ai';
import { toRelativeAngle } from '../game/aim';

type AiPanelProps = {
  angle: number;
  power: number;
  ready: boolean;
  gameState: GameState;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  onSwitchToHuman: () => void;
  compact?: boolean;
};

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' }
];

const statusText = (ready: boolean, gameState: GameState) => {
  if (gameState === 'firing') return 'Firing';
  if (ready) return 'Ready!';
  return gameState === 'setup' ? 'Thinking…' : 'Waiting';
};

/** Player 2's panel when the computer plays. Shows its aim and lets you pick difficulty. */
export const AiPanel = ({
  angle,
  power,
  ready,
  gameState,
  difficulty,
  setDifficulty,
  onSwitchToHuman,
  compact = false
}: AiPanelProps) => {
  const text = compact ? 'text-xs' : 'text-sm md:text-base';
  const locked = gameState === 'firing';

  return (
    <div className={`bg-red-900 rounded-lg w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-6'}`}>
      <h2 className={`font-bold text-white ${compact ? 'text-sm mb-1' : 'text-lg md:text-xl mb-2 md:mb-3'}`}>Computer</h2>

      <div className={`flex flex-col gap-1 ${compact ? 'mb-2' : 'mb-4'}`}>
        {DIFFICULTIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDifficulty(value)}
            disabled={locked}
            aria-pressed={difficulty === value}
            className={`rounded font-bold text-white disabled:opacity-60 ${compact ? 'py-0.5 px-2 text-xs' : 'py-1 px-3 text-sm'} ${
              difficulty === value ? 'bg-red-500' : 'bg-red-800 hover:bg-red-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className={`text-white whitespace-nowrap ${text}`}>Angle: {toRelativeAngle(2, angle)}&deg;</p>
      <p className={`text-white whitespace-nowrap ${text} ${compact ? 'mb-2' : 'mb-4'}`}>Power: {power}%</p>

      <p
        className={`w-full rounded font-bold text-white text-center ${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm md:text-base'} ${
          ready ? 'bg-green-600' : 'bg-red-700'
        }`}
        aria-live="polite"
      >
        {statusText(ready, gameState)}
      </p>

      <button
        onClick={onSwitchToHuman}
        disabled={locked}
        className={`w-full mt-2 text-red-200 underline disabled:opacity-60 ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        Play vs human
      </button>
    </div>
  );
};
