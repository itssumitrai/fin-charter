import { describe, it, expect } from 'vitest';
import { detectDirection, mirrorX, resolveTextAlign } from '@/core/rtl';

describe('detectDirection', () => {
  it('returns rtl for Arabic', () => {
    expect(detectDirection('ar')).toBe('rtl');
    expect(detectDirection('ar-SA')).toBe('rtl');
  });

  it('returns rtl for Hebrew', () => {
    expect(detectDirection('he')).toBe('rtl');
    expect(detectDirection('he-IL')).toBe('rtl');
  });

  it('returns rtl for Persian', () => {
    expect(detectDirection('fa')).toBe('rtl');
  });

  it('returns ltr for English', () => {
    expect(detectDirection('en')).toBe('ltr');
    expect(detectDirection('en-US')).toBe('ltr');
  });

  it('returns ltr for unknown locales', () => {
    expect(detectDirection('xx')).toBe('ltr');
  });
});

describe('mirrorX', () => {
  it('mirrors X coordinate in RTL mode', () => {
    expect(mirrorX(100, 800, true)).toBe(700);
    expect(mirrorX(0, 800, true)).toBe(800);
    expect(mirrorX(800, 800, true)).toBe(0);
  });

  it('passes through in LTR mode', () => {
    expect(mirrorX(100, 800, false)).toBe(100);
  });
});

describe('resolveTextAlign', () => {
  it('returns correct alignment for LTR', () => {
    expect(resolveTextAlign('start', false)).toBe('left');
    expect(resolveTextAlign('end', false)).toBe('right');
  });

  it('returns mirrored alignment for RTL', () => {
    expect(resolveTextAlign('start', true)).toBe('right');
    expect(resolveTextAlign('end', true)).toBe('left');
  });
});
