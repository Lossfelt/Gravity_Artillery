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
  const { playExplosion } = useSoundEffects();
  const { width: displayWidth, height: displayHeight } = useResponsiveCanvas();
  const orientation = useOrientation();
  const isMobile = useIsMobile();

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
    explosionParticles,
    planetFragments,
    destroyedPlanets,
    gameState,
    gameStats,
    forceWin,
    forceDraw
  } = useGravityGame({ onExplosion: playExplosion });

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    projectiles,
    explosionParticles,
    planetFragments,
    destroyedPlanets,
    gameState,
    player1Angle,
    player2Angle,
    gameStats
  });

  const togglePlayer1Ready = () => setPlayer1Ready(prev => !prev);
  const togglePlayer2Ready = () => setPlayer2Ready(prev => !prev);

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
            />
          </div>
        )}

        {/* Canvas - shared between all layouts */}
        <div className={`flex flex-col items-center gap-4 ${controlsOnSides ? 'w-auto' : 'w-full'}`}>
          <GameCanvas
            canvasRef={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
          />

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
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3 mb-4 mt-4 justify-center">
        <button
          onClick={() => forceWin(1)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 md:px-4 rounded text-xs md:text-sm"
        >
          TEST: Player 1 Wins
        </button>
        <button
          onClick={() => forceWin(2)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 md:px-4 rounded text-xs md:text-sm"
        >
          TEST: Player 2 Wins
        </button>
        <button
          onClick={forceDraw}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 md:px-4 rounded text-xs md:text-sm"
        >
          TEST: Draw (Both Hit)
        </button>
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
