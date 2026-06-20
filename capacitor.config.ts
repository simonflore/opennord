import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the web build into a native iOS app (target: iPad, M1+).
// Device transfer is VENDOR USB, not SysEx/CoreMIDI: on iPad it rides a native
// DriverKit DEXT via a custom Capacitor plugin (docs/IPAD.md, docs/PROTOCOL-RE.md).
// Desktop uses WebUSB (src/lib/device/webusb.ts). The old SysEx framing is dead.
const config: CapacitorConfig = {
  appId: 'org.opennord.app',
  appName: 'OpenNord',
  webDir: 'dist',
};

export default config;
