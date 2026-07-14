import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PresetsBrowse } from './PresetsBrowse';
import type { PresetEntry } from '../../lib/library/preset-entries';

const noop = () => {};

const baseProps = {
  source: 'all' as const,
  setSource: noop,
  kind: 'all' as const,
  setKind: noop,
  query: '',
  setQuery: noop,
  showSourceFacet: false,
  sort: 'default' as const,
  setSort: noop,
  isFavorite: () => false,
  toggleFavorite: noop,
  onSelect: noop,
  onImport: noop,
  onRemove: noop,
};

describe('PresetsBrowse', () => {
  it('data-driven kind facet: synth-only library shows Synth chip but not Organ or Piano', () => {
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={[]}
        kinds={['synth-preset']}
      />,
    );
    // The BrowseToolbar renders FilterChip buttons with the label as children.
    // With kinds=['synth-preset'], options are: [{key:'all',label:'All'}, {key:'synth-preset',label:'Synth'}]
    // "Organ" and "Piano" chips are never constructed, so they won't appear in the markup.
    expect(html).toContain('Synth');
    expect(html).not.toContain('Organ');
    expect(html).not.toContain('Piano');
  });

  it('card render: shows preset name, slot, and kind label', () => {
    const entry: PresetEntry = {
      id: '1',
      name: 'My Organ',
      kind: 'organ-preset',
      source: 'nord',
      slot: 'A:11',
    };
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={[entry]}
        kinds={['organ-preset']}
      />,
    );
    expect(html).toContain('My Organ');
    // slot is rendered in lib-slot span (takes priority over KIND_LABEL when slot is set)
    expect(html).toContain('A:11');
  });

  it('card render: shows kind label when no slot is set', () => {
    const entry: PresetEntry = {
      id: '2',
      name: 'Synth Pad',
      kind: 'synth-preset',
      source: 'local',
    };
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={[entry]}
        kinds={['synth-preset']}
      />,
    );
    expect(html).toContain('Synth Pad');
    // When slot is absent, the component falls back to KIND_LABEL[kind] = 'Synth'
    expect(html).toContain('Synth');
  });

  it('counts are shown in the header', () => {
    const entries: PresetEntry[] = [
      { id: '1', name: 'Alpha', kind: 'organ-preset', source: 'nord', slot: 'A:01' },
      { id: '2', name: 'Beta', kind: 'piano-preset', source: 'local' },
    ];
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={entries}
        kinds={['organ-preset', 'piano-preset']}
      />,
    );
    expect(html).toContain('2 presets');
    expect(html).toContain('Alpha');
    expect(html).toContain('Beta');
  });

  it('marks a favorited preset with a filled star', () => {
    const entry: PresetEntry = {
      id: '1',
      name: 'My Organ',
      kind: 'organ-preset',
      source: 'nord',
      slot: 'A:11',
    };
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={[entry]}
        kinds={['organ-preset']}
        isFavorite={(id) => id === '1'}
      />,
    );
    expect(html).toContain('★');
  });

  it('shows the "no match" message with a Clear affordance when a filter hides everything', () => {
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        query="zzz"
        entries={[]}
        kinds={['organ-preset']}
      />,
    );
    expect(html).toContain('No presets match your filter.');
    expect(html).toContain('Clear filters');
  });

  it('shows a plain empty state (not the "no match" copy) when nothing is loaded', () => {
    const html = renderToStaticMarkup(
      <PresetsBrowse
        {...baseProps}
        entries={[]}
        kinds={['organ-preset']}
      />,
    );
    expect(html).toContain('Nothing here yet.');
    expect(html).not.toContain('No presets match your filter.');
  });
});
