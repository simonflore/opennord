/**
 * The ⌘K palette's search: what can be jumped to, and how a query ranks it.
 * Pure, so the ranking is tested without rendering.
 */
export type CommandGroup = 'Pages' | 'Programs' | 'Presets' | 'Samples' | 'Pianos';

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** A short aside shown on the right, e.g. the slot or source. */
  hint?: string;
  /** Searched along with the label (e.g. the slot), unlike the hint. */
  keywords?: string;
  run: () => void;
}

const GROUP_ORDER: Record<CommandGroup, number> = { Pages: 0, Programs: 1, Presets: 2, Samples: 3, Pianos: 4 };

const SEP = /[\s\-_:·/(]/;

/** 0 = the text starts with the word, 1 = a later word does, 2 = it's only inside a word, -1 = absent. */
function wordScore(text: string, word: string): number {
  let best = -1;
  for (let at = text.indexOf(word); at >= 0 && best !== 0; at = text.indexOf(word, at + 1)) {
    const s = at === 0 ? 0 : SEP.test(text[at - 1]) ? 1 : 2;
    if (best < 0 || s < best) best = s;
  }
  return best;
}

// The lowercased text a command is searched by, built once per command rather
// than on every keystroke.
const searchText = new WeakMap<Command, string>();
function textOf(c: Command): string {
  let t = searchText.get(c);
  if (t === undefined) searchText.set(c, (t = `${c.label} ${c.keywords ?? ''}`.toLowerCase()));
  return t;
}

/**
 * Every word of the query must appear in the label (or its keywords). The best
 * `limit` matches are kept (better match, then shorter label), then listed by
 * group — pages, programs, presets, samples, pianos — best first within each,
 * so every group heading appears once. With no query, only the pages: the
 * palette then works as a menu.
 */
export function rankCommands(commands: Command[], query: string, limit = 50): Command[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands.filter((c) => c.group === 'Pages');
  const scored: { c: Command; score: number; text: string }[] = [];
  for (const c of commands) {
    const text = textOf(c);
    let score = 0;
    for (const w of words) {
      const s = wordScore(text, w);
      if (s < 0) { score = -1; break; }
      score += s;
    }
    if (score >= 0) scored.push({ c, score, text });
  }
  scored.sort((a, b) =>
    a.score - b.score
    || GROUP_ORDER[a.c.group] - GROUP_ORDER[b.c.group]
    || a.c.label.length - b.c.label.length
    || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  // Array#sort is stable, so this keeps the ranking inside each group.
  return scored.slice(0, limit).sort((a, b) => GROUP_ORDER[a.c.group] - GROUP_ORDER[b.c.group]).map((s) => s.c);
}
