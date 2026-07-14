// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FixtureLoader } from './FixtureLoader';

vi.mock('../../lib/dev/fixtures-client', () => ({
  corpusAvailable: false, listCorpus: vi.fn(), getCorpusFile: vi.fn(),
}));

describe('FixtureLoader', () => {
  it('renders nothing when the corpus is unavailable', () => {
    expect(renderToStaticMarkup(<FixtureLoader onLoad={() => {}} />)).toBe('');
  });
});
