import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Knob, DrawbarLadder, Lcd, Chip, Meter } from './widgets';

describe('widgets', () => {
  it('Knob renders value + caption', () => {
    const html = renderToStaticMarkup(<Knob value="84" caption="cutoff" fill={66} />);
    expect(html).toContain('84');
    expect(html).toContain('cutoff');
    expect(html).toContain('--v:66');
  });

  it('DrawbarLadder renders one bar per value', () => {
    const html = renderToStaticMarkup(<DrawbarLadder values={[8, 0, 4]} />);
    expect(html.split('ps-bar').length - 1).toBe(3);
  });

  it('Lcd renders primary + secondary', () => {
    const html = renderToStaticMarkup(<Lcd primary="Saw" secondary="LP12 · 84" />);
    expect(html).toContain('Saw');
    expect(html).toContain('LP12 · 84');
  });

  it('Chip renders label + detail', () => {
    const html = renderToStaticMarkup(<Chip label="REVERB" detail="Hall" />);
    expect(html).toContain('REVERB');
    expect(html).toContain('Hall');
  });

  it('Meter renders label, value, and a clamped fill width', () => {
    const html = renderToStaticMarkup(<Meter label="vol" value="-4.7 dB" fill={77} />);
    expect(html).toContain('-4.7 dB');
    expect(html).toContain('width:77%');
  });
});
