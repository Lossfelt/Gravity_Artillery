import { Ammo, ShotKind, SpecialShot } from '../types/game';

export const SHOT_INFO: Record<ShotKind, { label: string; hint: string }> = {
  standard: { label: 'Standard', hint: 'An ordinary shot' },
  homing: { label: 'Homing', hint: 'Turns towards the enemy planet in the last stretch' },
  splitter: { label: 'Splitter', hint: 'Three shots, 3° apart' },
  phase: { label: 'Phase', hint: 'Ignores the stars. Only black holes bend it' }
};

const ORDER: ShotKind[] = ['standard', 'homing', 'splitter', 'phase'];

/** The next shot kind there is ammunition for, wrapping round to standard. */
export const nextShot = (current: ShotKind, ammo: Ammo): ShotKind => {
  for (let i = 1; i <= ORDER.length; i++) {
    const shot = ORDER[(ORDER.indexOf(current) + i) % ORDER.length];
    if (shot === 'standard' || ammo[shot as SpecialShot] > 0) return shot;
  }
  return 'standard';
};

export const hasAmmo = (ammo: Ammo) => Object.values(ammo).some(count => count > 0);
