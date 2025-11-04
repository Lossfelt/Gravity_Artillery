import { GameState } from '../types/game';

type Player1SetupProps = {
  player1Angle: number;
  setPlayer1Angle: (value: number) => void;
  player1Ready: boolean;
  togglePlayer1Ready: () => void;
  gameState: GameState;
  compact?: boolean;
};

export const Player1Setup = ({
  player1Angle,
  setPlayer1Angle,
  player1Ready,
  togglePlayer1Ready,
  gameState,
  compact = false
}: Player1SetupProps) => {
  // Determine button text based on game state
  const getButtonText = () => {
    if (gameState === 'gameover') {
      return player1Ready ? 'Ready!' : 'Next';
    }
    return player1Ready ? 'Ready!' : 'Fire!';
  };

  return (
    <div className={`bg-blue-900 rounded-lg w-full md:w-fit ${compact ? 'p-2' : 'p-4 md:p-6'}`}>
      <h2 className={`font-bold text-white ${compact ? 'text-sm mb-1' : 'text-lg md:text-xl mb-2 md:mb-3'}`}>Player 1</h2>
      <div className={compact ? 'mb-6' : 'mb-6 md:mb-10'}>
        <label className={`text-white block ${compact ? 'text-xs mb-1' : 'text-sm md:text-base mb-2'}`}>Angle: {player1Angle}&deg;</label>
        <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1 md:gap-2'}`}>
          <button
            onClick={() => setPlayer1Angle(Math.max(-90, player1Angle - 5))}
            disabled={player1Ready || gameState !== 'setup'}
            className={`bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold rounded ${
              compact ? 'py-1 px-3 text-base w-16' : 'py-1.5 md:py-2 px-4 md:px-6 text-lg md:text-xl w-20 md:w-24'
            }`}
          >
            ⏫
          </button>
          <button
            onClick={() => setPlayer1Angle(Math.max(-90, player1Angle - 1))}
            disabled={player1Ready || gameState !== 'setup'}
            className={`bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold rounded ${
              compact ? 'py-1 px-3 text-sm w-16' : 'py-1.5 md:py-2 px-4 md:px-6 text-base md:text-lg w-20 md:w-24'
            }`}
          >
            🔼
          </button>
          <button
            onClick={() => setPlayer1Angle(Math.min(90, player1Angle + 1))}
            disabled={player1Ready || gameState !== 'setup'}
            className={`bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold rounded ${
              compact ? 'py-1 px-3 text-sm w-16' : 'py-1.5 md:py-2 px-4 md:px-6 text-base md:text-lg w-20 md:w-24'
            }`}
          >
            🔽
          </button>
          <button
            onClick={() => setPlayer1Angle(Math.min(90, player1Angle + 5))}
            disabled={player1Ready || gameState !== 'setup'}
            className={`bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold rounded ${
              compact ? 'py-1 px-3 text-base w-16' : 'py-1.5 md:py-2 px-4 md:px-6 text-lg md:text-xl w-20 md:w-24'
            }`}
          >
            ⏬
          </button>
        </div>
      </div>
      <button
        onClick={togglePlayer1Ready}
        disabled={gameState === 'firing'}
        className={`w-full rounded font-bold text-white ${
          compact ? 'py-1 px-2 text-xs' : 'py-2 px-4 text-sm md:text-base'
        } ${player1Ready ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
};