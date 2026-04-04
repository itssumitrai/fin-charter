import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, registerLocale, loadLocale } from '../../src/i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('en');
  });

  describe('getLocale / setLocale', () => {
    it('defaults to en', () => {
      expect(getLocale()).toBe('en');
    });

    it('switches locale', () => {
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });
  });

  describe('t() translation', () => {
    it('returns key as fallback when no translation exists', () => {
      expect(t('unknown.key')).toBe('unknown.key');
    });

    it('returns English translation for registered key', () => {
      registerLocale('en', { 'greeting': 'Hello' });
      expect(t('greeting')).toBe('Hello');
    });

    it('returns translated string for active locale', () => {
      registerLocale('fr', { 'greeting': 'Bonjour' });
      setLocale('fr');
      expect(t('greeting')).toBe('Bonjour');
    });

    it('falls back to English when key missing in active locale', () => {
      registerLocale('en', { 'farewell': 'Goodbye' });
      registerLocale('fr', {});
      setLocale('fr');
      expect(t('farewell')).toBe('Goodbye');
    });

    it('interpolates {{param}} placeholders', () => {
      registerLocale('en', { 'welcome': 'Hello, {{name}}!' });
      expect(t('welcome', { name: 'World' })).toBe('Hello, World!');
    });

    it('interpolates multiple params', () => {
      registerLocale('en', { 'range': '{{from}} to {{to}}' });
      expect(t('range', { from: '10', to: '20' })).toBe('10 to 20');
    });

    it('interpolates numeric params', () => {
      registerLocale('en', { 'count': '{{n}} items' });
      expect(t('count', { n: 42 })).toBe('42 items');
    });

    it('leaves unmatched placeholders as-is', () => {
      registerLocale('en', { 'tpl': 'Hi {{name}}, {{missing}}' });
      expect(t('tpl', { name: 'Ada' })).toBe('Hi Ada, {{missing}}');
    });
  });

  describe('loadLocale (async)', () => {
    it('loads a locale asynchronously and makes it usable', async () => {
      await loadLocale('de', async () => ({ 'greeting': 'Hallo' }));
      setLocale('de');
      expect(t('greeting')).toBe('Hallo');
    });
  });
});
