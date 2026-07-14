export interface CorpusModel { id: string; files: string[]; }

/** Only the dev server exposes the corpus bridge; the loader hides itself in production. */
export const corpusAvailable = import.meta.env.DEV;

export async function listCorpus(): Promise<CorpusModel[]> {
  try {
    const r = await fetch('/__fixtures/list');
    if (!r.ok) return [];
    const j = (await r.json()) as { models?: CorpusModel[] };
    return j.models ?? [];
  } catch {
    return [];
  }
}

export async function getCorpusFile(model: string, name: string): Promise<Uint8Array> {
  const r = await fetch(`/__fixtures/get?model=${encodeURIComponent(model)}&name=${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error(`corpus fetch failed (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}
