import { describe, it, expect } from 'vitest';
import { deviceSlotLayout } from './slot-layout';
import { ALL_MODELS, MODELS, PARTITION_SLOTS, PROGRAM_SLOTS, programSlotLayout, STAGE4_PROGRAM_SLOTS, type PartitionKind, type SlotLayout } from '../clavia/partitions';
import { formatDeviceSlot } from '../clavia/slot';
import { nordEntriesFromDevice } from '../library/entries';
import { nordSampleEntriesFromDevice } from '../library/sample-entries';
import { pianoEntriesFromDevice } from '../library/piano-entries';
import { presetEntriesFromDevice } from '../library/preset-entries';
import { repeatedIds } from '../library/unique-ids';
import type { ProgramEntry } from './transfer';

const file = (bank: number, slot: number): ProgramEntry =>
  ({ bank, slot, name: `${bank}-${slot}`, categoryId: 0, version: 0, sizeBytes: 0, fourcc: 'ns4p' });

/** Every address of a layout, bank by bank. */
const addresses = ({ banks, perBank }: { banks: number; perBank: number }) =>
  Array.from({ length: banks * perBank }, (_, i) => file(Math.floor(i / perBank), i % perBank));

describe('the Program partition of every model', () => {
  // The lesson of #186: a slot label that drops bits gives two slots one Library id.
  it.each(ALL_MODELS.filter((m) => m.programTag).map((m) => [m.id, programSlotLayout(m)] as const))(
    '%s: every slot has its own label and Library id',
    (_, layout) => {
      const all = addresses(layout);
      expect(new Set(all.map((e) => formatDeviceSlot(e.bank, e.slot))).size).toBe(all.length);
      // The builders make ids unique whatever the labels do (withUniqueIds), so ask
      // whether any id had to be: none may.
      expect(repeatedIds(nordEntriesFromDevice(all))).toEqual([]);
    },
  );

  it('records shapes only for models that have a Program partition', () => {
    for (const id of Object.keys(PROGRAM_SLOTS) as (keyof typeof MODELS)[]) {
      expect(MODELS[id].partitions.some((p) => p.kind === 'program'), id).toBe(true);
    }
  });
});

/** The Library list each partition's files are keyed in, where there is one. */
const LIBRARY_IDS: Partial<Record<PartitionKind, (files: ProgramEntry[]) => { id: string }[]>> = {
  samplib: nordSampleEntriesFromDevice,
  piano: pianoEntriesFromDevice,
  'organ-preset': (files) => presetEntriesFromDevice([{ kind: 'organ-preset', partition: 7, entries: files }]),
  'synth-preset': (files) => presetEntriesFromDevice([{ kind: 'synth-preset', partition: 9, entries: files }]),
};

describe('the other partitions of every model', () => {
  const shapes = Object.entries(PARTITION_SLOTS).flatMap(([model, kinds]) =>
    Object.entries(kinds!).map(([kind, layout]) => [model, kind as PartitionKind, layout as SlotLayout] as const));

  it.each(shapes)('%s %s: every slot has its own label and Library id', (_, kind, layout) => {
    const all = addresses(layout);
    expect(new Set(all.map((e) => formatDeviceSlot(e.bank, e.slot))).size).toBe(all.length);
    const ids = LIBRARY_IDS[kind];
    if (ids) expect(repeatedIds(ids(all))).toEqual([]);
  });

  it('records shapes only for partitions the model has', () => {
    for (const [model, kinds] of Object.entries(PARTITION_SLOTS)) {
      for (const kind of Object.keys(kinds!)) {
        expect(MODELS[model as keyof typeof MODELS].partitions.some((p) => p.kind === kind), `${model} ${kind}`).toBe(true);
      }
    }
  });
});

describe('deviceSlotLayout', () => {
  it('draws a Stage 2 as 4 banks of 100', () => {
    expect(deviceSlotLayout(MODELS['stage-2'], [])).toEqual({ banks: 4, perBank: 100 });
  });

  it('falls back to the Stage 4 shape for a model with none recorded, or no model', () => {
    expect(deviceSlotLayout(MODELS['stage-3'], [])).toEqual(STAGE4_PROGRAM_SLOTS);
    expect(deviceSlotLayout(undefined, [])).toEqual(STAGE4_PROGRAM_SLOTS);
  });

  it('takes the Nord\'s own bank list over the recorded shape', () => {
    const bankList = [{ name: 'A', slotCapacity: 100 }, { name: 'B', slotCapacity: 100 }];
    expect(deviceSlotLayout(MODELS['stage-4'], [], bankList)).toEqual({ banks: 2, perBank: 100 });
    expect(deviceSlotLayout(MODELS['stage-2'], [], [])).toEqual({ banks: 4, perBank: 100 });
  });

  it('grows to reach every file the Nord listed', () => {
    expect(deviceSlotLayout(undefined, [file(0, 99), file(9, 0)])).toEqual({ banks: 10, perBank: 100 });
    expect(deviceSlotLayout(MODELS['electro-5'], [file(0, 49)])).toEqual({ banks: 8, perBank: 50 });
  });
});
