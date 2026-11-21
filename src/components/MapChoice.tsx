import { MapReport, MapTier } from '../game/mapScouting';
import { MapChoices } from '../hooks/useMapScouting';
import { MapOptions } from '../utils/generateGravitationalBodies';
import { MapPreview } from './MapPreview';
import { LivesRow, Modal } from './Modal';

type MapChoiceProps = {
  title: string;
  choices: MapChoices | null;
  map: MapOptions;
  // Reward for the harder map: a life, a note that lives are full, or nothing at all
  reward: 'life' | 'full' | null;
  onChoose: (report: MapReport, harder: boolean) => void;
  onMenu: () => void;
  compact?: boolean;
};

const TIERS: Record<MapTier, { label: string; pips: number; hint: string }> = {
  open: { label: 'Open', pips: 1, hint: 'A hit lies close to straight ahead' },
  winding: { label: 'Winding', pips: 2, hint: 'The path bends; expect to search' },
  treacherous: { label: 'Treacherous', pips: 3, hint: 'Far off the direct line, or a narrow window' }
};

const Pips = ({ count }: { count: number }) => (
  <span className="inline-flex gap-1" aria-hidden="true">
    {[1, 2, 3].map(i => (
      <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= count ? 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]' : 'bg-white/20'}`} />
    ))}
  </span>
);

const RewardLine = ({ reward }: { reward: MapChoiceProps['reward'] }) => {
  if (reward === 'life') return <span className="text-[#ff9db0]">Reward: +<LivesRow lives={1} /></span>;
  if (reward === 'full') return <span className="text-[var(--ink-dim)]">Lives full, no reward</span>;
  return <span className="text-[var(--ink-dim)]">No reward</span>;
};

export const MapChoice = ({ title, choices, map, reward, onChoose, onMenu, compact = false }: MapChoiceProps) => (
  <Modal title={title} compact={compact} wide>
    {choices === null ? (
      <p className={`text-[var(--ink-dim)] ${compact ? 'py-6' : 'py-12'}`} aria-live="polite">Scouting the systems…</p>
    ) : (
      <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-4'}`}>
        {choices.map((report, i) => {
          const tier = TIERS[report.tier];
          const harder = i === 1;
          return (
            <button
              key={report.seed}
              onClick={() => onChoose(report, harder)}
              title={tier.hint}
              className="btn btn-step flex-col items-stretch p-1.5 text-left"
            >
              <MapPreview seed={report.seed} map={map} className="rounded-md" />
              <span className={`flex items-center justify-between gap-2 px-1 ${compact ? 'pt-1 text-xs' : 'pt-2 text-sm'}`}>
                {tier.label}
                <Pips count={tier.pips} />
              </span>
              {reward !== null && (
                <span className={`px-1 font-normal ${compact ? 'text-[11px]' : 'text-xs pb-1'}`}>
                  {harder ? <RewardLine reward={reward} /> : <RewardLine reward={null} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    )}
    <button onClick={onMenu} className={`link-btn ${compact ? 'mt-2 py-1 text-xs' : 'mt-4 text-sm'}`}>Menu</button>
  </Modal>
);
