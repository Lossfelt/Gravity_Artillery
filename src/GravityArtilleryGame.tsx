import { useRef } from 'react';
import { useGravityGame } from './hooks/useGravityGame';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useSoundEffects } from './hooks/useSoundEffects';
import { GameCanvas } from './components/GameCanvas';
import { GameOverPanel } from './components/GameOverPanel';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants/game';
import { Player1Setup } from './components/Player1Setup';
import { Player2Setup } from './components/Player2Setup';

const GravityArtilleryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playExplosion } = useSoundEffects();

  const {
    player1Angle,
    setPlayer1Angle,
    player2Angle,
    setPlayer2Angle,
    player1Ready,
    setPlayer1Ready,
    player2Ready,
    setPlayer2Ready,
    planets,
    gravitationalBodies,
    projectiles,
    gameState,
    winner,
    resetGame,
    forceWin,
    forceDraw
  } = useGravityGame({ onExplosion: playExplosion });

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    projectiles,
    gameState,
    player1Angle,
    player2Angle
  });

  const togglePlayer1Ready = () => setPlayer1Ready(prev => !prev);
  const togglePlayer2Ready = () => setPlayer2Ready(prev => !prev);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 p-4 pt-8">
      <h1 className="text-4xl font-bold text-white mb-8">Gravity Artillery</h1>

      <div className="flex flex-row items-center gap-4 min-h-[400px]">
        <div>
          {gameState === 'setup' && (
            <Player1Setup
              player1Angle={player1Angle}
              setPlayer1Angle={setPlayer1Angle}
              player1Ready={player1Ready}
              togglePlayer1Ready={togglePlayer1Ready}
            />
          )}
        </div>

        <GameCanvas canvasRef={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

        <div>
          {gameState === 'setup' && (
            <Player2Setup
              player2Angle={player2Angle}
              setPlayer2Angle={setPlayer2Angle}
              player2Ready={player2Ready}
              togglePlayer2Ready={togglePlayer2Ready}
            />
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-4 mt-4">
        <button
          onClick={() => forceWin(1)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          TEST: Player 1 Wins
        </button>
        <button
          onClick={() => forceWin(2)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          TEST: Player 2 Wins
        </button>
        <button
          onClick={forceDraw}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          TEST: Draw (Both Hit)
        </button>
      </div>

      {gameState === 'gameover' && <GameOverPanel winner={winner} onReset={resetGame} />}

      <p className="text-gray-400 text-sm mt-4 max-w-2xl text-center">
        Set your launch angle and click Ready. When both players are ready, projectiles will fire simultaneously.
        Gravitational bodies will bend your projectile&apos;s path. Hit the enemy planet to win!
      </p>

      <div className="text-gray-500 text-xs mt-6 text-center max-w-2xl">
        <p className="font-semibold mb-1">Lydkrediteringer:</p>
        <p>Musikk: www.purple-planet.com</p>
        <p>Lydeffekt: by freesound_community via Pixabay</p>
      </div>
    </div>
  );
};

export default GravityArtilleryGame;
