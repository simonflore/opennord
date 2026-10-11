// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EngineTags } from './EngineTags';

afterEach(cleanup);

describe('EngineTags — engine axis (Stage 4)', () => {
  it('names each engine’s layers', () => {
    render(<EngineTags summary={{ axis: 'engine', engines: [
      { kind: 'piano', layers: ['A', 'B'] },
    ] }} />);
    expect(screen.getByText('piano: A, B')).toBeInTheDocument();
  });
});

describe('EngineTags — container axis (Stage 2/3)', () => {
  it('uses the instrument’s word for the container', () => {
    render(<EngineTags summary={{ axis: 'container', term: 'Slot', groups: [
      { id: 'B', engines: ['synth'] },
    ] }} />);
    expect(screen.getByText('Slot B')).toBeInTheDocument();
  });
});

describe('EngineTags — nothing active', () => {
  it('says empty rather than rendering a blank row', () => {
    render(<EngineTags summary={{ axis: 'engine', engines: [] }} />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('says empty for a container with no groups', () => {
    render(<EngineTags summary={{ axis: 'container', term: 'Panel', groups: [] }} />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });
});
