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
    css: false,
    // Don't descend into sibling git worktrees (.claude/worktrees/*) — they carry
    // their own test files (and deps like jsdom) that aren't part of this project.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
});
