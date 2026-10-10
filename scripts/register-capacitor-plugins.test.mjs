import { describe, expect, it } from 'vitest';
import { injectPluginRegistration, PLUGIN_CLASSES } from './register-capacitor-plugins.js';

describe('injectPluginRegistration', () => {
  it('adds the plugin class to packageClassList', () => {
    const input = JSON.stringify({ packageClassList: ['SplashScreen'] });
    const out = JSON.parse(injectPluginRegistration(input, 'NordUsbPlugin'));
    expect(out.packageClassList).toContain('NordUsbPlugin');
    expect(out.packageClassList).toContain('SplashScreen');
  });
  it('is idempotent', () => {
    const input = JSON.stringify({ packageClassList: ['NordUsbPlugin'] });
    const out = JSON.parse(injectPluginRegistration(input, 'NordUsbPlugin'));
    expect(out.packageClassList.filter((c) => c === 'NordUsbPlugin')).toHaveLength(1);
  });
  it('creates the list when missing', () => {
    const out = JSON.parse(injectPluginRegistration('{}', 'NordUsbPlugin'));
    expect(out.packageClassList).toEqual(['NordUsbPlugin']);
  });
  it('registers both in-repo native plugins (USB transfer + MIDI input)', () => {
    expect(PLUGIN_CLASSES).toEqual(['NordUsbPlugin', 'MidiInputPlugin']);
    let config = JSON.stringify({ packageClassList: ['SplashScreen', 'NordUsbPlugin'] });
    for (const c of PLUGIN_CLASSES) config = injectPluginRegistration(config, c);
    expect(JSON.parse(config).packageClassList).toEqual(['SplashScreen', 'NordUsbPlugin', 'MidiInputPlugin']);
  });
});
