import { Unzip, UnzipInflate } from 'fflate';

/** One file pulled out of a streamed zip. */
export interface UnzippedEntry {
  /** Path of the entry inside the zip, e.g. `"Bank 1/Lead.ns4p"`. */
  path: string;
  /** The entry's decompressed bytes. */
  bytes: Uint8Array;
}

const EMPTY = new Uint8Array(0);

function concat(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 1) return chunks[0];
  let size = 0;
  for (const c of chunks) size += c.length;
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

/**
 * Unzip a zip *as it streams in*, calling `onEntry` once per file with its full
 * bytes — without ever holding the whole archive in memory. Peak memory is the
 * size of a single entry, which is why a multi-GB `.ns4b` backup (thousands of
 * tiny programs) decodes without blowing the tab's budget or freezing the UI on
 * a synchronous `unzipSync` (see {@link ../scan!MAX_READ_BYTES}).
 *
 * `accept` lets the caller skip entries it doesn't want *before* they're
 * decompressed — pass a path predicate to avoid wasting work on, say, `meta.xml`
 * or non-program entries. Generic by design: it knows nothing about Nord files.
 *
 * fflate's push-based {@link Unzip} reads each entry from its local header as the
 * bytes flow by (no central-directory seek), so forward streaming works even for
 * store-zips. A decode error propagates out of the returned promise.
 *
 * `onEntry` may be async: each completed entry is awaited before the next chunk is
 * read, so a consumer can apply write-backpressure (e.g. piping entries straight
 * into a streaming re-zip) and keep peak memory at a single entry.
 */
export async function streamUnzip(
  source: ReadableStream<Uint8Array>,
  onEntry: (entry: UnzippedEntry) => void | Promise<void>,
  accept?: (path: string) => boolean,
): Promise<void> {
  let failure: unknown;
  const ready: UnzippedEntry[] = []; // entries completed within the current push, awaited after it
  const unzipper = new Unzip();
  unzipper.register(UnzipInflate); // DEFLATE entries; stored entries pass through natively

  unzipper.onfile = (file) => {
    if (accept && !accept(file.name)) return; // never call start() → entry is not decompressed
    const chunks: Uint8Array[] = [];
    file.ondata = (err, chunk, final) => {
      if (failure) return;
      if (err) { failure = err; return; }
      if (chunk.length) chunks.push(chunk);
      if (final) ready.push({ path: file.name, bytes: concat(chunks) });
    };
    file.start();
  };

  const reader = source.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      unzipper.push(value ?? EMPTY, done); // ondata fires synchronously within push, queuing into `ready`
      if (failure) throw failure;
      for (const entry of ready.splice(0)) await onEntry(entry);
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}
