import { ReactNode, useState } from 'react';
import { Ammo, GameState, ShotKind } from '../types/game';
import { PlayerNumber } from '../game/gameReducer';
import { formatAim } from '../game/aim';
import { accentStyle } from './theme';
import { hasAmmo, nextShot, SHOT_INFO } from './shots';
import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Crosshair, NextArrow } from './icons';

type PlayerControlsProps = {
  player: PlayerNumber;
  angle: number;
  adjustAngle: (delta: number) => void;
  ready: boolean;
  toggleReady: () => void;
  gameState: GameState;
  compact?: boolean;
  // Changes with every new map; fine aim switches off when it does
  mapKey: number;
  // Extra content under the Fire button, e.g. the opponent switch
  footer?: ReactNode;
  // Special shots (campaign only); the selector shows while there are any
  ammo?: Ammo;
  shot?: ShotKind;
  selectShot?: (shot: ShotKind) => void;
};

// Fine aim swaps the step sizes, so the same four buttons cover both big
// moves and the last adjustment
const STEP_SIZES = { normal: { big: 5, small: 1 }, fine: { big: 1, small: 0.1 } };

// Negative steps aim up, positive aim down
const angleSteps = (fine: boolean) => {
  const { big, small } = STEP_SIZES[fine ? 'fine' : 'normal'];
  return [
    { key: 'up-big', delta: -big, size: big, icon: <ChevronsUp />, label: `Aim up ${big}°` },
    { key: 'up-small', delta: -small, size: small, icon: <ChevronUp />, label: `Aim up ${small}°` },
    { key: 'down-small', delta: small, size: small, icon: <ChevronDown />, label: `Aim down ${small}°` },
    { key: 'down-big', delta: big, size: big, icon: <ChevronsDown />, label: `Aim down ${big}°` }
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
  mapKey,
  footer,
  ammo,
  shot = 'standard',
  selectShot
}: PlayerControlsProps) => {
  const locked = ready || gameState !== 'setup';
  const text = compact ? 'text-xs' : 'text-sm md:text-base';
  // Compact: two 44 px columns, the usual minimum for a finger on a phone
  const width = compact ? 'w-[5.75rem]' : 'w-20 md:w-24';
  // The map fine aim was switched on for, so a new map starts without it
  const [fineMap, setFineMap] = useState<number | null>(null);
  const fine = fineMap === mapKey;

  return (
    <div style={accentStyle(player)} className={`panel w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-5'}`}>
      <h2 className={`panel-title ${compact ? 'text-xs mb-1.5 tracking-[0.04em] before:hidden' : 'text-sm md:text-base mb-3'}`}>Player {player}</h2>

      <div className={compact ? 'mb-2' : 'mb-4 md:mb-5'}>
        <p className={`readout ${text} ${compact ? 'mb-1' : 'mb-2'}`}>
          <span className="readout-label">Angle</span>
          <span className="readout-value">{formatAim(player, angle)}</span>
        </p>
        {/* Compact: a 2x2 grid (up on top, down below) to save height on a phone held sideways */}
        <div className={compact ? `grid grid-cols-2 gap-1.5 mx-auto ${width}` : 'flex flex-col items-center gap-1 md:gap-1.5'}>
          {angleSteps(fine).map(step => (
            <button
              key={step.key}
              onClick={() => adjustAngle(step.delta)}
              disabled={locked}
              aria-label={step.label}
              className={`btn btn-step ${fine ? 'btn-step-fine' : ''} ${compact ? 'h-11 flex-col !gap-0 text-base leading-none' : `${width} py-1.5 md:py-2 text-base md:text-lg`}`}
            >
              {step.icon}
              {/* The step size, so the mode shows on the buttons themselves */}
              <span className="step-size">{step.size}°</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setFineMap(fine ? null : mapKey)}
          disabled={locked}
          aria-pressed={fine}
          title="Steps of 1° and 0.1° instead of 5° and 1°. Switches off on a new map."
          className={`btn flex mx-auto ${width} ${fine ? 'btn-toggle-on' : 'btn-step'} ${compact ? 'mt-1.5 h-9 text-xs' : 'mt-1.5 md:mt-2 py-1 text-xs'}`}
        >
          {fine ? <><Check />Fine on</> : 'Fine 0.1°'}
        </button>
      </div>

      {ammo && selectShot && (hasAmmo(ammo) || shot !== 'standard') && (
        <button
          onClick={() => selectShot(nextShot(shot, ammo))}
          disabled={locked}
          aria-pressed={shot !== 'standard'}
          title={`${SHOT_INFO[shot].hint}. Tap to change.`}
          className={`btn btn-step flex w-full justify-between ${compact ? 'mb-1.5 h-9 px-2 text-xs' : 'mb-2 py-1.5 px-3 text-xs md:text-sm'}`}
        >
          <span className="font-normal text-[var(--ink-dim)]">{compact ? '' : 'Shot'}</span>
          <span>{SHOT_INFO[shot].label}{shot !== 'standard' && ` ×${ammo[shot]}`}</span>
        </button>
      )}

      <button
        onClick={toggleReady}
        disabled={gameState === 'firing'}
        className={`btn flex w-full ${ready ? 'btn-ready' : 'btn-primary'} ${compact ? 'h-10 px-2 text-sm' : 'py-2 px-4 text-sm md:text-base'}`}
      >
        {actionContent(ready, gameState)}
      </button>
      {footer}
    </div>
  );
};
