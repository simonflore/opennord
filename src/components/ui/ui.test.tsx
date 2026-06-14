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
  it('renders label and the variant class', () => {
    const html = renderToStaticMarkup(<Button variant="primary">Send to Nord</Button>);
    expect(html).toContain('Send to Nord');
    expect(html).toContain('on-btn');
    expect(html).toContain('on-btn--primary');
  });
  it('defaults to the secondary variant', () => {
    const html = renderToStaticMarkup(<Button>Cancel</Button>);
    expect(html).toContain('on-btn--secondary');
  });
});

describe('Card', () => {
  it('renders children and adds the accent modifier when accent is set', () => {
    const html = renderToStaticMarkup(<Card accent>hello</Card>);
    expect(html).toContain('hello');
    expect(html).toContain('on-card');
    expect(html).toContain('on-card--accent');
  });
});

describe('Tag', () => {
  it('renders its label inside a tag', () => {
    const html = renderToStaticMarkup(<Tag>Rhodes</Tag>);
    expect(html).toContain('Rhodes');
    expect(html).toContain('on-tag');
  });
});

describe('FilterChip', () => {
  it('marks the active chip', () => {
    const html = renderToStaticMarkup(<FilterChip active>On Nord</FilterChip>);
    expect(html).toContain('On Nord');
    expect(html).toContain('on-chip--active');
  });
});

describe('SourceBadge', () => {
  it('renders the On Nord label for the nord source', () => {
    const html = renderToStaticMarkup(<SourceBadge source="nord" />);
    expect(html).toContain('On Nord');
    expect(html).toContain('on-badge--nord');
  });
  it('renders the Local label for the local source', () => {
    const html = renderToStaticMarkup(<SourceBadge source="local" />);
    expect(html).toContain('Local');
    expect(html).toContain('on-badge--local');
  });
});

describe('SearchField', () => {
  it('renders the placeholder', () => {
    const html = renderToStaticMarkup(
      <SearchField value="" onChange={() => {}} placeholder="Search patches…" />,
    );
    expect(html).toContain('Search patches…');
    expect(html).toContain('on-search');
  });
});

describe('SectionLabel', () => {
  it('renders uppercase overline text', () => {
    const html = renderToStaticMarkup(<SectionLabel>Surfaces</SectionLabel>);
    expect(html).toContain('Surfaces');
    expect(html).toContain('on-overline');
  });
});
