import { useEffect, useState } from 'react';
import { initialPlanets } from '../constants/game';
import { MapReport, pickChoices, scoutMap } from '../game/mapScouting';
import { generateGravitationalBodies, MapOptions } from '../utils/generateGravitationalBodies';
import { createRandom, randomSeed } from '../utils/random';

// Picks the easiest and hardest of a few candidates, so the two maps differ.
// Each candidate takes some tens of milliseconds, so they are scouted one per
// task to keep the page responsive.
const CANDIDATES = 4;
const MAX_TRIES = 12;

export type ScoutRequest = { key: string; map: MapOptions };
export type MapChoices = [MapReport, MapReport];

/** Scouts two maps for the request. Returns null until they are ready. A new key starts over. */
export const useMapScouting = (request: ScoutRequest | null) => {
  const [result, setResult] = useState<{ key: string; choices: MapChoices } | null>(null);
  const key = request?.key ?? null;
  const bodyCount = request?.map.bodyCount ?? 0;
  const blackHoleChance = request?.map.blackHoleChance ?? 0;

  useEffect(() => {
    if (key === null) return;
    const map = { bodyCount, blackHoleChance };
    const reports: MapReport[] = [];
    let tries = 0;
    let timeoutId: number;

    const step = () => {
      const seed = randomSeed();
      tries++;
      reports.push(scoutMap(initialPlanets, generateGravitationalBodies(initialPlanets, createRandom(seed), map), seed));
      const fair = reports.filter(r => r.fair).length;
      if (fair >= CANDIDATES || tries >= MAX_TRIES) setResult({ key, choices: pickChoices(reports) });
      else timeoutId = window.setTimeout(step, 0);
    };

    timeoutId = window.setTimeout(step, 0);
    return () => window.clearTimeout(timeoutId);
  }, [key, bodyCount, blackHoleChance]);

  return result !== null && result.key === key ? result.choices : null;
};
