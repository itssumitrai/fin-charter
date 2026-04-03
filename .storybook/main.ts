import type { StorybookConfig } from '@storybook/html-vite';
import { mergeConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: '@storybook/html-vite',
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          'fin-charter': resolve(__dirname, '../src/index.ts'),
          'fin-charter/indicators': resolve(__dirname, '../src/indicators/index.ts'),
        },
      },
    });
  },
};
export default config;
