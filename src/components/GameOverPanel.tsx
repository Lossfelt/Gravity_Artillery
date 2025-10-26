type GameOverPanelProps = {
  winner: 1 | 2 | null;
  onReset: () => void;
};

export const GameOverPanel = ({ winner, onReset }: GameOverPanelProps) => (
  <div className="bg-gray-800 p-6 rounded-lg text-center">
    <h2 className="text-3xl font-bold text-white mb-4">
      {winner ? `Player ${winner} Wins!` : 'Both Missed!'}
    </h2>
    <button
      onClick={onReset}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
    >
      Play Again
    </button>
  </div>
);
