import { useRef } from 'react';
import { useGravityGame } from './hooks/useGravityGame';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useResponsiveCanvas } from './hooks/useResponsiveCanvas';
import { useOrientation } from './hooks/useOrientation';
import { useIsMobile } from './hooks/useIsMobile';
import { GameCanvas } from './components/GameCanvas';
import { GameOverOverlay } from './components/GameOverOverlay';
import { PlayerControls } from './components/PlayerControls';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants/game';
import { PlayerNumber } from './game/gameReducer';

const GravityArtilleryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playExplosion, startMusic } = useSoundEffects();
  const { width: displayWidth, height: displayHeight } = useResponsiveCanvas();
  const orientation = useOrientation();
  const isMobile = useIsMobile();

  const { model, planets, gravitationalBodies, simulationRef, adjustAngle, toggleReady, nextRound } =
    useGravityGame({ onExplosion: playExplosion });
  const { phase: gameState, winner, players } = model;

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    simulationRef,
    destroyed: model.destroyed,
    gameState,
    player1Angle: players[1].angle,
    player2Angle: players[2].angle,
    lives: { 1: players[1].lives, 2: players[2].lives }
  });

  // Controls on sides for desktop and mobile landscape, below the canvas for mobile portrait
  const controlsOnSides = !isMobile || orientation === 'landscape';
  const isMobileLandscape = isMobile && orientation === 'landscape';

  const controls = (player: PlayerNumber, compact = false) => (
    <PlayerControls
      player={player}
      angle={players[player].angle}
      adjustAngle={delta => adjustAngle(player, delta)}
      ready={players[player].ready}
      // Music starts on the first button press (a user gesture, which mobile browsers require)
      toggleReady={() => { startMusic(); toggleReady(player); }}
      gameState={gameState}
      compact={compact}
    />
  );

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
        {/* Always show side controls to prevent layout jumping */}
        {controlsOnSides && <div>{controls(1, isMobileLandscape)}</div>}

        <div className={`flex flex-col items-center gap-4 ${controlsOnSides ? 'w-auto' : 'w-full'}`}>
          <div className="relative">
            <GameCanvas
              canvasRef={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
            />
            {winner !== null && <GameOverOverlay winner={winner} onPlayAgain={nextRound} />}
          </div>

          {!controlsOnSides && (
            <div className="flex flex-row gap-4 w-full px-2">
              <div className="flex-1">{controls(1)}</div>
              <div className="flex-1">{controls(2)}</div>
            </div>
          )}
        </div>

        {controlsOnSides && <div>{controls(2, isMobileLandscape)}</div>}
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
