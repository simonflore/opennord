// Which page a desktop pack carries, and what a handed-in page must look like —
// as pure functions (desktop-page-rules.test.mjs). scripts/desktop-page.mjs
// applies them to the disk.
//
// A pack carries one of two pages:
//   - this package's own (`npm run build:electron`): the open app. The default,
//     and all that exists in the public repository.
//   - one handed in through the environment, built elsewhere. A release hands in
//     the page that adds community browsing (electron/README.md, "Packing").
//
// A handed-in page is checked before it is packed and again inside the packed
// app. It must carry the server address it was built for, and nothing that
// signs anyone in: the desktop app has no sign-in, and an installer stays in
// use for as long as someone keeps it.

/** Directory of the page to pack instead of this package's own. */
export const PAGE_DIR_ENV = 'OPENNORD_DESKTOP_PAGE';
/** The server address that page must carry. Required with PAGE_DIR_ENV. */
export const PAGE_API_ENV = 'OPENNORD_DESKTOP_API_URL';

/** Build settings of the website that must never reach a desktop page. */
const WEBSITE_ONLY_SETTINGS = ['VITE_ZITADEL_ISSUER', 'VITE_ZITADEL_CLIENT_ID', 'VITE_ZITADEL_ORG_ID', 'VITE_DIAGNOSTICS_URL'];
/** Present in any page that bundles the sign-in library, configured or not. */
const SIGN_IN_CODE = '.well-known/openid-configuration';

export function pagePlan(env) {
  const dir = (env[PAGE_DIR_ENV] ?? '').trim();
  if (!dir) return { kind: 'own' };
  return { kind: 'provided', dir, apiUrl: (env[PAGE_API_ENV] ?? '').trim() };
}

/** Why `apiUrl` is not an address a release can ship, or null. */
function addressProblem(apiUrl) {
  if (!apiUrl) return `${PAGE_API_ENV} is not set — the pack cannot tell which server address the page must carry.`;
  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return `${PAGE_API_ENV} is not an address: ${apiUrl}`;
  }
  if (url.protocol !== 'https:') return `The server address must be https: ${apiUrl}`;
  if (apiUrl !== url.origin) return `The server address must be the address alone, with no path: ${apiUrl}`;
  if (/placeholder|example|localhost|todo|changeme/i.test(url.hostname)) return `The server address is a placeholder, not a real server: ${apiUrl}`;
  return null;
}

/**
 * What is wrong with what a page (or a packed app) contains. `contains(needle)`
 * answers for the whole of it. `signInCode`: also look for the sign-in library
 * — for the page only. A packed app's archive holds the app's node_modules as
 * well, and one of them (@vercel/oidc) names the same discovery path, so there
 * the string says nothing about the page.
 */
function contentProblems(contains, apiUrl, what, { signInCode = false } = {}) {
  const problems = [];
  if (!contains(apiUrl)) {
    problems.push(`${what} does not carry the server address ${apiUrl} — it is not the page that was built for it.`);
  }
  for (const setting of WEBSITE_ONLY_SETTINGS) {
    if (contains(setting)) problems.push(`${what} carries the website's ${setting} setting — the desktop app must be built without it.`);
  }
  if (signInCode && contains(SIGN_IN_CODE)) problems.push(`${what} carries sign-in code — the desktop app has no sign-in.`);
  return problems;
}

/**
 * Everything wrong with a handed-in page before it is packed. Empty = pack it.
 * `files` are the page's text files, `{ name, text }`, names relative to it.
 */
export function pageProblems({ files, apiUrl }) {
  const address = addressProblem(apiUrl);
  if (address) return [address];
  const problems = [];
  if (!files.some((file) => file.name === 'index.html')) problems.push('The page directory has no index.html — it is not a built page.');
  return [...problems, ...contentProblems((needle) => files.some((file) => file.text.includes(needle)), apiUrl, 'The page', { signInCode: true })];
}

/**
 * What was actually packed: that it is this page (it carries the address) and
 * none of the website's settings came with it. `apps` is one entry per packed
 * app, `{ dir, archives: [{ contains(needle) }] }` — a universal macOS
 * app can split its archive per processor, so the page may be in any of them.
 */
export function packedProblems({ apps, apiUrl }) {
  const address = addressProblem(apiUrl);
  if (address) return [address];
  if (apps.length === 0) return ['No packed app found under release/ — did electron-builder run?'];
  return apps.flatMap((app) =>
    contentProblems((needle) => app.archives.some((archive) => archive.contains(needle)), apiUrl, `The app packed in ${app.dir}`));
}
