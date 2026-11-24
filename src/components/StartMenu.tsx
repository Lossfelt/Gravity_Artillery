import { ReactNode } from 'react';
import { Difficulty } from '../game/ai';
import { Campaign, CAMPAIGN_LENGTH } from '../game/campaign';
import { DIFFICULTIES, difficultyLabel } from './difficulty';
import { LivesRow, Modal } from './Modal';
import { NextArrow } from './icons';

type StartMenuProps = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  // A saved campaign that is not the game behind the menu
  savedCampaign: Campaign | null;
  // Text for going back to the game behind the menu, if there is one
  resumeLabel: string | null;
  onResume: () => void;
  onContinueCampaign: (campaign: Campaign) => void;
  onNewCampaign: () => void;
  onVsComputer: () => void;
  onTwoPlayers: () => void;
  onStats: () => void;
  compact?: boolean;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="readout-label text-xs">{title}</h3>
    {children}
  </section>
);

export const StartMenu = ({
  difficulty,
  setDifficulty,
  savedCampaign,
  resumeLabel,
  onResume,
  onContinueCampaign,
  onNewCampaign,
  onVsComputer,
  onTwoPlayers,
  onStats,
  compact = false
}: StartMenuProps) => {
  const button = compact ? 'min-h-10 px-3 text-sm' : 'py-2.5 px-4';

  return (
    <Modal title="Choose your war" compact={compact}>
      {resumeLabel && (
        <button onClick={onResume} className={`btn btn-primary w-full ${compact ? 'mb-2' : 'mb-4'} ${button}`}>
          {resumeLabel}<NextArrow />
        </button>
      )}

      <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-3' : 'mb-5'}`} role="group" aria-label="Difficulty">
        <span className="readout-label text-xs mr-1">Opponent</span>
        {DIFFICULTIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDifficulty(value)}
            aria-pressed={difficulty === value}
            className={`btn btn-step ${compact ? 'min-h-9 px-3 text-sm' : 'py-1.5 px-3 text-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-2 text-left ${compact ? 'gap-3' : 'gap-5'}`}>
        <Section title="Campaign">
          {savedCampaign && (
            <button onClick={() => onContinueCampaign(savedCampaign)} className={`btn btn-primary flex-col ${button}`}>
              <span>Continue</span>
              <span className="text-xs font-normal opacity-90">
                System {savedCampaign.system + 1}/{CAMPAIGN_LENGTH} · {difficultyLabel(savedCampaign.difficulty)} · <LivesRow lives={savedCampaign.playerLives} />
              </span>
            </button>
          )}
          <button
            onClick={onNewCampaign}
            title={savedCampaign ? 'Replaces the saved campaign' : undefined}
            className={`btn ${savedCampaign ? 'btn-step' : 'btn-primary'} ${button}`}
          >
            New campaign
          </button>
          {!compact && (
            <p className="text-xs text-[var(--ink-dim)]">
              Conquer {CAMPAIGN_LENGTH} systems. Your lives carry over, and every system fights harder.
            </p>
          )}
        </Section>

        <Section title="Single match">
          <button onClick={onVsComputer} className={`btn btn-step ${button}`}>Vs computer</button>
          <button onClick={onTwoPlayers} className={`btn btn-step ${button}`}>Two players</button>
        </Section>
      </div>

      <button onClick={onStats} className={`link-btn ${compact ? 'mt-2 py-1 text-xs' : 'mt-5 text-sm'}`}>
        Statistics
      </button>
    </Modal>
  );
};
