import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FxPanel } from './FxPanel';
import type { FxPanelView, FxUnitView } from '../../lib/clavia/fx-view';

const panel = (units: FxUnitView[], label = 'Synth A·B'): FxPanelView =>
  ({ groups: [{ key: 'g', label, kind: 'synth', units }] });
const html = (view: FxPanelView, title?: string) => renderToStaticMarkup(<FxPanel view={view} title={title} />);

describe('FxPanel', () => {
  it('renders nothing for a panel with no groups', () => {
    expect(html({ groups: [] })).toBe('');
  });

  it('draws the title, the group label and its kind', () => {
    const out = html(panel([{ key: 'r', label: 'Reverb', on: true, params: [] }]), 'LAYER FX');
    expect(out).toContain('LAYER FX');
    expect(out).toContain('Synth A·B');
    expect(out).toContain('data-kind="synth"');
  });

  it('draws an on unit with its type, knobs and switches', () => {
    const out = html(panel([{
      key: 'd', label: 'Delay', on: true, type: 'Analog',
      params: [{ label: 'Mix', value: '1.2', fill: 12 }, { label: 'Tempo', value: '1/8 dotted' }],
      switches: [{ label: 'Ping Pong', on: true }, { label: 'Mst Clk', on: false }],
    }]));
    expect(out).toContain('aria-label="Delay on"');
    expect(out).toContain('Analog');
    expect(out).toContain('1.2');
    expect(out).toContain('Mix');
    expect(out).toContain('--v:12');
    // A value with a position gets a small knob beside its number; one without is a plain readout.
    expect(out).toMatch(/class="ps-fxparam"><div class="ps-dial ps-fxdial"[^>]*><i><\/i><\/div><div class="ps-fxval"><b>1\.2<\/b><span>Mix<\/span>/);
    expect(out).toMatch(/class="ps-fxparam"><div class="ps-fxval"><span>Tempo<\/span><b>1\/8 dotted<\/b>/);
    expect(out).not.toContain('ps-dial-flat');
    expect(out.match(/ps-fxdial/g)).toHaveLength(1);
    expect(out).not.toContain('NaN');
    expect(out).toMatch(/class="ps-fxled on">Ping Pong/);
    expect(out).toMatch(/class="ps-fxled">Mst Clk/);
  });

  it("draws a block's settings in the order it is given: the panel's own", () => {
    const out = html(panel([{
      key: 'd', label: 'Delay', on: true,
      params: [{ label: 'Rate', value: '288 ms' }, { label: 'Feedback', value: '2.2', fill: 22 }, { label: 'Mix', value: '3.0', fill: 30 }, { label: 'Filter', value: 'LP' }],
    }]));
    const at = (label: string) => out.indexOf(`>${label}<`);
    expect([at('Rate'), at('Feedback'), at('Mix'), at('Filter')].every((i) => i > 0)).toBe(true);
    expect(at('Rate')).toBeLessThan(at('Feedback'));
    expect(at('Feedback')).toBeLessThan(at('Mix'));
    expect(at('Mix')).toBeLessThan(at('Filter'));
  });

  it('draws an off unit dimmed, with its name and nothing else', () => {
    const out = html(panel([{
      key: 'c', label: 'Comp', on: false, type: 'Fast',
      params: [{ label: 'Amount', value: '3.8', fill: 38 }], switches: [{ label: 'Fast', on: true }],
    }]));
    expect(out).toContain('aria-label="Comp off"');
    expect(out).toContain('class="ps-fxunit off"');
    expect(out).not.toContain('3.8');
    expect(out).not.toContain('ps-fxled');
  });

  it('draws the EQ curve of an on unit that has one', () => {
    const out = html(panel([{
      key: 'a', label: 'Amp/EQ', on: true, type: 'EQ only', params: [],
      eq: { bassDb: -5, midDb: 0, trebDb: 3, midHz: 999 },
    }]));
    expect(out).toContain('ps-eq');
    expect(out).toContain('EQ: bass -5 dB');
  });

  it('draws source LEDs, lighting the selected engine', () => {
    const out = html(panel([{
      key: 'f', label: 'Effect 1', on: true, params: [],
      source: [{ label: 'Organ', on: false }, { label: 'Piano', on: true }, { label: 'Synth', on: false }],
    }]));
    expect(out).toContain('ps-fxsrc');
    expect(out).toMatch(/class="ps-fxled on">Piano/);
    expect(out).toMatch(/class="ps-fxled">Organ/);
  });

  it('says in words what the LEDs show, for a reader who cannot see them', () => {
    const out = html(panel([{
      key: 'f', label: 'Effect 1', on: true, params: [],
      switches: [{ label: 'Ping Pong', on: true }, { label: 'Mst Clk', on: false }],
      source: [{ label: 'Organ', on: false }, { label: 'Piano', on: true }, { label: 'Synth', on: false }],
    }]));
    expect(out).toContain('role="group" aria-label="Ping Pong on, Mst Clk off"');
    expect(out).toContain('role="group" aria-label="Acts on Piano"');
    expect(out).toContain('<ol class="ps-fxunits" aria-label="Synth A·B effects">');
  });

  it('gives every row the same columns: one per unit of the widest row', () => {
    const u = (key: string) => ({ key, label: key, on: false, params: [] });
    const out = html({ groups: [
      { key: 'a', label: 'Organ', kind: 'organ', units: ['1', '2', '3', '4', '5', '6'].map(u) },
      { key: 'b', label: 'Rotary', kind: 'organ', units: [u('r')] },
    ] });
    expect(out.match(/--fx-cols:6/g)).toHaveLength(1);
  });

  it('omits the label cell for a lone rack with an empty label', () => {
    const out = html({ groups: [{ key: 'FX', label: '', units: [{ key: 'r', label: 'Reverb', on: true, params: [] }] }] });
    expect(out).not.toContain('ps-fxgroup-lbl');
  });
});
