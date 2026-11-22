import { Difficulty } from './ai';
import { START_LIVES, Winner } from './gameReducer';
import { MapOptions } from '../utils/generateGravitationalBodies';
import { Ammo, Reward, SpecialShot } from '../types/game';

export type { Reward };
import { createRandom } from '../utils/random';

// A campaign is a chain of matches against the computer. Your lives carry
// over from system to system; the opponent starts every system with full
// lives, and both the opponent and the maps grow tougher along the way.

export const CAMPAIGN_LENGTH = 8;
export const MAX_PLAYER_LIVES = 5;
export const SPECIAL_SHOTS: SpecialShot[] = ['homing', 'splitter', 'phase'];
// Special shots are only won as rewards
export const START_AMMO: Ammo = { homing: 0, splitter: 0, phase: 0 };
export const MAX_AMMO = 3;

export type CampaignStatus = 'active' | 'won' | 'lost';

export type Campaign = {
  difficulty: Difficulty;
  // Index of the system being fought (0-based). Equals CAMPAIGN_LENGTH when won.
  system: number;
  playerLives: number;
  status: CampaignStatus;
  // A reward is on offer (won a system, next map not chosen yet) or at stake
  // (chose the harder map and has not hit the enemy on it yet)
  rewardPending: boolean;
  ammo: Ammo;
};


// Bosses are smaller targets than a planet: a moon base, then a battle station
export type BossKind = 'moon' | 'station';
export const BOSSES: Record<BossKind, { name: string; radius: number }> = {
  moon: { name: 'Moon Base', radius: 16 },
  station: { name: 'Battle Station', radius: 13 }
};
const BOSS_SYSTEMS: Partial<Record<number, BossKind>> = { 3: 'moon', 7: 'station' };

export type SystemConfig = {
  opponentLives: number;
  boss: BossKind | null;
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
    boss: BOSS_SYSTEMS[i] ?? null,
    map: { bodyCount: BODY_COUNT[i], blackHoleChance: lerp(BLACK_HOLE_CHANCE, t) },
    aimErrorScale: lerp(AIM_ERROR_SCALE, t)
  };
};

export const startCampaign = (difficulty: Difficulty): Campaign =>
  ({ difficulty, system: 0, playerLives: START_LIVES, status: 'active', rewardPending: false, ammo: START_AMMO });

/** Moves on after a match: a win advances to the next system, anything else ends the campaign. */
export const recordCampaignMatch = (
  campaign: Campaign,
  winner: Exclude<Winner, null>,
  playerLives: number,
  ammo = campaign.ammo
): Campaign => {
  if (campaign.status !== 'active') return campaign;
  if (winner !== 1) return { ...campaign, playerLives: 0, status: 'lost', rewardPending: false };
  const system = campaign.system + 1;
  const won = system >= CAMPAIGN_LENGTH;
  return {
    ...campaign,
    system,
    playerLives: Math.min(MAX_PLAYER_LIVES, playerLives),
    ammo,
    status: won ? 'won' : 'active',
    rewardPending: !won
  };
};

/**
 * The reward on the harder map after a win: a life or a special shot, half
 * each. A full stock of either is skipped, so full lives always give a shot.
 * Drawn from the map's seed, so the same map always shows the same reward.
 */
export const rewardFor = (campaign: Campaign, seed: number): Reward | null => {
  if (!campaign.rewardPending) return null;
  const random = createRandom(seed);
  const lifeFits = campaign.playerLives < MAX_PLAYER_LIVES;
  const shots = SPECIAL_SHOTS.filter(shot => campaign.ammo[shot] < MAX_AMMO);
  if (lifeFits && (shots.length === 0 || random() < 0.5)) return { kind: 'life' };
  return shots.length > 0 ? { kind: 'shot', shot: shots[Math.floor(random() * shots.length)] } : null;
};

/**
 * After choosing the first map of a system. A reward is not paid here: it is
 * at stake until the player hits the enemy on that map (see the game reducer).
 */
export const chooseSystemMap = (campaign: Campaign, reward: Reward | null): Campaign =>
  ({ ...campaign, rewardPending: campaign.rewardPending && reward !== null });

const parseAmmo = (value: unknown): Ammo | null => {
  // Saves from before special shots have none
  if (value === undefined) return START_AMMO;
  if (typeof value !== 'object' || value === null) return null;
  const ammo = { ...START_AMMO };
  for (const shot of SPECIAL_SHOTS) {
    const count = (value as Record<string, unknown>)[shot];
    if (!Number.isInteger(count) || (count as number) < 0 || (count as number) > MAX_AMMO) return null;
    ammo[shot] = count as number;
  }
  return ammo;
};

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** A saved campaign that can be resumed, or null if the value is anything else. */
export const parseCampaign = (value: unknown): Campaign | null => {
  if (typeof value !== 'object' || value === null) return null;
  const { difficulty, system, playerLives, status, rewardPending, ammo: savedAmmo } = value as Record<string, unknown>;
  const ammo = parseAmmo(savedAmmo);
  const valid =
    DIFFICULTIES.includes(difficulty as Difficulty) &&
    Number.isInteger(system) && (system as number) >= 0 && (system as number) < CAMPAIGN_LENGTH &&
    Number.isInteger(playerLives) && (playerLives as number) >= 1 && (playerLives as number) <= MAX_PLAYER_LIVES &&
    status === 'active' &&
    ammo !== null;
  // Saves from before map choices have no rewardPending
  return valid ? { difficulty, system, playerLives, status, rewardPending: rewardPending === true, ammo } as Campaign : null;
};
