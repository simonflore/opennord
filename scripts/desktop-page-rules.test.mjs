import { describe, expect, it } from 'vitest';
import { packedProblems, pagePlan, pageProblems } from './desktop-page-rules.mjs';

const API = 'https://api.opennord.test';

/** A built page: an index and one script, as the pack would find them on disk. */
const page = (script) => [
  { name: 'index.html', text: '<!doctype html><script type="module" src="./assets/index-abc.js"></script>' },
  { name: 'assets/index-abc.js', text: script },
];
const good = page(`const base="${API}";fetch(base+"/v1/community/shares")`);

describe('pagePlan', () => {
  it('packs the app’s own page when no page is handed in', () => {
    expect(pagePlan({})).toEqual({ kind: 'own' });
    expect(pagePlan({ OPENNORD_DESKTOP_PAGE: '  ' })).toEqual({ kind: 'own' });
  });

  it('packs the page it is handed, with the address that page must carry', () => {
    expect(pagePlan({ OPENNORD_DESKTOP_PAGE: '/x/dist-desktop', OPENNORD_DESKTOP_API_URL: ` ${API} ` }))
      .toEqual({ kind: 'provided', dir: '/x/dist-desktop', apiUrl: API });
  });

  it('keeps a handed-in page even when its address is missing, so the guard can refuse it', () => {
    expect(pagePlan({ OPENNORD_DESKTOP_PAGE: '/x' })).toEqual({ kind: 'provided', dir: '/x', apiUrl: '' });
  });
});

describe('pageProblems', () => {
  it('passes a page that carries the address and no sign-in', () => {
    expect(pageProblems({ files: good, apiUrl: API })).toEqual([]);
  });

  it('refuses when it was not told which address to look for', () => {
    expect(pageProblems({ files: good, apiUrl: '' })[0]).toMatch(/OPENNORD_DESKTOP_API_URL/);
  });

  it('refuses a placeholder or a non-https address before looking at the page', () => {
    for (const bad of ['https://API-ADDRESS-PLACEHOLDER', 'https://api.example.com', 'http://api.opennord.test', 'https://localhost:8080', 'not a url', `${API}/v1`]) {
      const files = page(`const base="${bad}"`);
      expect(pageProblems({ files, apiUrl: bad }), bad).toHaveLength(1);
    }
  });

  it('refuses a directory that is not a built page', () => {
    const [problem] = pageProblems({ files: [{ name: 'assets/index-abc.js', text: API }], apiUrl: API });
    expect(problem).toMatch(/index\.html/);
  });

  it('refuses a page that does not carry the address: it could not reach the community', () => {
    const [problem] = pageProblems({ files: page('console.log("no address here")'), apiUrl: API });
    expect(problem).toContain(API);
  });

  it('refuses a page built with a sign-in or diagnostics setting', () => {
    for (const name of ['VITE_ZITADEL_ISSUER', 'VITE_ZITADEL_CLIENT_ID', 'VITE_ZITADEL_ORG_ID', 'VITE_DIAGNOSTICS_URL']) {
      const files = page(`const base="${API}";const env={${name}:"https://id.opennord.test"}`);
      const problems = pageProblems({ files, apiUrl: API });
      expect(problems, name).toHaveLength(1);
      expect(problems[0]).toContain(name);
    }
  });

  it('refuses a page that carries sign-in code, whatever it was configured with', () => {
    const files = page(`const base="${API}";const meta=issuer+"/.well-known/openid-configuration"`);
    expect(pageProblems({ files, apiUrl: API })[0]).toMatch(/sign-in/);
  });

  it('reports everything wrong with a page at once', () => {
    const files = page('const env={VITE_ZITADEL_ISSUER:"x",VITE_ZITADEL_CLIENT_ID:"y"}');
    expect(pageProblems({ files, apiUrl: API })).toHaveLength(3);
  });
});

describe('packedProblems', () => {
  const archive = (text) => ({ contains: (needle) => text.includes(needle) });
  const app = (...archives) => ({ dir: 'release/mac-universal/OpenNord.app/Contents/Resources', archives });

  it('passes when the packed app carries the address and no sign-in', () => {
    expect(packedProblems({ apps: [app(archive(`…${API}…`))], apiUrl: API })).toEqual([]);
  });

  it('accepts a universal app split per processor, as long as the page is in there', () => {
    const split = app(archive('shim'), archive(API), archive(API));
    expect(packedProblems({ apps: [split], apiUrl: API })).toEqual([]);
  });

  it('refuses when nothing was packed', () => {
    expect(packedProblems({ apps: [], apiUrl: API })[0]).toMatch(/no packed app/i);
  });

  it('refuses a packed app without the address: it took the wrong page', () => {
    const [problem] = packedProblems({ apps: [app(archive('the open page'))], apiUrl: API });
    expect(problem).toContain(API);
  });

  it('checks every packed app, not just the first', () => {
    const problems = packedProblems({
      apps: [app(archive(API)), { dir: 'release/win-unpacked/resources', archives: [archive('open')] }],
      apiUrl: API,
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('win-unpacked');
  });

  it('refuses a packed app that carries a website sign-in setting', () => {
    expect(packedProblems({ apps: [app(archive(`${API} VITE_ZITADEL_CLIENT_ID`))], apiUrl: API })[0]).toContain('VITE_ZITADEL_CLIENT_ID');
  });

  it('does not mistake a packed library for sign-in code', () => {
    // Seen on the first real pack: the archive also holds the app's node_modules, and one of
    // them (@vercel/oidc, with the AI SDK) names the same discovery path the sign-in library
    // does. The page is searched for that before it is packed; the archive is not.
    expect(packedProblems({ apps: [app(archive(`${API} /.well-known/openid-configuration`))], apiUrl: API })).toEqual([]);
  });
});
