import { BODY_TYPES } from '../constants/game';
import { GravityBody, Planet } from '../types/game';
import { generateGravitationalBodies, MapOptions } from '../utils/generateGravitationalBodies';
import { createRandom } from '../utils/random';
import { BossKind } from './campaign';

// Hand-made maps for the boss fights. A map is still identified by a seed
// number in the game model; preset maps use seeds from 2^32 up, above any
// random seed (randomSeed gives 0 .. 2^32 - 1), so one number covers both.

export const PRESET_SEED_BASE = 2 ** 32;

const TYPES = { blue: BODY_TYPES.BLUE_STAR, white: BODY_TYPES.WHITE_STAR, red: BODY_TYPES.RED_STAR, hole: BODY_TYPES.BLACK_HOLE };
type PresetBody = [keyof typeof TYPES, number, number];

export type PresetMap = { name: string; boss: BossKind; bodies: PresetBody[] };

// Scouted with the boss's size (moon 16, station 13): see the test for the tiers
export const PRESET_MAPS: PresetMap[] = [
  {
    name: 'Twin Suns',
    boss: 'moon',
    bodies: [['blue', 430, 230], ['blue', 570, 370], ['red', 260, 450], ['white', 740, 150], ['red', 650, 520]]
  },
  {
    name: 'The Wall',
    boss: 'moon',
    bodies: [['white', 500, 110], ['red', 500, 225], ['hole', 500, 365], ['white', 500, 490], ['blue', 680, 310]]
  },
  {
    name: 'Hidden Well',
    boss: 'moon',
    bodies: [['hole', 520, 280], ['blue', 320, 430], ['white', 700, 150], ['red', 300, 140], ['red', 700, 470]]
  },
  {
    name: 'The Crown',
    boss: 'station',
    bodies: [['red', 760, 110], ['white', 730, 300], ['red', 760, 490], ['hole', 560, 330], ['blue', 400, 190], ['white', 380, 420], ['red', 250, 300]]
  },
  {
    name: 'Black Corridor',
    boss: 'station',
    bodies: [['hole', 450, 190], ['hole', 600, 420], ['white', 300, 120], ['blue', 300, 480], ['red', 750, 150], ['white', 750, 450], ['red', 520, 530]]
  },
  {
    name: 'Gauntlet',
    boss: 'station',
    bodies: [['red', 250, 210], ['white', 350, 390], ['blue', 450, 200], ['blue', 560, 400], ['white', 660, 210], ['red', 760, 380], ['hole', 505, 290]]
  }
];

export const isPresetSeed = (seed: number) => seed >= PRESET_SEED_BASE;

export const presetOf = (seed: number): PresetMap | null =>
  isPresetSeed(seed) ? PRESET_MAPS[seed - PRESET_SEED_BASE] ?? null : null;

/** Seeds of the preset maps for a boss. */
export const presetSeeds = (boss: BossKind) =>
  PRESET_MAPS.flatMap((map, i) => (map.boss === boss ? [PRESET_SEED_BASE + i] : []));

const toBodies = (map: PresetMap): GravityBody[] =>
  map.bodies.map(([type, x, y]) => {
    const { mass, radius, color, type: kind } = TYPES[type];
    return { x, y, mass, radius, color, type: kind, ...('sprite' in TYPES[type] && { sprite: (TYPES[type] as { sprite: string }).sprite }) };
  });

/** The stars and black holes for a map seed: a preset map, or one generated from the seed. */
export const bodiesFor = (seed: number, options: MapOptions, planets: { player1: Planet; player2: Planet }): GravityBody[] => {
  const preset = presetOf(seed);
  return preset ? toBodies(preset) : generateGravitationalBodies(planets, createRandom(seed), options);
};
