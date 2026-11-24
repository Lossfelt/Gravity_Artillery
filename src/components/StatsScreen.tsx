import { Difficulty } from '../game/ai';
import { CAMPAIGN_LENGTH } from '../game/campaign';
import { DifficultyStats, hitRate, Stats } from '../game/stats';
import { DIFFICULTIES } from './difficulty';
import { Modal } from './Modal';

type StatsScreenProps = {
  stats: Stats;
  onBack: () => void;
  compact?: boolean;
};

const ROWS: { label: string; value: (s: DifficultyStats) => string }[] = [
  { label: 'Campaigns won', value: s => `${s.campaignsWon} / ${s.campaignsStarted}` },
  { label: 'Best campaign', value: s => `${s.bestSystems} / ${CAMPAIGN_LENGTH}` },
  { label: 'Matches won', value: s => `${s.matchesWon} / ${s.matchesWon + s.matchesLost}` },
  { label: 'Win streak', value: s => `${s.streak} (best ${s.bestStreak})` },
  { label: 'Hit rate', value: s => { const rate = hitRate(s); return rate === null ? '–' : `${rate} %`; } },
  { label: 'Shots fired', value: s => `${s.shots}` }
];

/** Statistics against the computer, one column per difficulty. */
export const StatsScreen = ({ stats, onBack, compact = false }: StatsScreenProps) => (
  <Modal title="Statistics" compact={compact}>
    <table className={`w-full tabular-nums ${compact ? 'text-xs mb-2' : 'text-sm mb-5'}`}>
      <thead>
        <tr>
          <th />
          {DIFFICULTIES.map(({ value, label }) => (
            <th key={value} scope="col" className="readout-label font-normal pb-2 text-right">{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map(row => (
          <tr key={row.label} className="border-t border-white/10">
            <th scope="row" className={`text-left font-normal text-[var(--ink-dim)] ${compact ? 'py-1' : 'py-1.5'}`}>{row.label}</th>
            {DIFFICULTIES.map(({ value }: { value: Difficulty }) => (
              <td key={value} className="text-right font-bold">{row.value(stats[value])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <p className={`text-xs text-[var(--ink-dim)] ${compact ? 'mb-2' : 'mb-4'}`}>Games against the computer on this device.</p>
    <button onClick={onBack} className={`btn btn-step ${compact ? 'min-h-10 px-4 text-sm' : 'py-2 px-5'}`}>Back</button>
  </Modal>
);
