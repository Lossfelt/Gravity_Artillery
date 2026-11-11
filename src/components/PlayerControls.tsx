import { ReactNode, useState } from 'react';
import { GameState } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import { formatAim } from '../game/aim';
import { accentStyle } from './theme';
import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Crosshair, NextArrow } from './icons';

type PlayerControlsProps = {
  player: PlayerNumber;
  angle: number;
  adjustAngle: (delta: number) => void;
  ready: boolean;
  toggleReady: () => void;
  gameState: GameState;
  compact?: boolean;
  // Extra content under the Fire button, e.g. the opponent switch
  footer?: ReactNode;
};

// Fine aim swaps the step sizes, so the same four buttons cover both big
// moves and the last adjustment
const STEP_SIZES = { normal: { big: 5, small: 1 }, fine: { big: 1, small: 0.1 } };

// Negative steps aim up, positive aim down
const angleSteps = (fine: boolean) => {
  const { big, small } = STEP_SIZES[fine ? 'fine' : 'normal'];
  return [
    { key: 'up-big', delta: -big, icon: <ChevronsUp />, label: `Aim up ${big}°` },
    { key: 'up-small', delta: -small, icon: <ChevronUp />, label: `Aim up ${small}°` },
    { key: 'down-small', delta: small, icon: <ChevronDown />, label: `Aim down ${small}°` },
    { key: 'down-big', delta: big, icon: <ChevronsDown />, label: `Aim down ${big}°` }
  ];
};

const actionContent = (ready: boolean, gameState: GameState) => {
  if (ready) return <><Check />Ready!</>;
  if (gameState === 'gameover') return <>Next<NextArrow /></>;
  return <><Crosshair />Fire!</>;
};

export const PlayerControls = ({
  player,
  angle,
  adjustAngle,
  ready,
  toggleReady,
  gameState,
  compact = false,
  footer
}: PlayerControlsProps) => {
  const locked = ready || gameState !== 'setup';
  const text = compact ? 'text-xs' : 'text-sm md:text-base';
  const width = compact ? 'w-16' : 'w-20 md:w-24';
  const [fine, setFine] = useState(false);

  return (
    <div style={accentStyle(player)} className={`panel w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-5'}`}>
      <h2 className={`panel-title ${compact ? 'text-xs mb-1.5 tracking-[0.04em] before:hidden' : 'text-sm md:text-base mb-3'}`}>Player {player}</h2>

      <div className={compact ? 'mb-2' : 'mb-4 md:mb-5'}>
        <p className={`readout ${text} ${compact ? 'mb-1' : 'mb-2'}`}>
          <span className="readout-label">Angle</span>
          <span className="readout-value">{formatAim(player, angle)}</span>
        </p>
        {/* Compact: a 2x2 grid (up on top, down below) to save height on a phone held sideways */}
        <div className={compact ? `grid grid-cols-2 gap-1 mx-auto ${width}` : 'flex flex-col items-center gap-1 md:gap-1.5'}>
          {angleSteps(fine).map(step => (
            <button
              key={step.key}
              onClick={() => adjustAngle(step.delta)}
              disabled={locked}
              aria-label={step.label}
              className={`btn btn-step ${compact ? 'py-1 text-sm' : `${width} py-1.5 md:py-2 text-base md:text-lg`}`}
            >
              {step.icon}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFine(!fine)}
          disabled={locked}
          aria-pressed={fine}
          title="Steps of 1° and 0.1° instead of 5° and 1°"
          className={`btn btn-step block mx-auto ${width} ${compact ? 'mt-1 py-0.5 text-[10px]' : 'mt-1.5 md:mt-2 py-1 text-xs'}`}
        >
          Fine 0.1°
        </button>
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
