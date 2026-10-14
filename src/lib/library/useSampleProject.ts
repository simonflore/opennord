/**
 * One open Build-sample project (spec §7–8): loaded from storage with its clip audio, edited
 * through the library's pure operations with undo and redo, and saved half a second after the
 * last change (and on unmount, project switch and page hide). Audio stays in memory while the
 * project is open. The current project lives in a ref that every change updates synchronously, so
 * overlapping edits and imports never work from a stale snapshot.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyProject, type SampleProject } from '../sample-build/model';
import type { ClipAudio, ReadAudio } from '../sample-build/render';
import { decodeAudioFiles, placeDecoded, type DecodedFile } from '../sample-build/import-files';
import { describeFailure, getErrorMessage } from '../errors';
import { readFileBytes } from '../file';
import { loadClipAudio, loadProject, saveClipAudio, saveProject } from './sampleProjectStore';

const SAVE_DELAY_MS = 500;
const UNDO_LIMIT = 100;

export async function createProject(name: string): Promise<string> {
  const p = emptyProject(name);
  await saveProject(p);
  return p.id;
}

/** One pure change to a project; it throws to refuse. */
export type Edit = (p: SampleProject) => SampleProject;
/** A change to the project; returns why it was refused, or null. Applies with the same `mergeKey` in a row are one undo step. */
export type Apply = (edit: Edit, mergeKey?: string) => string | null;

/** Same project apart from when it was last changed (as stored: a key set to undefined is no key). */
function sameProject(a: unknown, b: unknown, top = true): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ra = a as Record<string, unknown>, rb = b as Record<string, unknown>;
  const keys = (r: Record<string, unknown>) => Object.keys(r).filter((k) => r[k] !== undefined && !(top && k === 'updatedAt'));
  const ka = keys(ra), kb = keys(rb);
  return ka.length === kb.length && ka.every((k) => sameProject(ra[k], rb[k], false));
}

