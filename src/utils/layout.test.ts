import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout';

describe('layoutFor', () => {
  it('stacks the controls on a phone held upright', () => {
    expect(layoutFor(390, 844)).toBe('stacked');
  });

  it('uses compact side controls on a phone held sideways, even when it is wider than 768 px', () => {
    expect(layoutFor(844, 390)).toBe('compact');
    expect(layoutFor(915, 300)).toBe('compact');
  });

  it('uses full side controls on tablets and desktops', () => {
    expect(layoutFor(1024, 768)).toBe('sides');
    expect(layoutFor(768, 1024)).toBe('sides');
    expect(layoutFor(1440, 900)).toBe('sides');
  });
});
