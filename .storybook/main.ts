import type { StorybookConfig } from '@storybook/html-vite';
import { mergeConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/html-vite',
  viteFinal: async (config) => {
    return mergeConfig(config, {
      server: {
        proxy: {
          '/api/yahoo': {
            target: 'https://query1.finance.yahoo.com',
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/api\/yahoo/, '/v8/finance/chart'),
          },
        },
      },
      resolve: {
        alias: [
          { find: '@itssumitrai/fin-charter/indicators', replacement: resolve(__dirname, '../src/indicators/index.ts') },
          { find: '@itssumitrai/fin-charter/market', replacement: resolve(__dirname, '../src/market/index.ts') },
          { find: '@itssumitrai/fin-charter/formatting', replacement: resolve(__dirname, '../src/formatting/index.ts') },
          { find: '@itssumitrai/fin-charter/timezone', replacement: resolve(__dirname, '../src/timezone/index.ts') },
          { find: '@itssumitrai/fin-charter/currency', replacement: resolve(__dirname, '../src/currency/index.ts') },
          { find: '@itssumitrai/fin-charter/i18n', replacement: resolve(__dirname, '../src/i18n/index.ts') },
          { find: '@itssumitrai/fin-charter/core/accessibility', replacement: resolve(__dirname, '../src/core/accessibility.ts') },
          { find: '@itssumitrai/fin-charter/core/chart-sync', replacement: resolve(__dirname, '../src/core/chart-sync.ts') },
          { find: '@itssumitrai/fin-charter/core/symbol-resolver', replacement: resolve(__dirname, '../src/core/symbol-resolver.ts') },
          { find: '@itssumitrai/fin-charter', replacement: resolve(__dirname, '../src/full.ts') },
        ],
      },
    });
  },
};
export default config;
