import { describe, it, expect } from 'vitest';
import { formatVolume } from '../../src/formatting/volume-formatter';

describe('formatVolume', () => {
  it('formats trillions', () => {
    expect(formatVolume(1_500_000_000_000)).toBe('1.50T');
  });

  it('formats billions', () => {
    expect(formatVolume(2_340_000_000)).toBe('2.34B');
  });

  it('formats millions', () => {
    expect(formatVolume(5_670_000)).toBe('5.67M');
  });

  it('formats thousands', () => {
    expect(formatVolume(12_345)).toBe('12.35K');
  });

  it('formats small numbers without suffix', () => {
    expect(formatVolume(999)).toBe('999');
  });

  it('formats zero', () => {
    expect(formatVolume(0)).toBe('0');
  });

  it('formats negative numbers', () => {
    expect(formatVolume(-5_000_000)).toBe('-5.00M');
  });

  it('handles NaN', () => {
    expect(formatVolume(NaN)).toBe('-');
  });

  it('handles Infinity', () => {
    expect(formatVolume(Infinity)).toBe('-');
  });
});
