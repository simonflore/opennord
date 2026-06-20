import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { identifyFixture, crossCheckFixture, type FixtureFinding } from './fixture-report';
import { MODELS, type NordModelId } from './partitions';

const ROOT = fileURLToPath(new URL('../../../fixtures', import.meta.url)); // <repo>/fixtures

type Row = FixtureFinding & { model: string; issues: string[] };

describe('fixtures corpus scan', () => {
  it('reports findings for any present fixtures, or notes there are none', () => {
    if (!existsSync(ROOT)) {
      console.log('[fixtures] no fixtures/ dir — drop files in fixtures/<model>/ and re-run');
      return;
    }
    const rows: Row[] = [];
    for (const id of readdirSync(ROOT)) {
      const dir = `${ROOT}/${id}`;
      if (!statSync(dir).isDirectory()) continue; // skips README.md
      if (!(id in MODELS)) { console.warn(`[fixtures] "${id}" is not a known model id — skipping`); continue; }
      for (const file of readdirSync(dir)) {
        if (!statSync(`${dir}/${file}`).isFile()) continue;
        const bytes = new Uint8Array(readFileSync(`${dir}/${file}`));
        const f = identifyFixture(file, bytes);
        const cc = crossCheckFixture(f, id as NordModelId);
        rows.push({ model: id, ...f, issues: cc.issues });
        const detail = f.tag ?? f.sampleCodec ?? (f.zipEntries ? `${f.zipEntries.length} entries` : '');
        console.log(`[fixtures] ${id}/${file}: ${f.kind} ${detail} ${f.headerOk ? 'OK' : 'FAIL'}` +
          (cc.issues.length ? ` — ${cc.issues.join('; ')}` : ''));
      }
    }
    if (rows.length === 0) {
      console.log('[fixtures] corpus is empty — drop files in fixtures/<model>/ and re-run');
    } else {
      writeFileSync(`${ROOT}/.report.json`, JSON.stringify(rows, null, 2));
      console.log(`[fixtures] ${rows.length} file(s) across ${new Set(rows.map((r) => r.model)).size} model(s); report → fixtures/.report.json`);
    }
    expect(Array.isArray(rows)).toBe(true); // the scanner ran; findings are informational
  });
});
