import { Difficulty } from './ai';

// Statistics for games against the computer, per difficulty. Two-player
// games are not counted.

export type DifficultyStats = {
  shots: number;
  hits: number;
  matchesWon: number;
  // Draws count as lost: neither ends a match with a planet left
  matchesLost: number;
  streak: number;
  bestStreak: number;
  campaignsStarted: number;
  campaignsWon: number;
  // Most systems conquered in one campaign
  bestSystems: number;
};

export type Stats = Record<Difficulty, DifficultyStats>;

const EMPTY: DifficultyStats = {
  shots: 0,
  hits: 0,
  matchesWon: 0,
  matchesLost: 0,
  streak: 0,
  bestStreak: 0,
  campaignsStarted: 0,
  campaignsWon: 0,
  bestSystems: 0
};

export const emptyStats = (): Stats => ({ easy: { ...EMPTY }, normal: { ...EMPTY }, hard: { ...EMPTY } });

const update = (stats: Stats, difficulty: Difficulty, fn: (s: DifficultyStats) => Partial<DifficultyStats>): Stats =>
  ({ ...stats, [difficulty]: { ...stats[difficulty], ...fn(stats[difficulty]) } });

export type MatchRecord = { won: boolean; shots: number; hits: number };

export const recordMatch = (stats: Stats, difficulty: Difficulty, match: MatchRecord): Stats =>
  update(stats, difficulty, s => {
    const streak = match.won ? s.streak + 1 : 0;
    return {
      shots: s.shots + match.shots,
      hits: s.hits + match.hits,
      matchesWon: s.matchesWon + (match.won ? 1 : 0),
      matchesLost: s.matchesLost + (match.won ? 0 : 1),
      streak,
      bestStreak: Math.max(s.bestStreak, streak)
    };
  });

export const recordCampaignStart = (stats: Stats, difficulty: Difficulty): Stats =>
  update(stats, difficulty, s => ({ campaignsStarted: s.campaignsStarted + 1 }));

/** Called when a system is conquered, so the record holds even if the campaign is never finished. */
export const recordSystemsConquered = (stats: Stats, difficulty: Difficulty, systems: number, campaignWon: boolean): Stats =>
  update(stats, difficulty, s => ({
    bestSystems: Math.max(s.bestSystems, systems),
    campaignsWon: s.campaignsWon + (campaignWon ? 1 : 0)
  }));

/** Hit rate in percent, or null before the first shot. */
export const hitRate = (s: DifficultyStats) => (s.shots > 0 ? Math.round((100 * s.hits) / s.shots) : null);

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

/** Saved stats, keeping every valid number and starting the rest from zero. */
export const parseStats = (value: unknown): Stats => {
  const stats = emptyStats();
  if (typeof value !== 'object' || value === null) return stats;
  for (const difficulty of Object.keys(stats) as Difficulty[]) {
    const saved = (value as Record<string, unknown>)[difficulty];
    if (typeof saved !== 'object' || saved === null) continue;
    for (const key of Object.keys(EMPTY) as (keyof DifficultyStats)[]) {
      const number = (saved as Record<string, unknown>)[key];
      if (isCount(number)) stats[difficulty][key] = number;
    }
  }
  return stats;
};
