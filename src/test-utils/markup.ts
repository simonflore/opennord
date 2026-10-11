/**
 * The `<button …>` opening tag (and whatever precedes the label inside it) of
 * the button whose text is `label`, from static markup — for asserting a
 * button's attributes in renderToStaticMarkup tests. Throws unless the label
 * really sits inside a <button>.
 */
export function buttonFor(html: string, label: string): string {
  const idx = html.indexOf(`>${label}<`);
  const start = html.lastIndexOf('<button', idx);
  if (idx < 0 || start < 0 || html.slice(start, idx).includes('</button>')) {
    throw new Error(`no <button> with text ${label} in markup`);
  }
  return html.slice(start, idx);
}
