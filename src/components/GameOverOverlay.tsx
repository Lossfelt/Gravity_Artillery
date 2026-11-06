import { Winner } from '../game/gameReducer';

type GameOverOverlayProps = {
  winner: Exclude<Winner, null>;
  onPlayAgain: () => void;
};

export const GameOverOverlay = ({ winner, onPlayAgain }: GameOverOverlayProps) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg">
    <div className="text-center px-6 py-8">
      <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
        {winner === 'draw' ? 'MUTUAL DESTRUCTION!' : `PLAYER ${winner} WINS!`}
      </h2>
      <p className="text-lg md:text-xl text-gray-300 mb-6">
        {winner === 'draw'
          ? 'Planetary remnants scream silently through the uncaring void...'
          : 'Their civilization continues, on the backs of desolated systems.'}
      </p>
      <button
        onClick={onPlayAgain}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
      >
        Play Again
      </button>
    </div>
  </div>
);
