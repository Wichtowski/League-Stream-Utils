import { defineConfig } from 'vite';
import vinext from 'vinext';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [vinext(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  ssr: {
    external: ['mongodb', 'mongoose', 'pg', 'kysely', 'better-sqlite3'],
  },
});
