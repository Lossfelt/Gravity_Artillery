type GameOverPanelProps = {
  winner: 1 | 2 | 'draw' | null;
  onReset: () => void;
};

export const GameOverPanel = ({ winner, onReset }: GameOverPanelProps) => (
  <div className="bg-gray-800 p-6 rounded-lg text-center">
    <h2 className="text-3xl font-bold text-white mb-4">
      {typeof winner === 'number'
        ? `Player ${winner} Wins!`
        : winner === 'draw'
          ? "It's a Draw!"
          : "Both Missed!"}
    </h2>
    <button
      onClick={onReset}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
    >
      {winner === null ? "Try Again" : "Play Again"}
    </button>
  </div>
);
