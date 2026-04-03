import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      'fin-charter': resolve(__dirname, '../src/index.ts'),
      'fin-charter/indicators': resolve(__dirname, '../src/indicators/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
