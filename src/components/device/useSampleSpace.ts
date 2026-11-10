import { useEffect, useMemo, useRef, useState } from 'react';
import { useDevice } from '@/lib/device/DeviceContext';
import { readPartitionCapacity, type PartitionCapacity } from '@/lib/device/capacity';
import { PARTITION_SAMP_LIB } from '@/lib/device/opcodes';
import { enumerateSampleLibrary } from '@/lib/device/samples';
import { identifyDevice } from '@/lib/device/connect-probe';
import { formatDeviceSlot, sampleSlotScheme } from '@/lib/clavia/slot';

/** Empty places offered at most, first ones first: a list, not the whole memory. */
const PLACES_SHOWN = 64;

/**
 * The connected Nord's sample memory, for Save & send: how much is free, and the first empty
 * places (as the Nord labels them) to send into, once its sample list has been read. Read once per Nord while `active`, with the
 * read-only capacity query; null until read, or with no Stage 4 connected.
 */
export function useSampleSpace(active: boolean) {
  const { session, sampleEntries, setSampleEntries, isCurrent, productId } = useDevice();
  const [capacity, setCapacity] = useState<PartitionCapacity | null>(null);
  const sampleEntriesRef = useRef(sampleEntries);
  sampleEntriesRef.current = sampleEntries;
  useEffect(() => {
    setCapacity(null);
    if (!active || !session?.stage4Layout) return;
    let gone = false;
    session.exclusive(() => readPartitionCapacity(session, PARTITION_SAMP_LIB))
      .then(async (c) => {
        if (gone) return;
        setCapacity(c);
        // The empty places need the Nord's sample list; read it when it hasn't been yet.
        if (sampleEntriesRef.current.length < c.fileCount) {
          const list = await enumerateSampleLibrary(session);
          if (!gone && isCurrent(session)) setSampleEntries(list);
        }
      })
      .catch(() => undefined); // the meter (or the places) just don't show
    return () => { gone = true; };
  }, [active, session, isCurrent, setSampleEntries]);

  const places = useMemo(() => {
    // Places are offered only when the Nord's sample list is read: else a taken one could look empty.
    if (!capacity || sampleEntries.length < capacity.fileCount) return [];
    const scheme = sampleSlotScheme(identifyDevice(productId).model);
    const used = new Set(sampleEntries.map((e) => `${e.bank}:${e.slot}`));
    const out: { bank: number; slot: number; label: string }[] = [];
    capacity.banks.forEach((b, bank) => {
      for (let slot = 0; slot < b.slotCapacity && out.length < PLACES_SHOWN; slot++) {
        if (!used.has(`${bank}:${slot}`)) out.push({ bank, slot, label: formatDeviceSlot(bank, slot, scheme) });
      }
    });
    return out;
  }, [capacity, sampleEntries, productId]);

  return { capacity, places };
}
