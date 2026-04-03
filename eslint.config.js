import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        ResizeObserver: 'readonly',
        PointerEvent: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        devicePixelRatio: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'dev/'],
  },
];
