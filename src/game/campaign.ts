import { Difficulty } from './ai';
import { START_LIVES, Winner } from './gameReducer';
import { MapOptions } from '../utils/generateGravitationalBodies';

// A campaign is a chain of matches against the computer. Your lives carry
// over from system to system; the opponent starts every system with full
// lives, and both the opponent and the maps grow tougher along the way.

export const CAMPAIGN_LENGTH = 8;
export const MAX_PLAYER_LIVES = 5;

export type CampaignStatus = 'active' | 'won' | 'lost';

export type Campaign = {
  difficulty: Difficulty;
  // Index of the system being fought (0-based). Equals CAMPAIGN_LENGTH when won.
  system: number;
  playerLives: number;
  status: CampaignStatus;
  // Won a system and has not chosen the next map yet: the harder map pays +1 life
  rewardPending: boolean;
};

export type SystemConfig = {
  opponentLives: number;
  map: MapOptions;
  // Multiplies the computer's aiming error: above 1 is sloppier, below 1 sharper
  aimErrorScale: number;
};

const OPPONENT_LIVES = [1, 1, 2, 2, 2, 3, 3, 3];
const BODY_COUNT = [4, 4, 5, 5, 6, 6, 7, 7];
const BLACK_HOLE_CHANCE = { first: 0.06, last: 0.25 };
const AIM_ERROR_SCALE = { first: 2.0, last: 0.5 };

const lerp = (range: { first: number; last: number }, t: number) => range.first + (range.last - range.first) * t;

/** How tough a system is. index runs from 0 to CAMPAIGN_LENGTH - 1. */
export const systemConfig = (index: number): SystemConfig => {
  const i = Math.max(0, Math.min(CAMPAIGN_LENGTH - 1, index));
  const t = i / (CAMPAIGN_LENGTH - 1);
  return {
    opponentLives: OPPONENT_LIVES[i],
    map: { bodyCount: BODY_COUNT[i], blackHoleChance: lerp(BLACK_HOLE_CHANCE, t) },
    aimErrorScale: lerp(AIM_ERROR_SCALE, t)
  };
};

export const startCampaign = (difficulty: Difficulty): Campaign =>
  ({ difficulty, system: 0, playerLives: START_LIVES, status: 'active', rewardPending: false });

/** Moves on after a match: a win advances to the next system, anything else ends the campaign. */
export const recordCampaignMatch = (campaign: Campaign, winner: Exclude<Winner, null>, playerLives: number): Campaign => {
  if (campaign.status !== 'active') return campaign;
  if (winner !== 1) return { ...campaign, playerLives: 0, status: 'lost', rewardPending: false };
  const system = campaign.system + 1;
  const won = system >= CAMPAIGN_LENGTH;
  return {
    ...campaign,
    system,
    playerLives: Math.min(MAX_PLAYER_LIVES, playerLives),
    status: won ? 'won' : 'active',
    rewardPending: !won
  };
};

/** Whether the reward for the harder map would do anything. */
export const canTakeReward = (campaign: Campaign) =>
  campaign.rewardPending && campaign.playerLives < MAX_PLAYER_LIVES;

/** After choosing the first map of a system; takeReward when it was the harder one. */
export const chooseSystemMap = (campaign: Campaign, takeReward: boolean): Campaign => ({
  ...campaign,
  playerLives: takeReward && canTakeReward(campaign) ? campaign.playerLives + 1 : campaign.playerLives,
  rewardPending: false
});

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** A saved campaign that can be resumed, or null if the value is anything else. */
export const parseCampaign = (value: unknown): Campaign | null => {
  if (typeof value !== 'object' || value === null) return null;
  const { difficulty, system, playerLives, status, rewardPending } = value as Record<string, unknown>;
  const valid =
    DIFFICULTIES.includes(difficulty as Difficulty) &&
    Number.isInteger(system) && (system as number) >= 0 && (system as number) < CAMPAIGN_LENGTH &&
    Number.isInteger(playerLives) && (playerLives as number) >= 1 && (playerLives as number) <= MAX_PLAYER_LIVES &&
    status === 'active';
  // Saves from before map choices have no rewardPending
  return valid ? { difficulty, system, playerLives, status, rewardPending: rewardPending === true } as Campaign : null;
};
