import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { corpusManifest, resolveFixturePath } from './fixtures-fs';

/** Dev-only bridge that serves the gitignored `fixtures/` corpus to the browser. Never bundled. */
export function fixturesDevPlugin(): Plugin {
  const root = resolve(process.cwd(), 'fixtures');
  return {
    name: 'opennord-fixtures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__fixtures/list', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ models: corpusManifest(root) }));
      });
      server.middlewares.use('/__fixtures/get', (req, res) => {
        const q = new URL(req.originalUrl ?? req.url ?? '', 'http://localhost').searchParams;
        const abs = resolveFixturePath(root, q.get('model') ?? '', q.get('name') ?? '');
        if (!abs) { res.statusCode = 400; res.end('bad path'); return; }
        try {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.end(readFileSync(abs));
        } catch { res.statusCode = 404; res.end('not found'); }
      });
    },
  };
}
