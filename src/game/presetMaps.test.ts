import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, initialPlanets } from '../constants/game';
import { planetsFor } from '../utils/bossPlanets';
import { DEFAULT_MAP } from '../utils/generateGravitationalBodies';
import { BOSSES, CAMPAIGN_LENGTH, systemConfig } from './campaign';
import { scoutMap } from './mapScouting';
import { bodiesFor, isPresetSeed, PRESET_MAPS, PRESET_SEED_BASE, presetSeeds } from './presetMaps';

describe('preset maps', () => {
  it.each(PRESET_MAPS.map((map, i) => [map.name, i] as const))('%s is fair against its boss and fits the board', (_, i) => {
    const seed = PRESET_SEED_BASE + i;
    const planets = planetsFor(PRESET_MAPS[i].boss);
    const bodies = bodiesFor(seed, DEFAULT_MAP, planets);
    expect(scoutMap(planets, bodies, seed).fair).toBe(true);
    for (const b of bodies) {
      expect(b.x - b.radius).toBeGreaterThanOrEqual(0);
      expect(b.x + b.radius).toBeLessThanOrEqual(CANVAS_WIDTH);
      expect(b.y - b.radius).toBeGreaterThanOrEqual(0);
      expect(b.y + b.radius).toBeLessThanOrEqual(CANVAS_HEIGHT);
      for (const p of [planets.player1, planets.player2]) expect(Math.hypot(b.x - p.x, b.y - p.y)).toBeGreaterThan(150);
    }
  });

  it('gives each boss at least two maps to choose from', () => {
    expect(presetSeeds('moon').length).toBeGreaterThanOrEqual(2);
    expect(presetSeeds('station').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps preset seeds apart from random seeds', () => {
    expect(isPresetSeed(PRESET_SEED_BASE - 1)).toBe(false);
    const random = bodiesFor(12345, DEFAULT_MAP, initialPlanets);
    expect(random).toEqual(bodiesFor(12345, DEFAULT_MAP, initialPlanets));
    expect(random.length).toBe(DEFAULT_MAP.bodyCount);
  });
});

describe('bosses', () => {
  it('guard systems 4 and 8 and are smaller targets than a planet', () => {
    const bosses = Array.from({ length: CAMPAIGN_LENGTH }, (_, i) => systemConfig(i).boss);
    expect(bosses).toEqual([null, null, null, 'moon', null, null, null, 'station']);
    for (const kind of ['moon', 'station'] as const) {
      expect(planetsFor(kind).player2.radius).toBe(BOSSES[kind].radius);
      expect(BOSSES[kind].radius).toBeLessThan(initialPlanets.player2.radius);
    }
    expect(planetsFor(null)).toBe(initialPlanets);
  });
});
