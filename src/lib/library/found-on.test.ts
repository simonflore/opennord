import { describe, it, expect } from 'vitest';
import { mergeBySound, foundOn, countFoundOn, sourceFacets, memberIds, isFavoriteRow, favoriteKeysFor, localMember, nordSlotOf, type Mergeable } from './found-on';
import type { LibrarySource } from './types';

interface E extends Mergeable { type?: string }
const e = (id: string, source: LibrarySource, name = id, extra: Partial<E> = {}): E => ({ id, name, source, ...extra });
const fp = (pairs: Record<string, string>) => new Map(Object.entries(pairs));
const merge = (entries: E[], pairs: Record<string, string> = {}) => mergeBySound(entries, fp(pairs), { typeOf: (x) => x.type });

describe('mergeBySound', () => {
  it('leaves entries without a known fingerprint as rows of their own, untouched', () => {
    const a = e('folder:a', 'local'), b = e('nord:A:11', 'nord');
    const rows = merge([a, b]);
    expect(rows).toEqual([a, b]);
    expect(rows[0]).toBe(a); // same object: memoised table rows keep their identity
  });

  it('merges entries with the same fingerprint into one row, shown as the local one', () => {
    const rows = merge(
      [e('nord:A:11', 'nord', 'Pad'), e('folder:Pad.ns4p', 'local', 'Pad'), e('cloud:x1', 'cloud', 'Pad')],
      { 'nord:A:11': 'x1', 'folder:Pad.ns4p': 'x1', 'cloud:x1': 'x1' },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'folder:Pad.ns4p', source: 'local', fingerprint: 'x1', sources: ['nord', 'local', 'cloud'] });
    expect(rows[0].members!.map((m) => m.id)).toEqual(['folder:Pad.ns4p', 'nord:A:11', 'cloud:x1']);
  });

  it('never merges by name: same name, different bytes stay apart', () => {
    const rows = merge([e('folder:a', 'local', 'Pad'), e('cloud:x2', 'cloud', 'Pad')], { 'folder:a': 'x1', 'cloud:x2': 'x2' });
    expect(rows.map((r) => r.id)).toEqual(['folder:a', 'cloud:x2']);
    expect(rows[0].sources).toEqual(['local']);
  });

  it('shows a row as its Nord entry when there is no local one, and as the cloud one only when alone', () => {
    const both = merge([e('cloud:x1', 'cloud'), e('nord:A:11', 'nord')], { 'cloud:x1': 'x1', 'nord:A:11': 'x1' });
    expect(both[0]).toMatchObject({ id: 'nord:A:11', sources: ['nord', 'cloud'] });
    const alone = merge([e('cloud:x1', 'cloud')], { 'cloud:x1': 'x1' });
    expect(alone[0]).toMatchObject({ id: 'cloud:x1', sources: ['cloud'], fingerprint: 'x1' });
  });

  it('keeps the order of each row’s first entry in the input', () => {
    const rows = merge(
      [e('nord:A:11', 'nord'), e('folder:b', 'local'), e('folder:a', 'local'), e('cloud:x1', 'cloud')],
      { 'folder:a': 'x1', 'cloud:x1': 'x1' },
    );
    expect(rows.map((r) => r.id)).toEqual(['nord:A:11', 'folder:b', 'folder:a']);
  });

  it('the same file twice in one source is one row, the source listed once, both names kept', () => {
    const rows = merge([e('folder:Pad.ns4p', 'local', 'Pad'), e('folder:Pad (1).ns4p', 'local', 'Pad (1)')], { 'folder:Pad.ns4p': 'x1', 'folder:Pad (1).ns4p': 'x1' });
    expect(rows).toHaveLength(1);
    expect(rows[0].sources).toEqual(['local']);
    expect(rows[0].members!.map((m) => m.name)).toEqual(['Pad', 'Pad (1)']);
  });

  it('merges a backup entry whose bytes are known, shown as the loose file when there is one', () => {
    const rows = merge([e('backup:b!a', 'backup'), e('folder:a', 'local'), e('cloud:x1', 'cloud')], { 'backup:b!a': 'x1', 'folder:a': 'x1', 'cloud:x1': 'x1' });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('folder:a');
    expect(rows[0].sources).toEqual(['local', 'backup', 'cloud']);
    expect(merge([e('backup:b!a', 'backup'), e('cloud:x1', 'cloud')], { 'backup:b!a': 'x1', 'cloud:x1': 'x1' })[0].id).toBe('backup:b!a');
  });

  it('keeps a row for every Nord slot, though two hold the same program', () => {
    const rows = merge(
      [e('nord:A:11', 'nord', 'Pad', { slot: 'A:11' }), e('nord:A:12', 'nord', 'Pad', { slot: 'A:12' }), e('folder:Pad', 'local', 'Pad')],
      { 'nord:A:11': 'x1', 'nord:A:12': 'x1', 'folder:Pad': 'x1' },
    );
    expect(rows.map((r) => r.id)).toEqual(['folder:Pad', 'nord:A:12']);
    expect(rows[0].members!.map((m) => m.id)).toEqual(['folder:Pad', 'nord:A:11']);
    expect(rows[1].members).toBeUndefined();
  });

  it('hints a row that an unread Nord slot has its name and type, and stops once the slot is read', () => {
    const local = e('folder:Pad.ns4p', 'local', 'Pad ', { type: 'ns4p' });
    const slot = e('nord:A:26', 'nord', 'pad', { type: 'ns4p', slot: 'A:26' });
    const unread = merge([slot, local], { 'folder:Pad.ns4p': 'x1' });
    expect(unread.find((r) => r.id === 'folder:Pad.ns4p')!.sameNameOnNord).toBe('A:26');
    expect(unread.find((r) => r.id === 'nord:A:26')!.sameNameOnNord).toBeUndefined();
    const readDifferent = merge([slot, local], { 'folder:Pad.ns4p': 'x1', 'nord:A:26': 'x9' });
    expect(readDifferent.find((r) => r.id === 'folder:Pad.ns4p')!.sameNameOnNord).toBeUndefined();
  });

  it('does not hint across file types', () => {
    const rows = merge([e('nord:A:26', 'nord', 'Pad', { type: 'ns4p', slot: 'A:26' }), e('folder:Pad.ns3f', 'local', 'Pad', { type: 'ns3f' })], { 'folder:Pad.ns3f': 'x1' });
    expect(rows[1].sameNameOnNord).toBeUndefined();
  });
});

