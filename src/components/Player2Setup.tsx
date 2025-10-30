type Player2SetupProps = {
  player2Angle: number;
  setPlayer2Angle: (value: number) => void;
  player2Ready: boolean;
  togglePlayer2Ready: () => void;
};

export const Player2Setup = ({
  player2Angle,
  setPlayer2Angle,
  player2Ready,
  togglePlayer2Ready
}: Player2SetupProps) => {
  // Display angle as mirrored (180° = 0°, so it matches Player 1's perspective, and * -1 so that up is the same)
  const displayAngle = (player2Angle - 180) * -1;

  return (
    <div className="bg-red-900 p-6 rounded-lg w-fit">
      <h2 className="text-xl font-bold text-white mb-3">Player 2</h2>
      <div className="mb-10">
        <label className="text-white block mb-2">Angle: {displayAngle}&deg;</label>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 5))}
          disabled={player2Ready}
          className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded text-xl w-24"
        >
          ⏫
        </button>
        <button
          onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 1))}
          disabled={player2Ready}
          className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded text-lg w-24"
        >
          ▲
        </button>
        <button
          onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 1))}
          disabled={player2Ready}
          className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded text-lg w-24"
        >
          ▼
        </button>
        <button
          onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 5))}
          disabled={player2Ready}
          className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded text-xl w-24"
        >
          ⏬
        </button>
      </div>
    </div>
    <button
      onClick={togglePlayer2Ready}
      className={`w-full py-2 px-4 rounded font-bold text-white ${
        player2Ready ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
      }`}
    >
      {player2Ready ? 'Ready!' : 'Ready?'}
    </button>
  </div>
  );
};