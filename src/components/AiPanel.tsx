import { GameState } from '../types/game';
import { Difficulty } from '../game/ai';
import { formatAim } from '../game/aim';
import { accentStyle } from './theme';
import { Check } from './icons';
import { DIFFICULTIES } from './difficulty';
import { Reward } from '../types/game';
import { RewardText } from './RewardText';

type AiPanelProps = {
  angle: number;
  ready: boolean;
  gameState: GameState;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  onSwitchToHuman: () => void;
  // In a campaign the opponent is fixed: shows e.g. "System 3/8 · Normal" instead of the choices
  campaignLabel?: string;
  // A campaign reward at stake: paid if the player hits this opponent on the current map
  bounty?: Reward | null;
  compact?: boolean;
};

const statusText = (ready: boolean, gameState: GameState) => {
  if (gameState === 'firing') return 'Firing';
  if (ready) return 'Ready!';
  return gameState === 'setup' ? 'Thinking…' : 'Waiting';
};

/** Player 2's panel when the computer plays. Shows its aim and lets you pick difficulty. */
export const AiPanel = ({
  angle,
  ready,
  gameState,
  difficulty,
  setDifficulty,
  onSwitchToHuman,
  campaignLabel,
  bounty,
  compact = false
}: AiPanelProps) => {
  const text = compact ? 'text-xs' : 'text-sm md:text-base';
  const locked = gameState === 'firing';

  return (
    <div style={accentStyle(2)} className={`panel w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-5'}`}>
      <h2 className={`panel-title ${compact ? 'text-xs mb-1.5 tracking-[0.04em] before:hidden' : 'text-sm md:text-base mb-3'}`}>Computer</h2>

      {campaignLabel ? (
        <p className={`chip btn w-full cursor-default font-normal ${compact ? 'mb-2 py-1.5 px-2 text-xs' : 'mb-4 py-1.5 px-3 text-sm'}`}>
          {campaignLabel}
        </p>
      ) : (
        <div className={`flex flex-col gap-1 ${compact ? 'mb-2' : 'mb-4'}`} role="group" aria-label="Difficulty">
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              disabled={locked}
              aria-pressed={difficulty === value}
              className={`btn btn-step ${compact ? 'min-h-9 px-2 text-sm' : 'py-1 px-3 text-sm'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {bounty && (
        <p className={`text-[#ffc446] ${compact ? '-mt-1 mb-2 text-[11px]' : '-mt-2 mb-4 text-xs'}`}>
          Bounty on hit: <RewardText reward={bounty} />
        </p>
      )}

      <p className={`readout ${text} ${compact ? 'mb-2' : 'mb-4'}`}>
        <span className="readout-label">Angle</span>
        <span className="readout-value">{formatAim(2, angle)}</span>
      </p>
      <p
        className={`btn flex w-full cursor-default ${ready ? 'btn-ready' : 'chip'} ${compact ? 'py-1.5 px-2 text-sm' : 'py-2 px-4 text-sm md:text-base'}`}
        aria-live="polite"
      >
        {ready && <Check />}
        {statusText(ready, gameState)}
      </p>

      {!campaignLabel && (
        <button
          onClick={onSwitchToHuman}
          disabled={locked}
          className={`link-btn block w-full ${compact ? 'mt-1 py-2 text-[11px]' : 'mt-2 text-xs'}`}
        >
          Play vs human
        </button>
      )}
    </div>
  );
};
