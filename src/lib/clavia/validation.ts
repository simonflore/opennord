/**
 * The curated capability-validation matrix — the source of truth the compatibility
 * view renders against. Each cell records how confident we are that a capability
 * works for a model: hardware-validated, reverse-engineered (untested), inferred
 * from a sibling, unsupported, or unknown ("needs a tester"). The live probe
 * (lib/device/probe.ts) lets owners contribute evidence that flips a cell to
 * `validated` via a GitHub PR.
 */
import type { NordModelId } from './partitions';

export type Capability =
  | 'file-read' | 'enumerate' | 'pull' | 'push' | 'delete' | 'backup' | 'samples';

export const CAPABILITIES: readonly Capability[] =
  ['file-read', 'enumerate', 'pull', 'push', 'delete', 'backup', 'samples'];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  'file-read': 'Open files', enumerate: 'List patches', pull: 'Copy from Nord',
  push: 'Copy to Nord', delete: 'Delete on Nord', backup: 'Back up', samples: 'Samples',
};

export type ValidationStatus = 'validated' | 're' | 'inferred' | 'unsupported' | 'unknown';

export interface CapabilityStatus { status: ValidationStatus; note?: string; }

const all = (status: ValidationStatus): Partial<Record<Capability, CapabilityStatus>> =>
  Object.fromEntries(CAPABILITIES.map((c) => [c, { status }]));

export const VALIDATION: Partial<Record<NordModelId, Partial<Record<Capability, CapabilityStatus>>>> = {
  'stage-4': all('validated'),
  'stage-3': {
    'file-read': { status: 're', note: 'decoder in progress (#22)' },
    enumerate: { status: 're' }, pull: { status: 're' }, push: { status: 're' },
    delete: { status: 're' }, backup: { status: 're' }, samples: { status: 're' },
  },
  'stage-2': {
    'file-read': { status: 're' }, enumerate: { status: 'inferred' }, pull: { status: 'inferred' },
    push: { status: 'inferred' }, delete: { status: 'inferred' }, backup: { status: 'inferred' },
    samples: { status: 're' },
  },
};

export function statusFor(id: NordModelId, cap: Capability): CapabilityStatus {
  return VALIDATION[id]?.[cap] ?? { status: 'unknown' };
}
