import { describe, expect, it } from 'vitest';
import { emptyStats, hitRate, parseStats, recordCampaignStart, recordMatch, recordSystemsConquered } from './stats';

describe('recordMatch', () => {
  it('adds shots and hits and keeps the win streak', () => {
    let stats = emptyStats();
    stats = recordMatch(stats, 'normal', { won: true, shots: 4, hits: 3 });
    stats = recordMatch(stats, 'normal', { won: true, shots: 6, hits: 3 });
    stats = recordMatch(stats, 'normal', { won: false, shots: 5, hits: 1 });
    expect(stats.normal).toMatchObject({ shots: 15, hits: 7, matchesWon: 2, matchesLost: 1, streak: 0, bestStreak: 2 });
    expect(stats.easy).toEqual(emptyStats().easy);
  });
});

describe('campaign records', () => {
  it('keeps the best number of systems and counts wins', () => {
    let stats = recordCampaignStart(emptyStats(), 'hard');
    stats = recordSystemsConquered(stats, 'hard', 5, false);
    stats = recordSystemsConquered(stats, 'hard', 2, false);
    expect(stats.hard).toMatchObject({ campaignsStarted: 1, bestSystems: 5, campaignsWon: 0 });
    stats = recordSystemsConquered(stats, 'hard', 8, true);
    expect(stats.hard).toMatchObject({ bestSystems: 8, campaignsWon: 1 });
  });
});

describe('hitRate', () => {
  it('is a whole percentage, or null before the first shot', () => {
    expect(hitRate(emptyStats().easy)).toBeNull();
    expect(hitRate({ ...emptyStats().easy, shots: 3, hits: 1 })).toBe(33);
  });
});

describe('parseStats', () => {
  it('keeps valid numbers and starts the rest from zero', () => {
    const stats = parseStats({ easy: { shots: 10, hits: -1, matchesWon: 'many' }, hard: null, extra: 1 });
    expect(stats.easy.shots).toBe(10);
    expect(stats.easy.hits).toBe(0);
    expect(stats.easy.matchesWon).toBe(0);
    expect(stats.hard).toEqual(emptyStats().hard);
    expect(parseStats('broken')).toEqual(emptyStats());
  });
});
