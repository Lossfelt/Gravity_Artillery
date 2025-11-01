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
  <div className="bg-blue-900 p-4 md:p-6 rounded-lg w-full md:w-fit">
    <h2 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Player 1</h2>
    <div className="mb-6 md:mb-10">
      <label className="text-white text-sm md:text-base block mb-2">Angle: {player1Angle}&deg;</label>
      <div className="flex flex-col items-center gap-1 md:gap-2">
        <button
          onClick={() => setPlayer1Angle(Math.max(-90, player1Angle - 5))}
          disabled={player1Ready}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-lg md:text-xl w-20 md:w-24"
        >
          ⏫
        </button>
        <button
          onClick={() => setPlayer1Angle(Math.max(-90, player1Angle - 1))}
          disabled={player1Ready}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-base md:text-lg w-20 md:w-24"
        >
          ▲
        </button>
        <button
          onClick={() => setPlayer1Angle(Math.min(90, player1Angle + 1))}
          disabled={player1Ready}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-base md:text-lg w-20 md:w-24"
        >
          ▼
        </button>
        <button
          onClick={() => setPlayer1Angle(Math.min(90, player1Angle + 5))}
          disabled={player1Ready}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-1.5 md:py-2 px-4 md:px-6 rounded text-lg md:text-xl w-20 md:w-24"
        >
          ⏬
        </button>
      </div>
    </div>
    <button
      onClick={togglePlayer1Ready}
      className={`w-full py-2 px-4 rounded font-bold text-sm md:text-base text-white ${
        player1Ready ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {player1Ready ? 'Ready!' : 'Ready?'}
    </button>
  </div>
);