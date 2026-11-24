import { useCallback, useState } from 'react';
import { Difficulty } from '../game/ai';
import { Campaign, chooseSystemMap, parseCampaign, recordCampaignMatch, Reward, startCampaign } from '../game/campaign';
import { Ammo } from '../types/game';
import { Winner } from '../game/gameReducer';
import { loadJson, removeKey, saveJson } from '../utils/storage';

const STORAGE_KEY = 'gravity-artillery:campaign';

/** Only an active campaign is saved; a finished one lives until the page is closed. */
export const saveCampaign = (campaign: Campaign) => {
  if (campaign.status === 'active') saveJson(STORAGE_KEY, campaign);
  else removeKey(STORAGE_KEY);
};

/** The current campaign, saved on this device after every change. */
export const useCampaign = () => {
  const [campaign, setCampaign] = useState<Campaign | null>(() => parseCampaign(loadJson(STORAGE_KEY)));

  const change = useCallback((next: Campaign) => {
    saveCampaign(next);
    setCampaign(next);
    return next;
  }, []);

  const start = useCallback((difficulty: Difficulty) => change(startCampaign(difficulty)), [change]);

  const recordMatch = useCallback((current: Campaign, winner: Exclude<Winner, null>, playerLives: number, ammo: Ammo) =>
    change(recordCampaignMatch(current, winner, playerLives, ammo)), [change]);

  const setProgress = useCallback((current: Campaign, playerLives: number, ammo: Ammo, rewardPending: boolean) =>
    change({ ...current, playerLives, ammo, rewardPending }), [change]);

  const chooseMap = useCallback((current: Campaign, reward: Reward | null) =>
    change(chooseSystemMap(current, reward)), [change]);

  return { campaign, start, recordMatch, setProgress, chooseMap };
};
