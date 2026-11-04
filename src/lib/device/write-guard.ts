import { NordError } from './protocol';

/**
 * Shown when a write (send, delete, organize, restore, remove) is refused
 * because OpenNord hasn't confirmed which part of the keyboard's memory it
 * would land in. Musician-facing: no partition numbers, no protocol words.
 */
/** Why a write action is greyed on a keyboard OpenNord won't change (shown beside the action). */
export const READ_ONLY_REASON = 'OpenNord only reads this keyboard: it couldn’t confirm where it keeps its programs.';

export const WRITE_BLOCKED_MESSAGE =
  'To keep your sounds safe, OpenNord only changes what’s on a Nord once it has confirmed ' +
  'where this model keeps them — and it couldn’t confirm that on this keyboard. Nothing was ' +
  'changed. You can still browse, listen and back up as usual.';

/**
 * A write was refused before any frame reached the device: the target
 * partition was never confirmed (by a hardware-confirmed registry index, or by
 * the connect probe finding the model's program files there). See
 * `NordSession.allowWrites` and `resolveDeviceAccess` (connect-probe.ts).
 */
export class WriteBlockedError extends NordError {
  /** `message`: a more specific reason (a library's read-only sentence); the general one by default. */
  constructor(message: string = WRITE_BLOCKED_MESSAGE) {
    super(message);
    this.name = 'WriteBlockedError';
  }
}

/** A Nord's sample and piano libraries: the large files OpenNord can write. */
export type LibraryKind = 'sample' | 'piano';

/**
 * The hardware gate for sample and piano writes (send, restore). Each kind turns on
 * only after the hardware session for it has passed (the maintainers’ notes,
 * "Session 2", W4 for samples, W5 for pianos). Flip one value per kind, here only.
 *
 * Samples: on since 2026-11-04, sending one to a Stage 4 confirmed on the instrument
 * (W4). Restoring a backup's samples (W5) uses the same write and is on with it; W5
 * itself is not recorded yet. Pianos: off until W5.
 */
export const LIBRARY_WRITES_VERIFIED: Readonly<Record<LibraryKind, boolean>> = { sample: true, piano: false };

/** Where the /dev/hardware page keeps "try untested writes", for the hardware session. */
export const UNTESTED_WRITES_KEY = 'opennord.tryUntestedWrites';

/** Why Send to Nord is greyed while a kind's gate is closed. */
export const NOT_YET_TRIED: Readonly<Record<LibraryKind, string>> = {
  sample: 'Not yet tried on a Nord: sending samples stays off until it has been.',
  piano: 'Pianos can’t be sent yet: not yet tried on a Nord. Save it to your folder or download it.',
};

/** A send or restore of `kind` refused because its hardware gate is closed; nothing was sent. */
export class NotYetTriedError extends NordError {
  constructor(readonly kind: LibraryKind) {
    super(NOT_YET_TRIED[kind]);
    this.name = 'NotYetTriedError';
  }
}

/** Why Send to Nord is greyed on any keyboard but a Stage 4: the library writer is tried on a Stage 4 only. */
export const STAGE4_ONLY: Readonly<Record<LibraryKind, string>> = {
  sample: 'Sending samples works with a Nord Stage 4 for now.',
  piano: 'Sending pianos works with a Nord Stage 4 for now.',
};

/** A send refused because the keyboard isn't a Stage 4 (`session.stage4Layout`); nothing was sent. */
export class NotStage4Error extends WriteBlockedError {
  constructor(readonly kind: LibraryKind) {
    super(STAGE4_ONLY[kind]);
    this.name = 'NotStage4Error';
  }
}

/**
 * Why a sample or piano write is greyed on a keyboard OpenNord only reads. Shown when
 * `session.canWrite(partition)` is false: the partition list carries no writable flag,
 * so write permission is the session's confirmed-partition check, never a device flag.
 */
export const LIBRARY_READ_ONLY_REASON: Readonly<Record<LibraryKind, string>> = {
  sample: 'OpenNord only reads this keyboard’s samples: it couldn’t confirm where it keeps them.',
  piano: 'OpenNord only reads this keyboard’s pianos: it couldn’t confirm where it keeps them.',
};

/** Where the switch is kept; null when there is no storage (Node, a blocked or absent localStorage). */
type KeyStore = Pick<Storage, 'getItem' | 'setItem'> | null;

function browserStore(): KeyStore {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isKind = (v: unknown): v is LibraryKind => v === 'sample' || v === 'piano';

/**
 * Kinds the hardware session allowed on this computer. Fails closed: always empty
 * outside a development build (`import.meta.env.DEV`, as the rest of the app gates
 * dev tools), without storage, or with anything stored that isn't a list of kinds.
 * A stored switch is not even read in a production build.
 */
export function untestedWritesAllowed(dev: boolean = import.meta.env.DEV, storage: KeyStore = browserStore()): LibraryKind[] {
  if (!dev || !storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(UNTESTED_WRITES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isKind) : [];
  } catch {
    return [];
  }
}

/** Fired on `window` after {@link setUntestedWrites}, so the dev warning banner follows the switch. */
export const UNTESTED_WRITES_EVENT = 'opennord:untested-writes';

/** Store the kinds the /dev/hardware page allows. */
export function setUntestedWrites(kinds: LibraryKind[], storage: KeyStore = browserStore()): void {
  try {
    storage?.setItem(UNTESTED_WRITES_KEY, JSON.stringify(kinds));
  } catch {
    // storage refused (private window): the switch just doesn't stick
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UNTESTED_WRITES_EVENT));
}

/** Whether OpenNord may write this kind to a Nord now. */
export function libraryWritesOn(
  kind: LibraryKind,
  verified: Readonly<Record<LibraryKind, boolean>> = LIBRARY_WRITES_VERIFIED,
  allowed: LibraryKind[] = untestedWritesAllowed(),
): boolean {
  return verified[kind] || allowed.includes(kind);
}

/** {@link libraryWritesOn} for both kinds, as the UI and the restore preview read it. */
export function libraryWritesNow(): Record<LibraryKind, boolean> {
  return { sample: libraryWritesOn('sample'), piano: libraryWritesOn('piano') };
}
