import { describe, it, expect } from 'vitest';
import { cn } from '../../client/lib/utils';
import { hexToHslTriple } from '../../client/lib/color';
import { matches } from '../../client/lib/filter';

describe('utils', () => {
  it('cn merges classes', () => {
    const res = cn('a','b', { c: true, d: false });
    expect(res).toContain('a');
    expect(res).toContain('b');
  });

  it('hexToHslTriple returns HSL triple', () => {
    const hsl = hexToHslTriple('#ff0000');
    expect(typeof hsl).toBe('string');
    expect(hsl.split(' ').length).toBeGreaterThan(1);
  });

  it('matches filters by language and framework', () => {
    const c = { languages: ['JavaScript','Python'], frameworks: ['React'] };
    expect(matches(c,'JavaScript','Aucun')).toBe(true);
    expect(matches(c,'Python','React')).toBe(true);
    expect(matches(c,'Java','Aucun')).toBe(false);
    expect(matches(c,'JavaScript','Vue')).toBe(false);
  });
});
