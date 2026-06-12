import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the web build into a native iOS app. The eventual SysEx work
// (docs/SYSEX-SPIKE.md) talks to the Nord via CoreMIDI — Web MIDI in the
// browser, a native MIDI plugin on iOS.
const config: CapacitorConfig = {
  appId: 'org.opennord.app',
  appName: 'OpenNord',
  webDir: 'dist',
};

export default config;
