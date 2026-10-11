/**
 * The `<button …>` opening tag (and whatever precedes the label inside it) of
 * the button whose text is `label`, from static markup — for asserting a
 * button's attributes in renderToStaticMarkup tests.
 */
export function buttonFor(html: string, label: string): string {
  const idx = html.indexOf(`>${label}<`);
  if (idx < 0) throw new Error(`no element with text ${label} in markup`);
  return html.slice(html.lastIndexOf('<button', idx), idx);
}
