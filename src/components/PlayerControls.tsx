import { ReactNode } from 'react';
import { GameState } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import { toRelativeAngle } from '../game/aim';
import { accentStyle, powerFill } from './theme';
import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Crosshair, NextArrow } from './icons';

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

// Negative steps aim up, positive aim down
const ANGLE_STEPS = [
  { delta: -5, icon: <ChevronsUp />, label: 'Aim up 5°' },
  { delta: -1, icon: <ChevronUp />, label: 'Aim up 1°' },
  { delta: 1, icon: <ChevronDown />, label: 'Aim down 1°' },
  { delta: 5, icon: <ChevronsDown />, label: 'Aim down 5°' }
];

// Two columns: decrease on the left, increase on the right
const POWER_STEPS = [
  { delta: -5, label: '−5' },
  { delta: 5, label: '+5' },
  { delta: -1, label: '−1' },
  { delta: 1, label: '+1' }
];

const actionContent = (ready: boolean, gameState: GameState) => {
  if (ready) return <><Check />Ready!</>;
  if (gameState === 'gameover') return <>Next<NextArrow /></>;
  return <><Crosshair />Fire!</>;
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
  const locked = ready || gameState !== 'setup';
  const text = compact ? 'text-xs' : 'text-sm md:text-base';
  const width = compact ? 'w-16' : 'w-20 md:w-24';

  return (
    <div style={accentStyle(player)} className={`panel w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-5'}`}>
      <h2 className={`panel-title ${compact ? 'text-xs mb-1.5 tracking-[0.04em] before:hidden' : 'text-sm md:text-base mb-3'}`}>Player {player}</h2>

      <div className={compact ? 'mb-2' : 'mb-3 md:mb-4'}>
        <p className={`readout ${text} ${compact ? 'mb-1' : 'mb-2'}`}>
          <span className="readout-label">Angle</span>
          <span className="readout-value">{toRelativeAngle(player, angle)}&deg;</span>
        </p>
        {/* Compact: a 2x2 grid (up on top, down below) to save height on a phone held sideways */}
        <div className={compact ? `grid grid-cols-2 gap-1 mx-auto ${width}` : 'flex flex-col items-center gap-1 md:gap-1.5'}>
          {ANGLE_STEPS.map(step => (
            <button
              key={step.delta}
              onClick={() => adjustAngle(step.delta)}
              disabled={locked}
              aria-label={step.label}
              className={`btn btn-step ${compact ? 'py-1 text-sm' : `${width} py-1.5 md:py-2 text-base md:text-lg`}`}
            >
              {step.icon}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? 'mb-2' : 'mb-4 md:mb-5'}>
        <p className={`readout ${text} mb-1`}>
          <span className="readout-label">Power</span>
          <span className="readout-value">{power}%</span>
        </p>
        <div className={`meter ${compact ? 'mb-1.5' : 'mb-2'}`} aria-hidden="true">
          <span style={{ width: `${powerFill(power)}%` }} />
        </div>
        <div className={`grid grid-cols-2 mx-auto ${width} ${compact ? 'gap-1' : 'gap-1 md:gap-1.5'}`}>
          {POWER_STEPS.map(step => (
            <button
              key={step.delta}
              onClick={() => adjustPower(step.delta)}
              disabled={locked}
              aria-label={`Power ${step.label}`}
              className={`btn btn-step ${compact ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={toggleReady}
        disabled={gameState === 'firing'}
        className={`btn flex w-full ${ready ? 'btn-ready' : 'btn-primary'} ${compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm md:text-base'}`}
      >
        {actionContent(ready, gameState)}
      </button>
      {footer}
    </div>
  );
};
