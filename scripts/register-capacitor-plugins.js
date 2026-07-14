// Keeps the custom NordUsb plugin registered across `npx cap sync`, which
// regenerates ios/App/App/capacitor.config.json. Run after every cap sync.
// (Pattern from the vitronitor starter.) Native source: plugins/capacitor-nord-usb.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLUGIN_CLASS = 'NordUsbPlugin';
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
  const updated = injectPluginRegistration(readFileSync(CONFIG_PATH, 'utf8'), PLUGIN_CLASS);
  writeFileSync(CONFIG_PATH, updated);
  console.log(`[register-capacitor-plugins] ensured ${PLUGIN_CLASS} in ${CONFIG_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
