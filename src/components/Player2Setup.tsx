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
}: Player2SetupProps) => (
  <div className="bg-red-900 p-6 rounded-lg">
    <h2 className="text-xl font-bold text-white mb-3">Player 2 (Red)</h2>
    <div className="mb-3">
      <label className="text-white block mb-2">Angle: {player2Angle}&deg;</label>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setPlayer2Angle(Math.min(270, player2Angle + 1))}
            disabled={player2Ready}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
          >
            &uarr;
          </button>
          <div style={{ width: '32px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="range"
              min="90"
              max="270"
              value={player2Angle}
              onChange={(e) => setPlayer2Angle(Number(e.target.value))}
              disabled={player2Ready}
              style={{
                width: '150px',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center center'
              }}
            />
          </div>
          <button
            onClick={() => setPlayer2Angle(Math.max(90, player2Angle - 1))}
            disabled={player2Ready}
            className="bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
          >
            &darr;
          </button>
        </div>
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