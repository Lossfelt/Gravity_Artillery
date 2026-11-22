import { describe, expect, it } from 'vitest';
import {
  Campaign,
  CAMPAIGN_LENGTH,
  chooseSystemMap,
  MAX_AMMO,
  MAX_PLAYER_LIVES,
  parseCampaign,
  recordCampaignMatch,
  rewardFor,
  SPECIAL_SHOTS,
  START_AMMO,
  startCampaign,
  systemConfig
} from './campaign';

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
    expect(next).toEqual({ difficulty: 'normal', system: 1, playerLives: 2, status: 'active', rewardPending: true, ammo: START_AMMO });
    expect(recordCampaignMatch(startCampaign('normal'), 1, 2, { homing: 0, splitter: 1, phase: 1 }).ammo.homing).toBe(0);
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

describe('rewardFor', () => {
  const afterWin = recordCampaignMatch(startCampaign('normal'), 1, 2);
  const rewards = (campaign: Campaign) => Array.from({ length: 200 }, (_, seed) => rewardFor(campaign, seed));

  it('is the same for the same map', () => {
    expect(rewardFor(afterWin, 42)).toEqual(rewardFor(afterWin, 42));
  });

  it('gives a life or one of the special shots', () => {
    const kinds = new Set(rewards(afterWin).map(r => (r?.kind === 'shot' ? r.shot : r?.kind)));
    expect(kinds).toEqual(new Set(['life', ...SPECIAL_SHOTS]));
  });

  it('gives a shot when lives are full, and skips shots in full stock', () => {
    const full = { ...afterWin, playerLives: MAX_PLAYER_LIVES, ammo: { homing: MAX_AMMO, splitter: 0, phase: MAX_AMMO } };
    expect(new Set(rewards(full).map(r => JSON.stringify(r)))).toEqual(new Set([JSON.stringify({ kind: 'shot', shot: 'splitter' })]));
    const nothingFits = { ...full, ammo: { homing: MAX_AMMO, splitter: MAX_AMMO, phase: MAX_AMMO } };
    expect(rewardFor(nothingFits, 1)).toBeNull();
  });

  it('gives nothing at the start of a campaign', () => {
    expect(rewardFor(startCampaign('easy'), 1)).toBeNull();
  });
});

describe('chooseSystemMap', () => {
  const afterWin = recordCampaignMatch(startCampaign('normal'), 1, 2);

  it('keeps the reward pending for the harder map, but does not pay it yet', () => {
    const chosen = chooseSystemMap(afterWin, { kind: 'life' });
    expect(chosen).toMatchObject({ playerLives: 2, rewardPending: true, ammo: START_AMMO });
  });

  it('drops the reward for the easier map', () => {
    expect(chooseSystemMap(afterWin, null)).toMatchObject({ playerLives: 2, rewardPending: false });
  });

  it('has nothing at stake at the start of a campaign', () => {
    expect(chooseSystemMap(startCampaign('easy'), { kind: 'life' }).rewardPending).toBe(false);
  });
});

describe('parseCampaign', () => {
  it('accepts a saved active campaign', () => {
    const campaign = { ...startCampaign('hard'), system: 3, playerLives: 4 };
    expect(parseCampaign(JSON.parse(JSON.stringify(campaign)))).toEqual(campaign);
  });

  it('reads older saves: no reward pending, and the starting special shots', () => {
    const old: Record<string, unknown> = { ...startCampaign('normal') };
    delete old.rewardPending;
    delete old.ammo;
    expect(parseCampaign(old)).toMatchObject({ rewardPending: false, ammo: START_AMMO });
  });

  it('rejects anything that cannot be resumed', () => {
    const valid = startCampaign('easy');
    expect(parseCampaign(null)).toBeNull();
    expect(parseCampaign('easy')).toBeNull();
    expect(parseCampaign({ ...valid, difficulty: 'insane' })).toBeNull();
    expect(parseCampaign({ ...valid, playerLives: 0 })).toBeNull();
    expect(parseCampaign({ ...valid, system: CAMPAIGN_LENGTH })).toBeNull();
    expect(parseCampaign({ ...valid, status: 'won' })).toBeNull();
    expect(parseCampaign({ ...valid, ammo: { homing: MAX_AMMO + 1, splitter: 0, phase: 0 } })).toBeNull();
  });
});
