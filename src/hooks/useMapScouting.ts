import { useEffect, useRef, useState } from 'react';
import { MapReport, pickChoices, scoutMap } from '../game/mapScouting';
import { bodiesFor } from '../game/presetMaps';
import { Planet } from '../types/game';
import { MapOptions } from '../utils/generateGravitationalBodies';
import { randomSeed } from '../utils/random';

// Picks the easiest and hardest of a few candidates, so the two maps differ.
// Each candidate takes some tens of milliseconds, so they are scouted one per
// task to keep the page responsive.
const CANDIDATES = 4;
const MAX_TRIES = 12;

export type ScoutRequest = {
  key: string;
  map: MapOptions;
  planets: { player1: Planet; player2: Planet };
  // Hand-made maps to choose two from, instead of random ones
  presets?: number[];
};
export type MapChoices = [MapReport, MapReport];

/** Scouts two maps for the request. Returns null until they are ready. A new key starts over. */
export const useMapScouting = (request: ScoutRequest | null) => {
  const [result, setResult] = useState<{ key: string; choices: MapChoices } | null>(null);
  const key = request?.key ?? null;
  // The rest of the request is read when the key changes, which is when it is new
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  });

  useEffect(() => {
    const current = requestRef.current;
    if (key === null || current === null) return;
    const { map, planets } = current;
    // Two of the presets, in random order; or random maps until there are enough fair ones
    const presets = current.presets ? [...current.presets].sort(() => Math.random() - 0.5).slice(0, 2) : null;
    const reports: MapReport[] = [];
    let tries = 0;
    let timeoutId: number;

    const step = () => {
      const seed = presets ? presets[tries] : randomSeed();
      tries++;
      reports.push(scoutMap(planets, bodiesFor(seed, map, planets), seed));
      const fair = reports.filter(r => r.fair).length;
      const done = presets ? tries >= presets.length : fair >= CANDIDATES || tries >= MAX_TRIES;
      if (done) setResult({ key, choices: pickChoices(reports) });
      else timeoutId = window.setTimeout(step, 0);
    };

    timeoutId = window.setTimeout(step, 0);
    return () => window.clearTimeout(timeoutId);
  }, [key]);

  return result !== null && result.key === key ? result.choices : null;
};
