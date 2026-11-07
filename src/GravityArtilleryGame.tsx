import { useRef } from 'react';
import { useGravityGame } from './hooks/useGravityGame';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useGravityHum, useSoundEffects } from './hooks/useSoundEffects';
import { useResponsiveCanvas } from './hooks/useResponsiveCanvas';
import { useLayout } from './hooks/useLayout';
import { GameCanvas } from './components/GameCanvas';
import { GameOverOverlay } from './components/GameOverOverlay';
import { PlayerControls } from './components/PlayerControls';
import { AiPanel } from './components/AiPanel';
import { useOpponentSetting } from './hooks/useOpponentSetting';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants/game';
import { PlayerNumber } from './game/gameReducer';

const GravityArtilleryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { engine, sounds, startAudio } = useSoundEffects();
  const { width: displayWidth, height: displayHeight } = useResponsiveCanvas();
  const layout = useLayout();

  const [aiDifficulty, setAiDifficulty] = useOpponentSetting();
  const { model, planets, gravitationalBodies, simulationRef, adjustAngle, adjustPower, toggleReady, nextRound } =
    useGravityGame({ sounds, aiDifficulty });
  useGravityHum(engine, simulationRef, gravitationalBodies);
  const { phase: gameState, winner, players } = model;

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    simulationRef,
    destroyed: model.destroyed,
    gameState,
    aims: { 1: players[1], 2: players[2] },
    lives: { 1: players[1].lives, 2: players[2].lives }
  });

  // Controls below the canvas in narrow portrait, on the sides otherwise
  const controlsOnSides = layout !== 'stacked';
  const isCompact = layout === 'compact';

  const switchClass = `link-btn block w-full mt-2 ${isCompact ? 'text-[10px]' : 'text-xs'}`;

  const controls = (player: PlayerNumber, compact = false) => player === 2 && aiDifficulty ? (
    <AiPanel
      angle={players[2].angle}
      power={players[2].power}
      ready={players[2].ready}
      gameState={gameState}
      difficulty={aiDifficulty}
      setDifficulty={setAiDifficulty}
      onSwitchToHuman={() => setAiDifficulty(null)}
      compact={compact}
    />
  ) : (
    <PlayerControls
      footer={player === 2 && (
        <button
          onClick={() => setAiDifficulty('normal')}
          disabled={gameState === 'firing'}
          className={switchClass}
        >
          Play vs computer
        </button>
      )}
      player={player}
      angle={players[player].angle}
      power={players[player].power}
      adjustAngle={delta => adjustAngle(player, delta)}
      adjustPower={delta => adjustPower(player, delta)}
      ready={players[player].ready}
      // Audio starts on the Fire press (a user gesture, which mobile browsers require)
      toggleReady={() => { startAudio(); toggleReady(player); }}
      gameState={gameState}
      compact={compact}
    />
  );

  return (
    <div className={`flex flex-col items-center min-h-screen ${
      isCompact ? 'p-2 pt-1' : 'p-4 pt-4 md:pt-8'
    }`}>
      {/* Hide title in the compact layout to save vertical space */}
      {!isCompact && (
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.18em] mb-1">Gravity Artillery</h1>
          <p className="text-xs md:text-sm text-[var(--ink-dim)] italic tracking-wide">a conflict in the Dark Forest</p>
        </div>
      )}

      <div className={`flex ${controlsOnSides ? 'flex-row' : 'flex-col'} items-center justify-center ${isCompact ? 'gap-2' : 'gap-4'} w-full`}>
        {/* Always show side controls to prevent layout jumping */}
        {controlsOnSides && <div>{controls(1, isCompact)}</div>}

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

        {controlsOnSides && <div>{controls(2, isCompact)}</div>}
      </div>

      <p className="text-[var(--ink-dim)] text-xs md:text-sm mt-4 max-w-2xl text-center px-4">
        Set your launch angle and power, then click Fire. When both players are ready, projectiles will fire simultaneously.
        Gravitational bodies will bend your projectile's path. Hit the enemy planet three times to win! Playing alone? Choose "Play vs computer" under Player 2.
      </p>

      <div className="text-[var(--ink-dim)] opacity-70 text-xs mt-4 md:mt-6 text-center max-w-2xl px-4">
        <p className="font-semibold mb-1">Credits:</p>
        <p>Music: www.purple-planet.com</p>
        <p>Explosion sound: by freesound_community via Pixabay</p>
        <p>Launch sound: generated with ElevenLabs</p>
        <p>Planets: "2D Planets" by Rawdanitsu licensed Public Domain CC0: https://opengameart.org/content/2d-planets-0</p>
        <p>Stars: "Planets and stars set (high-res)" by Rawdanitsu licensed Public Domain CC0: https://opengameart.org/content/planets-and-stars-set-high-res</p>
      </div>
    </div>
  );
};

export default GravityArtilleryGame;
