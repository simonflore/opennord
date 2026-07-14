/**
 * Parser for the `meta.xml` dependency manifest inside Nord bundles and backups
 * (`.nl4pbundle`, `.np4pbundle`, `.ne4pb`, `.ns4b`, …).
 *
 * The manifest pairs each program with the exact factory samples / pianos it
 * references — free, hardware-independent ground truth. It is how this session
 * confirmed Wave 2 slot sources, Piano 4 piano names and the Electro 4 sample
 * reference: two programs that declare the same dependency must share the
 * decoded reference bytes, and the count of reference-carrying slots must equal
 * the program's `depCnt`.
 *
 * The manifest is a flat list of self-closing `<file>` elements:
 *   <file name="Program/Bank O/Choir.nw2p" depCnt="1"
 *         dep0="Samp Lib/Choir/Men+Women Mm 3.0.nsmp3"/>
 * Dependencies are addressed by index (`dep0`, `dep1`, …), which is authoritative
 * — Nord sometimes emits the attributes out of source order.
 */

/** One program and the ordered list of files it depends on. */
export interface BundleDep {
  /** Bundle-relative path of the program file, e.g. "Program/Bank O/Choir.nw2p". */
  readonly program: string;
  /** Dependency file paths in dep-index order (empty when depCnt="0"). */
  readonly deps: string[];
}

const FILE_RE = /<file\b([^>]*?)\/?>/g;
const NAME_RE = /\bname="([^"]*)"/;
const DEPCNT_RE = /\bdepCnt="(\d+)"/;

function attr(tag: string, re: RegExp): string | undefined {
  return re.exec(tag)?.[1];
}

/** Parse a bundle/backup `meta.xml` into an ordered program → dependencies list. */
export function parseBundleDeps(metaXml: string): BundleDep[] {
  const out: BundleDep[] = [];
  for (const match of metaXml.matchAll(FILE_RE)) {
    const tag = match[1];
    const program = attr(tag, NAME_RE);
    if (program === undefined) continue;
    const depCnt = Number(attr(tag, DEPCNT_RE) ?? '0');
    const deps: string[] = [];
    for (let i = 0; i < depCnt; i++) {
      const dep = attr(tag, new RegExp(`\\bdep${i}="([^"]*)"`));
      if (dep !== undefined) deps.push(dep);
    }
    out.push({ program, deps });
  }
  return out;
}
