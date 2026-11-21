import { ReactNode } from 'react';
import { Campaign, CAMPAIGN_LENGTH, systemConfig } from '../game/campaign';
import { difficultyLabel } from './difficulty';
import { LivesRow, Modal } from './Modal';
import { NextArrow } from './icons';

type CampaignScreenProps = {
  // The campaign after the match that just ended
  campaign: Campaign;
  onContinue: () => void;
  onNewCampaign: () => void;
  onMenu: () => void;
  compact?: boolean;
};

/** One dot per system: conquered, the one ahead, and the rest. */
const Progress = ({ conquered, failed }: { conquered: number; failed: boolean }) => (
  <ol className="flex justify-center gap-2 my-3" aria-label={`${conquered} of ${CAMPAIGN_LENGTH} systems conquered`}>
    {Array.from({ length: CAMPAIGN_LENGTH }, (_, i) => {
      const style =
        i < conquered ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]'
        : i === conquered ? (failed ? 'bg-[#ff5c7a]' : 'border-2 border-[var(--accent)]')
        : 'border border-white/25';
      return <li key={i} className={`w-3 h-3 rounded-full ${style}`} />;
    })}
  </ol>
);

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className="text-sm md:text-base text-[var(--ink-dim)] mb-4">{children}</p>
);

export const CampaignScreen = ({ campaign, onContinue, onNewCampaign, onMenu, compact = false }: CampaignScreenProps) => {
  const button = compact ? 'min-h-10 px-4 text-sm' : 'py-2.5 px-5';
  const menuButton = <button onClick={onMenu} className={`btn btn-step ${button}`}>Menu</button>;
  const newButton = <button onClick={onNewCampaign} className={`btn btn-primary ${button}`}>New campaign</button>;

  if (campaign.status === 'won') {
    return (
      <Modal title="The Dark Forest is yours" compact={compact}>
        <Progress conquered={CAMPAIGN_LENGTH} failed={false} />
        <Paragraph>
          All {CAMPAIGN_LENGTH} systems conquered on {difficultyLabel(campaign.difficulty)},
          with <LivesRow lives={campaign.playerLives} /> to spare.
        </Paragraph>
        <div className="flex justify-center gap-3">{menuButton}{newButton}</div>
      </Modal>
    );
  }

  if (campaign.status === 'lost') {
    return (
      <Modal title="The campaign ends" compact={compact}>
        <Progress conquered={campaign.system} failed />
        <Paragraph>
          Your last colony fell in system {campaign.system + 1}
          {campaign.system === 0 ? ', before a single system was conquered.' : `, after ${campaign.system} of ${CAMPAIGN_LENGTH} systems conquered.`}
        </Paragraph>
        <div className="flex justify-center gap-3">{menuButton}{newButton}</div>
      </Modal>
    );
  }

  const next = systemConfig(campaign.system);
  return (
    <Modal title={`System ${campaign.system} conquered`} compact={compact}>
      <Progress conquered={campaign.system} failed={false} />
      <Paragraph>
        Next: system {campaign.system + 1} of {CAMPAIGN_LENGTH}. The enemy has <LivesRow lives={next.opponentLives} />,
        you have <LivesRow lives={campaign.playerLives} />.
      </Paragraph>
      <div className="flex justify-center gap-3">
        {menuButton}
        <button onClick={onContinue} className={`btn btn-primary ${button}`}>Continue<NextArrow /></button>
      </div>
    </Modal>
  );
};
