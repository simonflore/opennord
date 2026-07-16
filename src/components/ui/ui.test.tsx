import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './Button';
import { Card } from './Card';
import { Tag } from './Tag';
import { FilterChip } from './FilterChip';
import { SourceBadge } from './SourceBadge';
import { SearchField } from './SearchField';
import { SectionLabel } from './SectionLabel';

describe('Button', () => {
  it('renders label and the primary variant fill', () => {
    const html = renderToStaticMarkup(<Button variant="primary">Send to Nord</Button>);
    expect(html).toContain('Send to Nord');
    // primary carries the red gradient fill (distinct from secondary)
    expect(html).toContain('fill-primary');
  });
  it('defaults to the secondary variant', () => {
    const html = renderToStaticMarkup(<Button>Cancel</Button>);
    expect(html).toContain('fill-raised');
    expect(html).not.toContain('fill-primary');
  });
});

describe('Card', () => {
  it('renders children with the surface fill, and swaps to the accent treatment when accent is set', () => {
    const plain = renderToStaticMarkup(<Card>hello</Card>);
    expect(plain).toContain('hello');
    expect(plain).toContain('fill-surface');

    const accented = renderToStaticMarkup(<Card accent>hello</Card>);
    expect(accented).toContain('fill-surface-accent');
    expect(accented).toContain('border-l-red');
  });
});

describe('Tag', () => {
  it('renders its label inside a raised badge', () => {
    const html = renderToStaticMarkup(<Tag>Rhodes</Tag>);
    expect(html).toContain('Rhodes');
    expect(html).toContain('fill-raised');
  });
});

describe('FilterChip', () => {
  it('marks the active chip with the primary fill', () => {
    const html = renderToStaticMarkup(<FilterChip active>On Nord</FilterChip>);
    expect(html).toContain('On Nord');
    expect(html).toContain('fill-primary');
  });
  it('renders the inactive chip with the raised fill', () => {
    const html = renderToStaticMarkup(<FilterChip>Local</FilterChip>);
    expect(html).toContain('fill-raised');
    expect(html).not.toContain('fill-primary');
  });
});

describe('SourceBadge', () => {
  it('renders the On Nord label for the nord source', () => {
    const html = renderToStaticMarkup(<SourceBadge source="nord" />);
    expect(html).toContain('On Nord');
    expect(html).toContain('text-red');
  });
  it('renders the Local label for the local source', () => {
    const html = renderToStaticMarkup(<SourceBadge source="local" />);
    expect(html).toContain('Local');
    expect(html).toContain('text-muted');
  });
});

describe('SearchField', () => {
  it('renders the placeholder on a search input inside the sunken field', () => {
    const html = renderToStaticMarkup(
      <SearchField value="" onChange={() => {}} placeholder="Search patches…" />,
    );
    expect(html).toContain('Search patches…');
    expect(html).toContain('type="search"');
    expect(html).toContain('fill-sink');
  });
});

describe('SectionLabel', () => {
  it('renders uppercase overline text', () => {
    const html = renderToStaticMarkup(<SectionLabel>Surfaces</SectionLabel>);
    expect(html).toContain('Surfaces');
    expect(html).toContain('uppercase');
  });

  it('defaults to the red accent overline (the 9 existing call sites)', () => {
    const html = renderToStaticMarkup(<SectionLabel>Your Nord</SectionLabel>);
    expect(html).toContain('text-red-bright');
    expect(html).not.toContain('font-mono');
  });

  it('renders the eyebrow variant as muted monospace', () => {
    const html = renderToStaticMarkup(<SectionLabel variant="eyebrow">Stage first, family next</SectionLabel>);
    expect(html).toContain('font-mono');
    expect(html).toContain('text-muted');
    expect(html).not.toContain('text-red-bright');
  });

  it('gives the eyebrow a decorative bullet that screen readers skip', () => {
    const html = renderToStaticMarkup(<SectionLabel variant="eyebrow">Hardware optional</SectionLabel>);
    expect(html).toContain('aria-hidden="true"');
  });
});
