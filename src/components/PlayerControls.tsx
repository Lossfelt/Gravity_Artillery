import { ReactNode } from 'react';
import { GameState } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import { toRelativeAngle } from '../game/aim';

type PlayerControlsProps = {
  player: PlayerNumber;
  angle: number;
  power: number;
  adjustAngle: (delta: number) => void;
  adjustPower: (delta: number) => void;
  ready: boolean;
  toggleReady: () => void;
  gameState: GameState;
  compact?: boolean;
  // Extra content under the Fire button, e.g. the opponent switch
  footer?: ReactNode;
};

// Full class names so Tailwind can find them
const THEME: Record<PlayerNumber, { panel: string; step: string; action: string }> = {
  1: { panel: 'bg-blue-900', step: 'bg-blue-700 hover:bg-blue-800', action: 'bg-blue-600 hover:bg-blue-700' },
  2: { panel: 'bg-red-900', step: 'bg-red-700 hover:bg-red-800', action: 'bg-red-600 hover:bg-red-700' }
};

// Negative steps aim up, positive aim down
const ANGLE_STEPS = [
  { delta: -5, label: '⏫', big: true },
  { delta: -1, label: '🔼', big: false },
  { delta: 1, label: '🔽', big: false },
  { delta: 5, label: '⏬', big: true }
];

// Two columns: decrease on the left, increase on the right
const POWER_STEPS = [
  { delta: -5, label: '−5' },
  { delta: 5, label: '+5' },
  { delta: -1, label: '−1' },
  { delta: 1, label: '+1' }
];

const angleButtonSize = (compact: boolean, big: boolean) => {
  if (compact) return `py-1 px-3 w-16 ${big ? 'text-base' : 'text-sm'}`;
  return `py-1.5 md:py-2 px-4 md:px-6 w-20 md:w-24 ${big ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`;
};

export const PlayerControls = ({
  player,
  angle,
  power,
  adjustAngle,
  adjustPower,
  ready,
  toggleReady,
  gameState,
  compact = false,
  footer
}: PlayerControlsProps) => {
  const theme = THEME[player];
  const locked = ready || gameState !== 'setup';
  const actionLabel = ready ? 'Ready!' : gameState === 'gameover' ? 'Next' : 'Fire!';
  const labelClass = `text-white block whitespace-nowrap ${compact ? 'text-xs mb-1' : 'text-sm md:text-base mb-2'}`;
  const stepClass = `${theme.step} disabled:bg-gray-600 text-white font-bold rounded`;

  return (
    <div className={`${theme.panel} rounded-lg w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-6'}`}>
      <h2 className={`font-bold text-white ${compact ? 'text-sm mb-1' : 'text-lg md:text-xl mb-2 md:mb-3'}`}>Player {player}</h2>

      <div className={compact ? 'mb-2' : 'mb-3 md:mb-4'}>
        <label className={labelClass}>Angle: {toRelativeAngle(player, angle)}&deg;</label>
        <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1 md:gap-2'}`}>
          {ANGLE_STEPS.map(step => (
            <button
              key={step.delta}
              onClick={() => adjustAngle(step.delta)}
              disabled={locked}
              className={`${stepClass} ${angleButtonSize(compact, step.big)}`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? 'mb-3' : 'mb-4 md:mb-6'}>
        <label className={labelClass}>Power: {power}%</label>
        <div className={`grid grid-cols-2 mx-auto ${compact ? 'gap-1 w-16' : 'gap-1 md:gap-2 w-20 md:w-24'}`}>
          {POWER_STEPS.map(step => (
            <button
              key={step.delta}
              onClick={() => adjustPower(step.delta)}
              disabled={locked}
              className={`${stepClass} ${compact ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={toggleReady}
        disabled={gameState === 'firing'}
        className={`w-full rounded font-bold text-white ${
          compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm md:text-base'
        } ${ready ? 'bg-green-600 hover:bg-green-700' : theme.action}`}
      >
        {actionLabel}
      </button>
      {footer}
    </div>
  );
};
