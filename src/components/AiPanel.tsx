import { GameState } from '../types/game';
import { Difficulty } from '../game/ai';
import { toRelativeAngle } from '../game/aim';
import { accentStyle, powerFill } from './theme';
import { Check } from './icons';

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
    <div style={accentStyle(2)} className={`panel w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-5'}`}>
      <h2 className={`panel-title ${compact ? 'text-xs mb-1.5 tracking-[0.04em] before:hidden' : 'text-sm md:text-base mb-3'}`}>Computer</h2>

      <div className={`flex flex-col gap-1 ${compact ? 'mb-2' : 'mb-4'}`} role="group" aria-label="Difficulty">
        {DIFFICULTIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDifficulty(value)}
            disabled={locked}
            aria-pressed={difficulty === value}
            className={`btn btn-step ${compact ? 'py-0.5 px-2 text-xs' : 'py-1 px-3 text-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className={`readout ${text} mb-1`}>
        <span className="readout-label">Angle</span>
        <span className="readout-value">{toRelativeAngle(2, angle)}&deg;</span>
      </p>
      <p className={`readout ${text} mb-1`}>
        <span className="readout-label">Power</span>
        <span className="readout-value">{power}%</span>
      </p>
      <div className={`meter ${compact ? 'mb-2' : 'mb-4'}`} aria-hidden="true">
        <span style={{ width: `${powerFill(power)}%` }} />
      </div>

      <p
        className={`btn flex w-full cursor-default ${ready ? 'btn-ready' : 'chip'} ${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm md:text-base'}`}
        aria-live="polite"
      >
        {ready && <Check />}
        {statusText(ready, gameState)}
      </p>

      <button
        onClick={onSwitchToHuman}
        disabled={locked}
        className={`link-btn block w-full mt-2 ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        Play vs human
      </button>
    </div>
  );
};
