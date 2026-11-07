import { CSSProperties } from 'react';
import { Winner } from '../game/gameReducer';
import { accentStyle } from './theme';
import { NextArrow } from './icons';

type GameOverOverlayProps = {
  winner: Exclude<Winner, null>;
  onPlayAgain: () => void;
};

// A draw has no winning colour, so it uses a neutral violet
const DRAW_ACCENT = { '--accent': '#9b7bff' } as CSSProperties;

export const GameOverOverlay = ({ winner, onPlayAgain }: GameOverOverlayProps) => (
  <div
    style={winner === 'draw' ? DRAW_ACCENT : accentStyle(winner)}
    className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg"
  >
    <div className="text-center px-6 py-8">
      <h2
        className="text-3xl md:text-6xl font-bold tracking-[0.08em] uppercase mb-4"
        style={{ textShadow: '0 0 24px var(--accent)' }}
      >
        {winner === 'draw' ? 'Mutual destruction!' : `Player ${winner} wins!`}
      </h2>
      <p className="text-base md:text-xl text-[var(--ink-dim)] mb-6">
        {winner === 'draw'
          ? 'Planetary remnants scream silently through the uncaring void...'
          : 'Their civilization continues, on the backs of desolated systems.'}
      </p>
      <button onClick={onPlayAgain} className="btn btn-primary py-3 px-6 text-lg">
        Play again<NextArrow />
      </button>
    </div>
  </div>
);
