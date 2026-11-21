import { describe, expect, it } from 'vitest';
import { CAMPAIGN_LENGTH, chooseSystemMap, MAX_PLAYER_LIVES, parseCampaign, recordCampaignMatch, startCampaign, systemConfig } from './campaign';

describe('systemConfig', () => {
  it('gets tougher from the first system to the last', () => {
    const first = systemConfig(0);
    const last = systemConfig(CAMPAIGN_LENGTH - 1);
    expect(last.opponentLives).toBeGreaterThan(first.opponentLives);
    expect(last.map.bodyCount).toBeGreaterThan(first.map.bodyCount);
    expect(last.map.blackHoleChance).toBeGreaterThan(first.map.blackHoleChance);
    expect(last.aimErrorScale).toBeLessThan(first.aimErrorScale);
  });

  it('never gets easier from one system to the next', () => {
    for (let i = 1; i < CAMPAIGN_LENGTH; i++) {
      const [before, after] = [systemConfig(i - 1), systemConfig(i)];
      expect(after.opponentLives).toBeGreaterThanOrEqual(before.opponentLives);
      expect(after.map.bodyCount).toBeGreaterThanOrEqual(before.map.bodyCount);
      expect(after.aimErrorScale).toBeLessThan(before.aimErrorScale);
    }
  });
});

describe('recordCampaignMatch', () => {
  it('moves on to the next system with the lives left', () => {
    const next = recordCampaignMatch(startCampaign('normal'), 1, 2);
    expect(next).toEqual({ difficulty: 'normal', system: 1, playerLives: 2, status: 'active', rewardPending: true });
  });

  it('caps the lives carried over', () => {
    const campaign = { ...startCampaign('easy'), playerLives: MAX_PLAYER_LIVES };
    expect(recordCampaignMatch(campaign, 1, MAX_PLAYER_LIVES + 1).playerLives).toBe(MAX_PLAYER_LIVES);
  });

  it('ends on a loss or a draw', () => {
    expect(recordCampaignMatch(startCampaign('hard'), 2, 0).status).toBe('lost');
    expect(recordCampaignMatch(startCampaign('hard'), 'draw', 0).status).toBe('lost');
  });

  it('is won after the last system', () => {
    const last = { ...startCampaign('normal'), system: CAMPAIGN_LENGTH - 1 };
    const won = recordCampaignMatch(last, 1, 1);
    expect(won.status).toBe('won');
    expect(won.system).toBe(CAMPAIGN_LENGTH);
    expect(recordCampaignMatch(won, 2, 0)).toBe(won);
  });
});

describe('chooseSystemMap', () => {
  const afterWin = recordCampaignMatch(startCampaign('normal'), 1, 2);

  it('gives a life for the harder map, once', () => {
    const chosen = chooseSystemMap(afterWin, true);
    expect(chosen).toMatchObject({ playerLives: 3, rewardPending: false });
    expect(chooseSystemMap(chosen, true).playerLives).toBe(3);
  });

  it('gives nothing for the easier map', () => {
    expect(chooseSystemMap(afterWin, false)).toMatchObject({ playerLives: 2, rewardPending: false });
  });

  it('gives nothing at the start of a campaign or with full lives', () => {
    expect(chooseSystemMap(startCampaign('easy'), true).playerLives).toBe(3);
    const full = { ...afterWin, playerLives: MAX_PLAYER_LIVES };
    expect(chooseSystemMap(full, true).playerLives).toBe(MAX_PLAYER_LIVES);
  });
});

describe('parseCampaign', () => {
  it('accepts a saved active campaign', () => {
    const campaign = { ...startCampaign('hard'), system: 3, playerLives: 4 };
    expect(parseCampaign(JSON.parse(JSON.stringify(campaign)))).toEqual(campaign);
  });

  it('reads a save from before map choices as having no reward pending', () => {
    const old: Record<string, unknown> = { ...startCampaign('normal') };
    delete old.rewardPending;
    expect(parseCampaign(old)?.rewardPending).toBe(false);
  });

  it('rejects anything that cannot be resumed', () => {
    const valid = startCampaign('easy');
    expect(parseCampaign(null)).toBeNull();
    expect(parseCampaign('easy')).toBeNull();
    expect(parseCampaign({ ...valid, difficulty: 'insane' })).toBeNull();
    expect(parseCampaign({ ...valid, playerLives: 0 })).toBeNull();
    expect(parseCampaign({ ...valid, system: CAMPAIGN_LENGTH })).toBeNull();
    expect(parseCampaign({ ...valid, status: 'won' })).toBeNull();
  });
});
