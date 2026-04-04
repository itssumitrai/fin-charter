import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [svelte()],
  resolve: {
    alias: [
      { find: 'fin-charter/indicators', replacement: resolve(__dirname, '../src/indicators/index.ts') },
      { find: 'fin-charter/market', replacement: resolve(__dirname, '../src/market/index.ts') },
      { find: 'fin-charter/formatting', replacement: resolve(__dirname, '../src/formatting/index.ts') },
      { find: 'fin-charter/timezone', replacement: resolve(__dirname, '../src/timezone/index.ts') },
      { find: 'fin-charter/currency', replacement: resolve(__dirname, '../src/currency/index.ts') },
      { find: 'fin-charter/i18n', replacement: resolve(__dirname, '../src/i18n/index.ts') },
      { find: 'fin-charter', replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, '/v8/finance/chart'),
      },
    },
  },
});