export function useSampleProject(projectId: string) {
  const [project, setProject] = useState<SampleProject | null | undefined>(undefined); // undefined: loading; null: missing
  const [saved, setSaved] = useState(true);
  /** Why the last save failed; null when the last save worked. `saved` stays false while this is set. */
  const [saveError, setSaveError] = useState<string | null>(null);
  const audio = useRef(new Map<string, ClipAudio>()); // by audioRef
  const current = useRef<SampleProject | null>(null); // the latest project, updated synchronously
  const lastSaved = useRef<SampleProject | null>(null); // the object most recently written to storage
  const past = useRef<SampleProject[]>([]);
  const future = useRef<SampleProject[]>([]);
  const lastKey = useRef<string | null>(null); // the merge key of the last step; cleared by undo and redo
  const generation = useRef(0); // changes with projectId and unmount; stale save results are ignored
  const queue = useRef<Promise<unknown>>(Promise.resolve()); // saves run one after another, in order

  /** Write `p`; mark saved only if it is still the latest project when the write lands. */
  const persist = useCallback((p: SampleProject): Promise<void> => {
    const gen = generation.current;
    const run = queue.current.then(() => saveProject(p));
    queue.current = run.catch(() => undefined);
    return run.then(
      () => {
        lastSaved.current = p;
        if (gen !== generation.current) return;
        setSaveError(null);
        if (current.current === p) setSaved(true);
      },
      (e: unknown) => {
        if (gen === generation.current) setSaveError(describeFailure('Couldn’t save the project', e));
      },
    );
  }, []);

  /** Save the latest project now if it has unsaved changes. */
  const flush = useCallback(() => {
    const p = current.current;
    if (p && p !== lastSaved.current) void persist(p);
  }, [persist]);

  useEffect(() => {
    let cancelled = false;
    generation.current += 1;
    current.current = null; lastSaved.current = null;
    audio.current = new Map();
    past.current = []; future.current = []; lastKey.current = null;
    setProject(undefined); setSaved(true); setSaveError(null);
    (async () => {
      const p = await loadProject(projectId);
      if (!p) { if (!cancelled) setProject(null); return; }
      const loaded = await Promise.all(p.clips.map((c) => loadClipAudio(c.audioRef)));
      if (cancelled) return;
      p.clips.forEach((c, i) => { const a = loaded[i]; if (a) audio.current.set(c.audioRef, a); });
      current.current = p; lastSaved.current = p;
      setProject(p);
    })().catch(() => { if (!cancelled) setProject(null); });
    return () => {
      cancelled = true;
      flush(); // an edit made under 500 ms ago must not be lost
      generation.current += 1;
    };
  }, [projectId, flush]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [flush]);

  // Autosave after the last change.
  useEffect(() => {
    if (!project || saved) return;
    const t = setTimeout(() => { void persist(project); }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [project, saved, persist]);

  /**
   * Make `next` the project; the previous one goes on the undo stack. A change with the same
   * `mergeKey` as the step before (a drag, typing a name) replaces that step instead, and a
   * change that changes nothing is no step at all.
   */
  const commit = useCallback((next: SampleProject, mergeKey?: string) => {
    const from = current.current;
    if (from && sameProject(from, next)) return;
    const merge = mergeKey !== undefined && mergeKey === lastKey.current && past.current.length > 0;
    if (from && !merge) past.current = [...past.current.slice(-(UNDO_LIMIT - 1)), from];
    lastKey.current = mergeKey ?? null;
    future.current = [];
    current.current = next;
    setProject(next);
    setSaved(false);
  }, []);

  const apply: Apply = useCallback((edit, mergeKey) => {
    const p = current.current;
    if (!p) return 'The project isn’t open.';
    let next: SampleProject;
    try { next = edit(p); } catch (e) { return getErrorMessage(e); }
    commit(next, mergeKey);
    return null;
  }, [commit]);

  /**
   * Store the audio first, so a saved project never points at audio that was not written. A
   * failure is thrown to the caller, which says so; the project itself is untouched, so the
   * header's save state is not changed.
   */
  const storeAudio = useCallback(async (more: Map<string, ClipAudio>) => {
    await Promise.all([...more].map(([ref, a]) => saveClipAudio(ref, a)));
    for (const [ref, a] of more) audio.current.set(ref, a);
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (!current.current) return { unreadable: [], unclear: [] };
    const gen = generation.current;
    const read = await Promise.all(files.map(async (f) => ({ fileName: f.name, bytes: await readFileBytes(f) })));
    if (gen !== generation.current || !current.current) return { unreadable: [], unclear: [] };
    // Decode once and store the audio first; the audio does not depend on the project.
    const { decoded, unreadable } = decodeAudioFiles(read);
    const refs = new Map<DecodedFile, string>(decoded.map((d) => [d, crypto.randomUUID()]));
    await storeAudio(new Map(decoded.map((d) => [refs.get(d)!, d.audio])));
    if (gen !== generation.current || !current.current) return { unreadable: [], unclear: [] };
    // Then place the clips on the project as it is now, under the keys the audio was stored by.
    const r = placeDecoded(current.current, decoded, (d) => refs.get(d)!);
    commit(r.project);
    return { unreadable, unclear: r.report.unclear };
  }, [storeAudio, commit]);

  const undo = useCallback(() => {
    const p = current.current;
    if (!p || !past.current.length) return;
    lastKey.current = null;
    future.current = [p, ...future.current];
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    current.current = prev;
    setProject(prev); setSaved(false);
  }, []);

  const redo = useCallback(() => {
    const p = current.current;
    if (!p || !future.current.length) return;
    lastKey.current = null;
    past.current = [...past.current, p];
    const next = future.current[0];
    future.current = future.current.slice(1);
    current.current = next;
    setProject(next); setSaved(false);
  }, []);

  const read: ReadAudio = useCallback((clipId: string) => {
    const clip = project?.clips.find((c) => c.id === clipId);
    return clip ? audio.current.get(clip.audioRef) : undefined;
  }, [project]);

  const base = { apply, addFiles, undo, redo };
  if (project === undefined) return { state: 'loading' as const, ...base };
  if (project === null) return { state: 'missing' as const, ...base };
  return { state: 'open' as const, project, read, canUndo: past.current.length > 0, canRedo: future.current.length > 0, saved, saveError, ...base };
}
