import { GameState } from '../types/game';

type Player2SetupProps = {
  player2Angle: number;
  setPlayer2Angle: (value: number) => void;
  player2Ready: boolean;
  togglePlayer2Ready: () => void;
  gameState: GameState;
};

export const Player2Setup = ({
  player2Angle,
  setPlayer2Angle,
  player2Ready,
  togglePlayer2Ready,
  gameState
}: Player2SetupProps) => {
  // Display angle as mirrored (180° = 0°, so it matches Player 1's perspective, and * -1 so that up is the same)
  const displayAngle = (player2Angle - 180) * -1;

  // Determine button text based on game state
  const getButtonText = () => {
    if (gameState === 'gameover') {
      return player2Ready ? 'Ready!' : 'Next';
    }
    return player2Ready ? 'Ready!' : 'Fire!';
  };

  return (
    <div className="bg-red-900 p-4 md:p-6 rounded-lg w-full md:w-fit">
      <h2 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Player 2</h2>
      <div className="mb-6 md:mb-10">
        <label className="text-white text-sm md:text-base block mb-2">Angle: {displayAngle}&deg;</label>
        <div className="flex flex-col items-center gap-1 md:gap-2">
          <button
            onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 5))}
            disabled={player2Ready || gameState !== 'setup'}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-lg md:text-xl w-20 md:w-24"
          >
            ⏫
          </button>
          <button
            onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 1))}
            disabled={player2Ready || gameState !== 'setup'}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-base md:text-lg w-20 md:w-24"
          >
            🔼
          </button>
          <button
            onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 1))}
            disabled={player2Ready || gameState !== 'setup'}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-base md:text-lg w-20 md:w-24"
          >
            🔽
          </button>
          <button
            onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 5))}
            disabled={player2Ready || gameState !== 'setup'}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-lg md:text-xl w-20 md:w-24"
          >
            ⏬
          </button>
        </div>
      </div>
      <button
        onClick={togglePlayer2Ready}
        disabled={gameState === 'firing'}
        className={`w-full py-2 px-4 rounded font-bold text-sm md:text-base text-white ${
          player2Ready ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {getButtonText()}
      </button>
    </div>
  );
};