import { useCallback, useEffect, useRef, useState } from 'react';
import { useGravityGame } from './hooks/useGravityGame';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useGravityHum, useSoundEffects } from './hooks/useSoundEffects';
import { useResponsiveCanvas } from './hooks/useResponsiveCanvas';
import { useLayout } from './hooks/useLayout';
import { GameCanvas } from './components/GameCanvas';
import { GameOverOverlay } from './components/GameOverOverlay';
import { PlayerControls } from './components/PlayerControls';
import { AiPanel } from './components/AiPanel';
import { StartMenu } from './components/StartMenu';
import { CampaignScreen } from './components/CampaignScreen';
import { StatsScreen } from './components/StatsScreen';
import { MapChoice } from './components/MapChoice';
import { ScoutRequest, useMapScouting } from './hooks/useMapScouting';
import { difficultyLabel } from './components/difficulty';
import { useOpponentSetting } from './hooks/useOpponentSetting';
import { saveCampaign, useCampaign } from './hooks/useCampaign';
import { useStats } from './hooks/useStats';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants/game';
import { GameModel, isMatchOver, PlayerNumber, START_LIVES, Winner } from './game/gameReducer';
import { Difficulty } from './game/ai';
import { Campaign, CAMPAIGN_LENGTH, canTakeReward, systemConfig } from './game/campaign';
import { recordCampaignStart, recordMatch, recordSystemsConquered } from './game/stats';

type Mode = 'single' | 'campaign';
type Screen = 'menu' | 'stats' | null;

const SINGLE_MATCH_LIVES = { 1: START_LIVES, 2: START_LIVES };

const GravityArtilleryGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { engine, sounds, startAudio } = useSoundEffects();
  const { width: displayWidth, height: displayHeight } = useResponsiveCanvas();
  const layout = useLayout();

  const [mode, setMode] = useState<Mode>('single');
  const [screen, setScreen] = useState<Screen>('menu');
  // Whether a game was started from the menu, so the menu can offer to go back to it
  const [started, setStarted] = useState(false);
  const [opponent, setOpponent] = useOpponentSetting();
  const [menuDifficulty, setMenuDifficulty] = useState<Difficulty>(opponent ?? 'normal');
  const {
    campaign,
    start: startCampaign,
    recordMatch: recordCampaignMatch,
    setLives: setCampaignLives,
    chooseMap: chooseCampaignMap
  } = useCampaign();
  const { stats, update: updateStats } = useStats();
  // The campaign system being fought. Fixed for the match, even after a win moves the campaign on.
  const [matchSystem, setMatchSystem] = useState(0);
  // In a campaign, every new map is chosen from two: the first map of a system, or the next map after a hit
  const [choosing, setChoosing] = useState<'system' | 'round' | null>(null);
  // Makes each system choice a new scouting request
  const [systemChoiceId, setSystemChoiceId] = useState(0);

  const inCampaign = mode === 'campaign' && campaign !== null;
  const config = inCampaign ? systemConfig(matchSystem) : null;
  const aiDifficulty = inCampaign ? campaign.difficulty : opponent;

  const handleMatchEnd = useCallback((winner: Exclude<Winner, null>, model: GameModel) => {
    if (aiDifficulty) {
      updateStats(s => recordMatch(s, aiDifficulty, { won: winner === 1, shots: model.matchShots, hits: model.players[1].hits }));
    }
    if (inCampaign && campaign.status === 'active') {
      const next = recordCampaignMatch(campaign, winner, model.players[1].lives);
      if (winner === 1) updateStats(s => recordSystemsConquered(s, next.difficulty, next.system, next.status === 'won'));
    }
  }, [aiDifficulty, inCampaign, campaign, recordCampaignMatch, updateStats]);

  const { model, planets, gravitationalBodies, simulationRef, adjustAngle, toggleReady, nextRound, startMatch } =
    useGravityGame({
      sounds,
      aiDifficulty,
      aiErrorScale: config?.aimErrorScale,
      map: config?.map,
      paused: screen !== null || choosing !== null,
      onMatchEnd: handleMatchEnd
    });
  useGravityHum(engine, simulationRef, gravitationalBodies);
  const { phase: gameState, winner, players } = model;
  // The last hit has landed, but the result is not shown yet
  const resultPending = gameState === 'gameover' && winner === null && (players[1].lives <= 0 || players[2].lives <= 0);

  // Saves lives as they are lost, so closing the page mid-match cannot undo a lost life
  const campaignInPlay = inCampaign && campaign.status === 'active' && campaign.system === matchSystem;
  const playerLives = players[1].lives;
  useEffect(() => {
    if (campaignInPlay) saveCampaign({ ...campaign, playerLives });
  }, [campaignInPlay, campaign, playerLives]);

  // Scouting for the next round starts as soon as the round ends, so the maps are ready when asked for
  const needsRoundMap = inCampaign && gameState === 'gameover' && !isMatchOver(model);
  const scoutRequest: ScoutRequest | null =
    choosing === 'system' && campaign ? { key: `system-${systemChoiceId}`, map: systemConfig(campaign.system).map }
    : needsRoundMap && config ? { key: `round-${model.shotNumber}`, map: config.map }
    : null;
  const mapChoices = useMapScouting(scoutRequest);

  useCanvasRenderer({
    canvasRef,
    planets,
    gravitationalBodies,
    simulationRef,
    destroyed: model.destroyed,
    gameState,
    aims: { 1: players[1], 2: players[2] },
    hearts: { 1: players[1], 2: players[2] }
  });

  const play = () => {
    setStarted(true);
    setScreen(null);
  };

  // Starts the system on a random map behind the choice, so lives are saved from the start
  const playSystem = (current: Campaign) => {
    setMode('campaign');
    setMatchSystem(current.system);
    startMatch({ 1: current.playerLives, 2: systemConfig(current.system).opponentLives });
    setChoosing('system');
    setSystemChoiceId(id => id + 1);
    play();
  };

  const chooseMap = (seed: number, harder: boolean) => {
    if (choosing === 'system' && campaign) {
      const next = chooseCampaignMap(campaign, harder);
      startMatch({ 1: next.playerLives, 2: systemConfig(next.system).opponentLives }, seed);
    } else {
      nextRound(seed);
    }
    setChoosing(null);
  };

  const newCampaign = (difficulty: Difficulty) => {
    updateStats(s => recordCampaignStart(s, difficulty));
    playSystem(startCampaign(difficulty));
  };

  const playSingle = (difficulty: Difficulty | null) => {
    setMode('single');
    setChoosing(null);
    setOpponent(difficulty);
    startMatch(SINGLE_MATCH_LIVES);
    play();
  };

  const openMenu = () => {
    if (campaignInPlay && playerLives > 0) setCampaignLives(campaign, playerLives);
    setScreen('menu');
  };

  // Controls below the canvas in narrow portrait, on the sides otherwise
  const controlsOnSides = layout !== 'stacked';
  const isCompact = layout === 'compact';

  const switchClass = `link-btn block w-full ${isCompact ? 'mt-1 py-2 text-[11px]' : 'mt-2 text-xs'}`;
  const menuLocked = gameState === 'firing' || resultPending;

  const controls = (player: PlayerNumber, compact = false) => player === 2 && aiDifficulty ? (
    <AiPanel
      angle={players[2].angle}
      ready={players[2].ready}
      gameState={gameState}
      difficulty={aiDifficulty}
      setDifficulty={setOpponent}
      onSwitchToHuman={() => setOpponent(null)}
      campaignLabel={inCampaign ? `System ${matchSystem + 1}/${CAMPAIGN_LENGTH} · ${difficultyLabel(campaign.difficulty)}` : undefined}
      compact={compact}
    />
  ) : (
    <PlayerControls
      footer={player === 1 ? (
        <button onClick={openMenu} disabled={menuLocked} className={switchClass}>Menu</button>
      ) : (
        <button
          onClick={() => setOpponent('normal')}
          disabled={gameState === 'firing'}
          className={switchClass}
        >
          Play vs computer
        </button>
      )}
      player={player}
      angle={players[player].angle}
      adjustAngle={delta => adjustAngle(player, delta)}
      ready={players[player].ready}
      // Audio starts on the Fire press (a user gesture, which mobile browsers require).
      // In a campaign, Next after a hit opens the choice of the next map.
      toggleReady={() => {
        startAudio();
        if (needsRoundMap) setChoosing('round');
        else toggleReady(player);
      }}
      gameState={gameState}
      compact={compact}
    />
  );

  const savedCampaign = campaign?.status === 'active' && !campaignInPlay ? campaign : null;
  const resumeLabel = !started ? null
    : campaignInPlay ? `Resume campaign · system ${matchSystem + 1}`
    : 'Resume game';

  const overlayScreen = () => {
    if (screen === 'menu') {
      return (
        <StartMenu
          difficulty={menuDifficulty}
          setDifficulty={setMenuDifficulty}
          savedCampaign={savedCampaign}
          resumeLabel={resumeLabel}
          onResume={() => setScreen(null)}
          onContinueCampaign={playSystem}
          onNewCampaign={() => newCampaign(menuDifficulty)}
          onVsComputer={() => playSingle(menuDifficulty)}
          onTwoPlayers={() => playSingle(null)}
          onStats={() => setScreen('stats')}
          compact={isCompact}
        />
      );
    }
    if (screen === 'stats') return <StatsScreen stats={stats} onBack={() => setScreen('menu')} compact={isCompact} />;
    if (choosing !== null && scoutRequest && campaign) {
      const system = choosing === 'system';
      return (
        <MapChoice
          title={system ? `Approach to system ${campaign.system + 1}` : 'Choose the next battlefield'}
          choices={mapChoices}
          map={scoutRequest.map}
          reward={!system || !campaign.rewardPending ? null : canTakeReward(campaign) ? 'life' : 'full'}
          onChoose={(report, harder) => chooseMap(report.seed, harder)}
          onMenu={openMenu}
          compact={isCompact}
        />
      );
    }
    if (inCampaign && winner !== null) {
      return (
        <CampaignScreen
          campaign={campaign}
          onContinue={() => playSystem(campaign)}
          onNewCampaign={() => newCampaign(campaign.difficulty)}
          onMenu={() => setScreen('menu')}
          compact={isCompact}
        />
      );
    }
    return null;
  };
  const overlay = overlayScreen();

  return (
    <>
    {/* inert keeps clicks and keyboard focus out of the game while a screen is open */}
    <div inert={overlay !== null} className={`flex flex-col items-center min-h-screen ${
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
            {winner !== null && !inCampaign && (
              <GameOverOverlay
                winner={winner}
                winnerLives={winner === 'draw' ? null : players[winner].lives}
                onPlayAgain={() => nextRound()}
                onMenu={() => setScreen('menu')}
              />
            )}
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
        Set your launch angle, then click Fire. When both players are ready, projectiles will fire simultaneously.
        Gravitational bodies will bend your projectile's path. Destroy every enemy life to win! Playing alone? Open the Menu
        for a campaign of {CAMPAIGN_LENGTH} systems or a match against the computer.
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
    {overlay}
    </>
  );
};

export default GravityArtilleryGame;
