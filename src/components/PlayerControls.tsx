import { GameState } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import { toRelativeAngle } from '../game/aim';

type PlayerControlsProps = {
  player: PlayerNumber;
  angle: number;
  adjustAngle: (delta: number) => void;
  ready: boolean;
  toggleReady: () => void;
  gameState: GameState;
  compact?: boolean;
};

// Full class names so Tailwind can find them
const THEME: Record<PlayerNumber, { panel: string; step: string; action: string }> = {
  1: { panel: 'bg-blue-900', step: 'bg-blue-700 hover:bg-blue-800', action: 'bg-blue-600 hover:bg-blue-700' },
  2: { panel: 'bg-red-900', step: 'bg-red-700 hover:bg-red-800', action: 'bg-red-600 hover:bg-red-700' }
};

// Negative steps aim up, positive aim down
const STEPS = [
  { delta: -5, label: '⏫', big: true },
  { delta: -1, label: '🔼', big: false },
  { delta: 1, label: '🔽', big: false },
  { delta: 5, label: '⏬', big: true }
];

const stepSize = (compact: boolean, big: boolean) => {
  if (compact) return `py-1 px-3 w-16 ${big ? 'text-base' : 'text-sm'}`;
  return `py-1.5 md:py-2 px-4 md:px-6 w-20 md:w-24 ${big ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`;
};

export const PlayerControls = ({
  player,
  angle,
  adjustAngle,
  ready,
  toggleReady,
  gameState,
  compact = false
}: PlayerControlsProps) => {
  const theme = THEME[player];
  const actionLabel = ready ? 'Ready!' : gameState === 'gameover' ? 'Next' : 'Fire!';

  return (
    <div className={`${theme.panel} rounded-lg w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-6'}`}>
      <h2 className={`font-bold text-white ${compact ? 'text-sm mb-1' : 'text-lg md:text-xl mb-2 md:mb-3'}`}>Player {player}</h2>
      <div className={compact ? 'mb-6' : 'mb-6 md:mb-10'}>
        <label className={`text-white block ${compact ? 'text-xs mb-1' : 'text-sm md:text-base mb-2'}`}>
          Angle: {toRelativeAngle(player, angle)}&deg;
        </label>
        <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1 md:gap-2'}`}>
          {STEPS.map(step => (
            <button
              key={step.delta}
              onClick={() => adjustAngle(step.delta)}
              disabled={ready || gameState !== 'setup'}
              className={`${theme.step} disabled:bg-gray-600 text-white font-bold rounded ${stepSize(compact, step.big)}`}
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
    </div>
  );
};
