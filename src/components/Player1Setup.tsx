type Player1SetupProps = {
  player1Angle: number;
  setPlayer1Angle: (value: number) => void;
  player1Ready: boolean;
  togglePlayer1Ready: () => void;
};

export const Player1Setup = ({
  player1Angle,
  setPlayer1Angle,
  player1Ready,
  togglePlayer1Ready
}: Player1SetupProps) => (
  <div className="bg-blue-900 p-6 rounded-lg">
    <h2 className="text-xl font-bold text-white mb-3">Player 1 (Blue)</h2>
    <div className="mb-3">
      <label className="text-white block mb-2">Angle: {player1Angle}&deg;</label>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setPlayer1Angle(Math.max(-90, player1Angle - 1))}
            disabled={player1Ready}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
          >
            &uarr;
          </button>
          <div style={{ width: '32px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="range"
              min="-90"
              max="90"
              value={player1Angle}
              onChange={(e) => setPlayer1Angle(Number(e.target.value))}
              disabled={player1Ready}
              style={{
                width: '150px',
                transform: 'rotate(90deg)',
                transformOrigin: 'center center'
              }}
            />
          </div>
          <button
            onClick={() => setPlayer1Angle(Math.min(90, player1Angle + 1))}
            disabled={player1Ready}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1 px-3 rounded"
          >
            &darr;
          </button>
        </div>
      </div>
    </div>
    <button
      onClick={togglePlayer1Ready}
      className={`w-full py-2 px-4 rounded font-bold text-white ${
        player1Ready ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {player1Ready ? 'Ready!' : 'Ready?'}
    </button>
  </div>
);