/**
 * macOS signing hook for electron-builder (`build.mac.sign`).
 *
 * electron-builder 26 hands the certificate to `codesign` by NAME. `codesign`
 * cannot find a certificate whose name contains a non-ASCII character that way
 * ("Developer ID Application: Simon Floré (…): no identity found" — seen on
 * macOS 27 in every spelling of the é), although the same certificate signs
 * fine by its SHA-1 fingerprint, which is how electron-builder 25 did it.
 *
 * So this does what the default does, except that it names the certificate by
 * fingerprint. Nothing here is machine-specific: the fingerprint is read from
 * the keychain at pack time. electron-builder only calls the hook when it has
 * already found a signing identity, so a machine without one still skips
 * signing as before.
 */
const { execFileSync } = require('node:child_process');

exports.default = async function signMac(options) {
  const identities = execFileSync('/usr/bin/security', ['find-identity', '-v', '-p', 'codesigning'], { encoding: 'utf8' });
  const match = identities.match(/\b([0-9A-F]{40})\s+"Developer ID Application: /);
  if (!match) throw new Error('No "Developer ID Application" certificate in the keychain to sign with.');
  const { signAsync } = await import('@electron/osx-sign');
  await signAsync({ ...options, identity: match[1] });
};
