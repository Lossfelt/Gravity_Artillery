import { GravityBody, Planet } from '../types/game';
import { findBestAim, simulateShot } from './ai';
import { AIM_LIMIT, toWorldAngle } from './aim';

// Rates how hard a star map is for the human (player 1), so the campaign can
// offer a choice between an easier and a harder map. The physics is
// deterministic, so this flies the shots exactly as the game will.

type Planets = { player1: Planet; player2: Planet };

export type MapTier = 'open' | 'winding' | 'treacherous';

export type MapReport = {
  seed: number;
  // Degrees of aim that hit the opponent, measured in tenths
  hitWidth: number;
  // How far from straight ahead (0°) the nearest hit lies
  nearestHit: number;
  // Higher is harder
  score: number;
  tier: MapTier;
  // Both players can hit. The computer only tries whole degrees, so a map it
  // cannot hit that way would be a free win.
  fair: boolean;
};

const hits = (planets: Planets, bodies: GravityBody[], relative: number) =>
  simulateShot(planets, bodies, 1, { angle: toWorldAngle(1, relative) }).hit === 2;

/**
 * Hit windows are mostly 1-2° wide, so whole degrees are too coarse. Scans in
 * half degrees, then measures in tenths (the finest aim step) around each hit.
 * Windows narrower than half a degree can be missed, but count for little.
 */
const measureHits = (planets: Planets, bodies: GravityBody[]) => {
  const tenths = new Set<number>();
  for (let half = -AIM_LIMIT * 2; half <= AIM_LIMIT * 2; half++) {
    if (!hits(planets, bodies, half / 2)) continue;
    for (let t = half * 5 - 5; t <= half * 5 + 5; t++) {
      if (Math.abs(t) <= AIM_LIMIT * 10) tenths.add(t);
    }
  }
  let count = 0;
  let nearest = Infinity;
  for (const t of tenths) {
    if (!hits(planets, bodies, t / 10)) continue;
    count++;
    nearest = Math.min(nearest, Math.abs(t) / 10);
  }
  return { hitWidth: count / 10, nearestHit: nearest };
};

// A narrow window needs precise aim; a window far from straight ahead must
// first be found. Measured over 240 campaign maps, nearest hit ranged from
// about 1° to 12° (10th to 90th percentile) and width from 1.5° to 5°. The
// tier limits split those maps roughly in thirds (scores 5.7 and 10.2).
const WIDTH_WEIGHT = 10;
const TIER_LIMITS = { open: 6, winding: 11 };

export const mapScore = (hitWidth: number, nearestHit: number) =>
  hitWidth > 0 ? nearestHit + WIDTH_WEIGHT / hitWidth : Infinity;

export const tierOf = (score: number): MapTier =>
  score <= TIER_LIMITS.open ? 'open' : score <= TIER_LIMITS.winding ? 'winding' : 'treacherous';

export const scoutMap = (planets: Planets, bodies: GravityBody[], seed: number): MapReport => {
  const { hitWidth, nearestHit } = measureHits(planets, bodies);
  const score = mapScore(hitWidth, nearestHit);
  const fair = hitWidth > 0 && findBestAim(planets, bodies, 2).score === 0;
  return { seed, hitWidth, nearestHit, score, tier: tierOf(score), fair };
};

/** The easiest and the hardest of the scouted maps, preferring fair ones. */
export const pickChoices = (reports: MapReport[]): [MapReport, MapReport] => {
  const fair = reports.filter(r => r.fair);
  const pool = [...(fair.length >= 2 ? fair : reports)].sort((a, b) => a.score - b.score);
  return [pool[0], pool[pool.length - 1]];
};
