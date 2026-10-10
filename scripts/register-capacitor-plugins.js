// Keeps the in-repo custom Capacitor plugins registered across `npx cap sync`,
// which regenerates ios/App/App/capacitor.config.json. Run after every cap sync.
// (Pattern from the vitronitor starter.) Native sources:
//   NordUsbPlugin   — plugins/capacitor-nord-usb   (vendor-USB transfer, DriverKit)
//   MidiInputPlugin — plugins/capacitor-midi-input (MIDI keyboard input, CoreMIDI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const PLUGIN_CLASSES = ['NordUsbPlugin', 'MidiInputPlugin'];
const CONFIG_PATH = 'ios/App/App/capacitor.config.json';

/** Return `configJson` with `className` present in its packageClassList (idempotent). */
export function injectPluginRegistration(configJson, className) {
  const config = JSON.parse(configJson);
  const list = Array.isArray(config.packageClassList) ? config.packageClassList : [];
  if (!list.includes(className)) list.push(className);
  config.packageClassList = list;
  return JSON.stringify(config, null, 2);
}

function main() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`[register-capacitor-plugins] ${CONFIG_PATH} not found — run \`npx cap add ios\` first.`);
    process.exit(1);
  }
  let config = readFileSync(CONFIG_PATH, 'utf8');
  for (const className of PLUGIN_CLASSES) config = injectPluginRegistration(config, className);
  writeFileSync(CONFIG_PATH, config);
  console.log(`[register-capacitor-plugins] ensured ${PLUGIN_CLASSES.join(', ')} in ${CONFIG_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
