import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { fixturesDevPlugin } from './src/dev/fixtures-plugin';

export default defineConfig({
  plugins: [react(), fixturesDevPlugin()],
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Default env stays node (fast, matches the pure-logic decoder tests).
    // DOM-dependent tests opt in per-file with `// @vitest-environment jsdom`.
    css: false,
    // A few OG/NW1 sample-codec round-trip tests do heavy DSP over real strokes
    // (~3–7s each); under full-suite parallel CPU contention they cross the default
    // 5000ms per-test timeout and flake. 30s gives headroom while a true hang still
    // fails reasonably fast.
    testTimeout: 30_000,
    // Don't descend into sibling git worktrees (.claude/worktrees/*) — they carry
    // their own test files (and deps like jsdom) that aren't part of this project.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
});