describe('row helpers', () => {
  const row = mergeBySound([e('folder:a', 'local'), e('cloud:x1', 'cloud')], fp({ 'folder:a': 'x1', 'cloud:x1': 'x1' }))[0];
  const plain = e('nord:A:11', 'nord');

  it('foundOn falls back to the entry’s own source', () => {
    expect(foundOn(row)).toEqual(['local', 'cloud']);
    expect(foundOn(plain)).toEqual(['nord']);
  });
  it('countFoundOn counts a row under each source it is found on', () => {
    expect(countFoundOn([row, plain])).toEqual({ nord: 1, local: 1, backup: 0, cloud: 1 });
  });
  it('sourceFacets counts a row on this computer once, loose file and backup alike', () => {
    const both = { ...e('folder:a', 'local'), sources: ['local', 'backup'] as LibrarySource[] };
    expect(sourceFacets([both, e('cloud:x', 'cloud')])).toEqual({ nordCount: 0, localCount: 1, showCloud: true, showSourceFacet: true });
    expect(sourceFacets([both]).showSourceFacet).toBe(false);
  });
  it('memberIds lists the row’s own id first', () => {
    expect(memberIds(row)).toEqual(['folder:a', 'cloud:x1']);
    expect(memberIds(plain)).toEqual(['nord:A:11']);
  });
  it('a row is a favourite through its id, any member id, or its fingerprint', () => {
    expect(isFavoriteRow(new Set(['cloud:x1']), row)).toBe(true);
    expect(isFavoriteRow(new Set(['x1']), row)).toBe(true);
    expect(isFavoriteRow(new Set(['other']), row)).toBe(false);
  });
  it('marking stores the fingerprint and every entry id; unmarking clears every key', () => {
    expect(favoriteKeysFor(row)).toEqual(['x1', 'folder:a', 'cloud:x1']);
    expect(favoriteKeysFor(plain)).toEqual(['nord:A:11']);
  });
  it('localMember finds the copy on this computer', () => {
    expect(localMember(row)).toEqual(expect.objectContaining({ id: 'folder:a' }));
    expect(localMember(plain)).toBeUndefined();
  });
  it('a star stays on a Nord program after its slot goes back to unread (no bytes, no fingerprint)', () => {
    const read = mergeBySound([e('folder:a', 'local'), e('nord:A:26', 'nord', 'nord:A:26', { slot: 'A:26' })], fp({ 'folder:a': 'x1', 'nord:A:26': 'x1' }))[0];
    const marked = new Set(favoriteKeysFor(read));
    expect(isFavoriteRow(marked, e('nord:A:26', 'nord', 'nord:A:26', { slot: 'A:26' }))).toBe(true);
    expect(isFavoriteRow(marked, e('folder:a', 'local'))).toBe(true);
  });
  it('nordSlotOf is where the sound is on the Nord, whichever entry the row is shown as', () => {
    const merged = mergeBySound([e('nord:A:26', 'nord', 'Pad', { slot: 'A:26' }), e('folder:a', 'local', 'Pad')], fp({ 'nord:A:26': 'x1', 'folder:a': 'x1' }))[0];
    expect(merged.id).toBe('folder:a');
    expect(nordSlotOf(merged)).toBe('A:26');
    expect(nordSlotOf(e('nord:A:11', 'nord', 'W', { slot: 'A:11' }))).toBe('A:11');
    expect(nordSlotOf(e('cloud:x2', 'cloud', 'L', { slot: 'B:11' }))).toBeUndefined(); // where it was when backed up, not where it is
    expect(nordSlotOf(e('folder:b', 'local'))).toBeUndefined();
  });
});
