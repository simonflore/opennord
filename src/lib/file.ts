/** Read a File/Blob fully into bytes. The one place the `File.arrayBuffer()` → `Uint8Array`
 *  idiom lives, so size-guards or instrumentation can be added in a single spot. */
export async function readFileBytes(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
