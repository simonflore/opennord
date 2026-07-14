import { useEffect, useState } from 'react';
import { type ProgramEntry } from '../../lib/device/transfer';
import { enumerateSampleLibrary, pullSample } from '../../lib/device/samples';
import { readPartitionCapacity, type PartitionCapacity } from '../../lib/device/capacity';
import { PARTITION_SAMP_LIB, PARTITION_PIANO } from '../../lib/device/opcodes';
import type { NordSession } from '../../lib/device/session';
import type { InspectorInput } from '../sample/SampleInspector';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';

/**
 * Samples flow: browse the Samp Lib partition (enumerated lazily on first switch)
 * and pull a sample (with progress) to open in the inspector. Owns its error/busy.
 */
export function useSamplesFlow(session: NordSession | null) {
  const [view, setView] = useState<'programs' | 'samples'>('programs');
  const [sampleEntries, setSampleEntries] = useState<ProgramEntry[]>([]);
  const [sampleInput, setSampleInput] = useState<InspectorInput | null>(null);
  const [pullPct, setPullPct] = useState<number | null>(null);
  // Sample Library + Piano are the byte-constrained ("how full?") partitions; null until read.
  const [sampleCapacity, setSampleCapacity] = useState<PartitionCapacity | null>(null);
  const [pianoCapacity, setPianoCapacity] = useState<PartitionCapacity | null>(null);
  const { busy, error, setError, run } = useAsyncAction();

  // Reset when the connection changes (reconnect to a different Nord) — the flow
  // stays mounted across sessions, so the lazy-enumerate cache would otherwise
  // show the previous board's list. Then read the Sample/Piano storage eagerly so
  // the memory-budget panel can show the whole board's fullness up front (not only
  // after the Samples tab is opened). Best-effort — a failed query just leaves it null.
  useEffect(() => {
    setView('programs');
    setSampleEntries([]);
    setSampleInput(null);
    setSampleCapacity(null);
    setPianoCapacity(null);
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const s = await readPartitionCapacity(session, PARTITION_SAMP_LIB).catch(() => null);
      const p = await readPartitionCapacity(session, PARTITION_PIANO).catch(() => null);
      if (!cancelled) { setSampleCapacity(s); setPianoCapacity(p); }
    })();
    return () => { cancelled = true; };
  }, [session]);

  /** Switch between programs and samples; enumerate Samp Lib + read storage once (lazily). */
  async function switchView(next: 'programs' | 'samples') {
    if (!session || busy) return;
    setView(next); setSampleInput(null); setError('');
    if (next === 'samples') {
      await run(async () => {
        if (sampleEntries.length === 0) setSampleEntries(await enumerateSampleLibrary(session));
        // Storage readouts — best-effort, so a failed query never blocks browsing.
        if (!sampleCapacity) setSampleCapacity(await readPartitionCapacity(session, PARTITION_SAMP_LIB).catch(() => null));
        if (!pianoCapacity) setPianoCapacity(await readPartitionCapacity(session, PARTITION_PIANO).catch(() => null));
      }, (e) => `Could not list samples: ${getErrorMessage(e)}`);
    }
  }

  /** Pull a sample off the board (with progress) and open it in the inspector. */
  async function openSample(entry: ProgramEntry) {
    if (!session || busy) return;
    setPullPct(0);
    await run(async () => {
      const bytes = await pullSample(session, entry,
        (done, total) => setPullPct(total ? Math.round((done / total) * 100) : 0));
      setSampleInput({ bytes, name: entry.name });
    }, (e) => `Could not read ${entry.name}: ${getErrorMessage(e)}`);
    setPullPct(null);
  }

  return {
    view, sampleEntries, sampleInput, setSampleInput, pullPct, error, busy,
    sampleCapacity, pianoCapacity, switchView, openSample,
  };
}
