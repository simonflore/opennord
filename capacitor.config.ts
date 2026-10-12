import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the web build into the native iPad app under ios/ (M1+).
// Device transfer is VENDOR USB, not SysEx/CoreMIDI: on iPad it rides a DriverKit
// DEXT via the capacitor-nord-usb plugin.
// Desktop uses WebUSB (src/lib/device/webusb.ts) or node-usb (electron/).
const config: CapacitorConfig = {
  appId: 'org.opennord.app',
  appName: 'OpenNord',
  webDir: 'dist',
};

export default config;
