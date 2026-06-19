import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Default env stays node (fast, matches the pure-logic decoder tests).
    // DOM-dependent tests opt in per-file with `// @vitest-environment jsdom`.
    css: false,
  },
});
