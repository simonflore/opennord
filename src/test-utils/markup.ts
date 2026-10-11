/**
 * The `<button …>` opening tag (and whatever precedes the label inside it) of
 * the button whose text is `label`, from static markup — for asserting a
 * button's attributes in renderToStaticMarkup tests. Takes the first
 * occurrence of the label that sits inside a <button>; throws if none does.
 */
export function buttonFor(html: string, label: string): string {
  for (let idx = html.indexOf(`>${label}<`); idx >= 0; idx = html.indexOf(`>${label}<`, idx + 1)) {
    const start = html.lastIndexOf('<button', idx);
    if (start >= 0 && !html.slice(start, idx).includes('</button>')) return html.slice(start, idx);
  }
  throw new Error(`no <button> with text ${label} in markup`);
}
