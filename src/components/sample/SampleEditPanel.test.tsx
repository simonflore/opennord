import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SampleEditPanel } from './SampleEditPanel';
import type { EditModel } from '../../lib/ns4/sample-edit';

const model: EditModel = {
  name: 'My Strings',
  zones: [{ rootKey: 60, keyLow: 0, keyHigh: 72, velTop: 127, velLow: 0 }],
};
const bytes = new Uint8Array(64); // too short for gain/detune — that block is simply skipped

describe('SampleEditPanel factory disclaimer', () => {
  it('shows the "edit it for your own use" disclaimer for a factory sample', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} bytes={bytes} codec={4} factory />);
    expect(html).toMatch(/factory sample/i);
    expect(html).toMatch(/your own use/i);
  });

  it('does not show the disclaimer for a user sample', () => {
    const html = renderToStaticMarkup(<SampleEditPanel initial={model} bytes={bytes} codec={4} />);
    expect(html).not.toMatch(/factory sample/i);
  });
});
