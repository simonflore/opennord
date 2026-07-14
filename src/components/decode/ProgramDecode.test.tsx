// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IdentifyPanel } from './ProgramDecode';
import { summarizeFile } from '@/lib/clavia/identify-summary';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL as NodeURL } from 'node:url';

const ns4p = new Uint8Array(
  readFileSync(fileURLToPath(new NodeURL('../../lib/ns4/__fixtures__/BreakFreeSolo.ns4p', import.meta.url))));

describe('IdentifyPanel', () => {
  it('shows the model, tag, and a registry match', () => {
    const html = renderToStaticMarkup(<IdentifyPanel summary={summarizeFile('BreakFreeSolo.ns4p', ns4p)} />);
    expect(html).toContain('stage-4');
    expect(html).toContain('ns4p');
    expect(html.toLowerCase()).toContain('matches');
  });
});
