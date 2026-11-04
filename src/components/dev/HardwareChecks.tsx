import { useState } from 'react';
import { Button, FileInput, buttonVariants } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';
import { readPartitionList, type PartitionInfo } from '../../lib/device/partition-list';
import { describeFlags, nextAllowed, runTwoPieceWrite, TWO_PIECE_NAME, type TwoPieceResult } from '../../lib/device/hw-checks';
import { LIBRARY_WRITES_VERIFIED, setUntestedWrites, untestedWritesAllowed, type LibraryKind } from '../../lib/device/write-guard';
import { STOPPED_ANSWERING } from '../../lib/device/session';
import { stoppedAnswering } from '../device/useSendSample';
import { getErrorMessage } from '../../lib/errors';

/** W0: the partition list as read, with the session's write permission beside it. Raw values (an RE page). */
export function PartitionTable({ list, canWrite }: { list: PartitionInfo[]; canWrite: (index: number) => boolean }) {
  return (
    <table className="font-mono text-xs">
      <thead>
        <tr>
          <th>#</th><th>name</th><th>w0 block</th><th>w1 round</th><th>w2 align</th><th>w3</th>
          <th>canWrite</th><th>eraseSupported</th><th>matchByName</th><th>flags (hex)</th>
        </tr>
      </thead>
      <tbody>
        {list.map((p) => {
          const cells = describeFlags(p.flags);
          return (
            <tr key={p.index}>
              <td>{p.index}</td><td>{p.name}</td><td>{p.blockBytes}</td><td>{p.blockRounding}</td><td>{p.writeAlign}</td><td>{p.word3}</td>
              <td>{String(canWrite(p.index))}</td><td>{String(p.eraseSupported)}</td><td>{String(p.matchByName)}</td>
              <td>
                {cells.map((c) => c.hex).join(' ')}
                {' | '}
                {cells.filter((c) => c.label).map((c) => `${c.index} ${c.label}=${c.hex}`).join(' · ')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * /dev/hardware — the tools for the hardware session that writes samples and pianos
 *. Dev-only: the route exists only in a
 * development build (routes/dev.tsx). An RE page: it shows raw values. Every write
 * goes through the session's `assertWritable` (stream-write.ts, hw-checks.ts). While a
 * switch is on, the shell's UntestedWritesBanner warns on every page, this one included.
 */
export function HardwareChecks() {
  const { session, markLost } = useDevice();
  const [list, setList] = useState<PartitionInfo[] | null>(null);
  const [twoPiece, setTwoPiece] = useState<TwoPieceResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState<LibraryKind[]>(() => untestedWritesAllowed());

  async function run<T>(work: () => Promise<T>, done: (v: T) => void) {
    if (!session) return;
    setError(''); setBusy(true);
    try {
      done(await work());
    } catch (e) {
      console.warn('[hw-checks]', e);
      // The replies are out of step: forget this Nord before anything else reads from it.
      if (stoppedAnswering(e)) markLost(session, STOPPED_ANSWERING);
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function toggle(kind: LibraryKind, on: boolean) {
    const next = nextAllowed(allowed, kind, on);
    setUntestedWrites(next);
    setAllowed(next);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-ink">Hardware session: writing samples and pianos</h1>
      {!session ? (
        <p className="text-dim">Connect your Nord on the Device page first.</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold text-ink">W0. Partition list (read-only)</h2>
            <p className="text-sm text-dim">
              canWrite is OpenNord’s own confirmed-partition check (the list has no writable flag). Flag positions from
              NSM, to confirm here: 10 erase, 11 dependencies, 7 match (0 = by name), 0 unresolved (maybe a start bank).
            </p>
            <Button variant="secondary" className="min-h-11 self-start" disabled={busy}
              onClick={() => void run(() => session.exclusive(() => readPartitionList(session)), setList)}>
              Read the partition list
            </Button>
            {list && (
              <div className="overflow-x-auto">
                <PartitionTable list={list} canWrite={(i) => session.canWrite(i)} />
                <textarea readOnly className="mt-2 h-32 w-full bg-sink font-mono text-xs text-ink" aria-label="Partition list as text"
                  value={JSON.stringify(list.map((p) => ({ ...p, canWrite: session.canWrite(p.index) })), null, 1)} />
              </div>
            )}
          </section>
          {import.meta.env.DEV && (
            <>
              <section className="flex flex-col gap-2">
                <h2 className="font-semibold text-ink">W3. Two-piece write (writes to the Nord)</h2>
                <p className="text-sm text-dim">
                  Pick a program (.ns4p). It goes to the first program slot the Nord lists as empty, as “{TWO_PIECE_NAME}”
                  (numbered if that name is taken); it never replaces one. It is sent in two pieces to see whether the
                  Nord answers after the first piece or only after the last (as NSM expects).
                </p>
                <FileInput accept=".ns4p" disabled={busy} className={buttonVariants({ variant: 'outline', className: 'min-h-11 self-start' })}
                  onFile={(f) => void run(async () => runTwoPieceWrite(session, new Uint8Array(await f.arrayBuffer())), setTwoPiece)}>
                  Write a program in two pieces…
                </FileInput>
                {twoPiece && (
                  <>
                    <p className="text-sm text-ink">
                      Written to bank {twoPiece.at.bank}, slot {twoPiece.at.slot} as “{twoPiece.name}”:{' '}
                      {twoPiece.acks === 'one-answer'
                        ? 'one answer, after both pieces (as NSM expects).'
                        : 'an answer after each piece (NSM expects one, after the last).'}
                    </p>
                    <textarea readOnly className="h-24 w-full bg-sink font-mono text-xs text-ink" aria-label="Two-piece write record"
                      value={JSON.stringify(twoPiece, null, 1)} />
                  </>
                )}
              </section>
              <section className="flex flex-col gap-2">
                <h2 className="font-semibold text-ink">Untested writes on this computer</h2>
                <p className="text-sm text-warn">
                  Each switch arms two things for that kind: Send to Nord, and Restore’s by-name write-back, which
                  removes the Nord’s files that the backup replaces. Make a fresh backup first. Every development build
                  on this computer reads these switches.
                </p>
                {/* A kind confirmed on a Nord is on in every build: no switch for it. */}
                {(['sample', 'piano'] as const).filter((kind) => !LIBRARY_WRITES_VERIFIED[kind]).map((kind) => (
                  <label key={kind} className="flex min-h-11 items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="size-5" checked={allowed.includes(kind)} onChange={(e) => toggle(kind, e.target.checked)} />
                    Let OpenNord write {kind}s (not yet tried on a Nord)
                  </label>
                ))}
              </section>
            </>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
