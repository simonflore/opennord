// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EngineTags } from './EngineTags';

afterEach(cleanup);

describe('EngineTags — engine axis (Stage 4)', () => {
  it('shows ×N on the card only when a layer stacks', () => {
    render(<EngineTags summary={{ axis: 'engine', engines: [
      { kind: 'organ', layers: ['A'] }, { kind: 'piano', layers: ['A', 'B'] },
    ] }} />);
    expect(screen.getByText('organ')).toBeInTheDocument();
    expect(screen.getByText('piano ×2')).toBeInTheDocument();
  });

  it('names the layers in detail mode', () => {
    render(<EngineTags detail summary={{ axis: 'engine', engines: [
      { kind: 'piano', layers: ['A', 'B'] },
    ] }} />);
    expect(screen.getByText('piano: A, B')).toBeInTheDocument();
  });
});

describe('EngineTags — container axis (Stage 2/3)', () => {
  it('uses the bare letter on the card', () => {
    render(<EngineTags summary={{ axis: 'container', term: 'Panel', groups: [
      { id: 'A', engines: ['organ'] },
    ] }} />);
    expect(screen.getByText('A:')).toBeInTheDocument();
    expect(screen.getByText('organ')).toBeInTheDocument();
  });

  it('uses the instrument’s word in detail mode', () => {
    render(<EngineTags detail summary={{ axis: 'container', term: 'Slot', groups: [
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
