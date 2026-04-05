import { describe, it, expect } from 'vitest';
import { detectDirection, mirrorX, textAlign } from '@/core/rtl';

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

describe('textAlign', () => {
  it('returns correct alignment for LTR', () => {
    expect(textAlign('start', false)).toBe('left');
    expect(textAlign('end', false)).toBe('right');
  });

  it('returns mirrored alignment for RTL', () => {
    expect(textAlign('start', true)).toBe('right');
    expect(textAlign('end', true)).toBe('left');
  });
});
