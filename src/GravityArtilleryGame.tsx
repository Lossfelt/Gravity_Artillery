import { useRef } from 'react';
import { useGravityGame } from './hooks/useGravityGame';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useResponsiveCanvas } from './hooks/useResponsiveCanvas';
import { useOrientation } from './hooks/useOrientation';
import { useIsMobile } from './hooks/useIsMobile';
import { GameCanvas } from './components/GameCanvas';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants/game';
import { Player1Setup } from './components/Player1Setup';
import { Player2Setup } from './components/Player2Setup';

const GravityArtilleryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playExplosion, startMusic } = useSoundEffects();
  const { width: displayWidth, height: displayHeight } = useResponsiveCanvas();
  const orientation = useOrientation();
  const isMobile = useIsMobile();

  const { model, planets, gravitationalBodies, simulationRef, setAngle, toggleReady, nextRound } =
    useGravityGame({ onExplosion: playExplosion });
  const { phase: gameState, winner } = model;
  const player1Angle = model.players[1].angle;
  const player2Angle = model.players[2].angle;
  const player1Ready = model.players[1].ready;
  const player2Ready = model.players[2].ready;

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    simulationRef,
    destroyed: model.destroyed,
    gameState,
    player1Angle,
    player2Angle,
    lives: { 1: model.players[1].lives, 2: model.players[2].lives }
  });

  const setPlayer1Angle = (angle: number) => setAngle(1, angle);
  const setPlayer2Angle = (angle: number) => setAngle(2, angle);
  // Music starts on the first button press (a user gesture, which mobile browsers require)
  const togglePlayer1Ready = () => { startMusic(); toggleReady(1); };
  const togglePlayer2Ready = () => { startMusic(); toggleReady(2); };
  const resetGame = nextRound;

  // Determine layout: controls on sides for desktop and mobile landscape, below for mobile portrait
  const controlsOnSides = !isMobile || orientation === 'landscape';
  const isMobileLandscape = isMobile && orientation === 'landscape';

  return (
    <div className={`flex flex-col items-center min-h-screen bg-gray-900 ${
      isMobileLandscape ? 'p-2 pt-1' : 'p-4 pt-4 md:pt-8'
    }`}>
      {/* Hide title in mobile landscape to save vertical space */}
      {!isMobileLandscape && (
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">Gravity Artillery</h1>
          <p className="text-xs md:text-sm text-gray-500 italic">a conflict in the Dark Forest</p>
        </div>
      )}

      <div className={`flex ${controlsOnSides ? 'flex-row' : 'flex-col'} items-center justify-center gap-4 w-full`}>
        {/* Player 1 controls on left side (desktop + mobile landscape) */}
        {controlsOnSides && (
          <div>
            {/* Always show controls when on sides to prevent layout jumping */}
            <Player1Setup
              player1Angle={player1Angle}
              setPlayer1Angle={setPlayer1Angle}
              player1Ready={player1Ready}
              togglePlayer1Ready={togglePlayer1Ready}
              gameState={gameState}
              compact={isMobileLandscape}
            />
          </div>
        )}

        {/* Canvas - shared between all layouts */}
        <div className={`flex flex-col items-center gap-4 ${controlsOnSides ? 'w-auto' : 'w-full'}`}>
          <div className="relative">
            <GameCanvas
              canvasRef={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
            />

            {/* Game Over Overlay */}
            {winner !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center px-6 py-8">
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    {winner === 'draw' ? 'MUTUAL DESTRUCTION!' : winner === 1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-300 mb-6">
                    {winner === 'draw'
                      ? 'Planetary remnants scream silently through the uncaring void...'
                      : `Their civilization continues, on the backs of desolated systems.`}
                  </p>
                  <button
                    onClick={resetGame}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile portrait only: both controls below canvas */}
          {!controlsOnSides && (
            <div className="flex flex-row gap-4 w-full px-2">
              <div className="flex-1">
                <Player1Setup
                  player1Angle={player1Angle}
                  setPlayer1Angle={setPlayer1Angle}
                  player1Ready={player1Ready}
                  togglePlayer1Ready={togglePlayer1Ready}
                  gameState={gameState}
                />
              </div>
              <div className="flex-1">
                <Player2Setup
                  player2Angle={player2Angle}
                  setPlayer2Angle={setPlayer2Angle}
                  player2Ready={player2Ready}
                  togglePlayer2Ready={togglePlayer2Ready}
                  gameState={gameState}
                />
              </div>
            </div>
          )}
        </div>

        {/* Player 2 controls on right side (desktop + mobile landscape) */}
        {controlsOnSides && (
          <div>
            {/* Always show controls when on sides to prevent layout jumping */}
            <Player2Setup
              player2Angle={player2Angle}
              setPlayer2Angle={setPlayer2Angle}
              player2Ready={player2Ready}
              togglePlayer2Ready={togglePlayer2Ready}
              gameState={gameState}
              compact={isMobileLandscape}
            />
          </div>
        )}
      </div>

      <p className="text-gray-400 text-xs md:text-sm mt-4 max-w-2xl text-center px-4">
        Set your launch angle and click Fire. When both players are ready, projectiles will fire simultaneously.
        Gravitational bodies will bend your projectile's path. Hit the enemy planet three times to win!
      </p>

      <div className="text-gray-500 text-xs mt-4 md:mt-6 text-center max-w-2xl px-4">
        <p className="font-semibold mb-1">Credits:</p>
        <p>Music: www.purple-planet.com</p>
        <p>Sound effect: by freesound_community via Pixabay</p>
        <p>Planets: "2D Planets" by Rawdanitsu licensed Public Domain CC0: https://opengameart.org/content/2d-planets-0</p>
        <p>Stars: "Planets and stars set (high-res)" by Rawdanitsu licensed Public Domain CC0: https://opengameart.org/content/planets-and-stars-set-high-res</p>
      </div>
    </div>
  );
};

export default GravityArtilleryGame;
