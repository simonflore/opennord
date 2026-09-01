// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SlotTag, genTone } from './SlotTag';

afterEach(cleanup);

describe('genTone — program generation → badge tone', () => {
  it('maps each Nord Stage generation to its program tone', () => {
    expect(genTone('Stage 2')).toBe('ns2p');
    expect(genTone('Stage 3')).toBe('ns3f');
    expect(genTone('Stage 4')).toBe('ns4p');
  });

  it('has no tone for an unknown generation', () => {
    expect(genTone(undefined)).toBeUndefined();
  });
});

describe('SlotTag — program tones reuse the nsmp grey/blue/red', () => {
  it('colors a Stage 2 program grey (muted), like nsmp', () => {
    render(<SlotTag tone="ns2p">.ns2p</SlotTag>);
    expect(screen.getByText('.ns2p')).toHaveClass('text-muted');
  });

  it('colors a Stage 3 program blue (lcd-cyan), like nsmp3', () => {
    render(<SlotTag tone="ns3f">.ns3f</SlotTag>);
    expect(screen.getByText('.ns3f')).toHaveClass('text-lcd-cyan');
  });

  it('colors a Stage 4 program red, like nsmp4', () => {
    render(<SlotTag tone="ns4p">.ns4p</SlotTag>);
    expect(screen.getByText('.ns4p')).toHaveClass('text-red');
  });
});
