/**
 * The ⌘K palette's search: what can be jumped to, and how a query ranks it.
 * Pure, so the ranking is tested without rendering.
 */
export type CommandGroup = 'Pages' | 'Programs' | 'Presets' | 'Samples' | 'Pianos';

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** A short aside, e.g. the slot or source. */
  hint?: string;
  run: () => void;
}

const GROUP_ORDER: Record<CommandGroup, number> = { Pages: 0, Programs: 1, Presets: 2, Samples: 3, Pianos: 4 };

/** 0 = the text starts with the word, 1 = a later word does, 2 = it's inside a word, -1 = absent. */
function wordScore(text: string, word: string): number {
  const at = text.indexOf(word);
  if (at < 0) return -1;
  if (at === 0) return 0;
  return /[\s\-_:·/(]/.test(text[at - 1]) ? 1 : 2;
}

// The lowercased text a command is searched by, built once per command rather
// than on every keystroke.
const searchText = new WeakMap<Command, string>();
function textOf(c: Command): string {
  let t = searchText.get(c);
  if (t === undefined) searchText.set(c, (t = `${c.label} ${c.hint ?? ''}`.toLowerCase()));
  return t;
}

/**
 * Every word of the query must appear in the label (or its hint). Better matches
 * first, then pages before programs before presets…, then shorter labels. With
 * no query, only the pages: the palette then works as a menu.
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
  return scored.slice(0, limit).map((s) => s.c);
}
