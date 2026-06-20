/**
 * The curated capability-validation matrix — the source of truth the compatibility
 * view renders against. Each cell records how confident we are that a capability
 * works for a model: hardware-validated, reverse-engineered (untested), inferred
 * from a sibling, unsupported, or unknown ("needs a tester"). The live probe
 * (lib/device/probe.ts) lets owners contribute evidence that flips a cell to
 * `validated` via a GitHub PR.
 *
 * The non-Stage-4 rows are a reverse-engineering assessment (not hardware-tested):
 * the whole line shares ONE vendor-USB FileTransfer transport (docs/NORD-PRODUCT-LINE.md),
 * so transfer capabilities are at least `inferred` everywhere; only Stage 4 is
 * `validated`. Real owners running the read-only probe upgrade cells to `validated`.
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

export const VALIDATION: Partial<Record<NordModelId, Partial<Record<Capability, CapabilityStatus>>>> = {
  'stage-classic': {
    'file-read': { status: 'inferred', note: "OG gen, tag 'nsp' (distinct from RE'd ns2p); no decoder, same-era inference" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC-gated); read-only CQryPartList, OG sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nsb/ns2exb ZIP backup via FileTransfer; OG-sibling inference, untested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; no sample engine" },
  },
  'stage-ex': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re), shares ns2p tag; decoder not directly RE'd/tested" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, inferred from stage-2, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "ns2exb ZIP backup; OG-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded in lib/ns4/nsmp*.ts; untested on HW" },
  },
  'stage-2': {
    'file-read': { status: 're', note: "OG anchor; ns2p body codec RE'd (NSMP-CODEC), not HW-tested" },
    enumerate: { status: 're', note: "shared vendor-USB FileTransfer, same OG gen; read-only, untested HW" },
    pull: { status: 're', note: "FileTransfer Download RE'd; read-only, no Stage 2 HW test" },
    push: { status: 're', note: "FileTransfer Upload RE'd; WRITE op, untested-write risk on HW" },
    delete: { status: 're', note: "FileTransfer Delete RE'd; WRITE op, untested-write risk on HW" },
    backup: { status: 're', note: "ns2b ZIP of flat programs; mechanism RE'd, untested" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded; untested on HW" },
  },
  'stage-3': {
    'file-read': { status: 're', note: "ns3f NW1-v3 decoder in progress (#22); v3 envelope, not HW-tested" },
    enumerate: { status: 're', note: "shared vendor-USB FileTransfer, same NW1 gen; read-only, untested HW" },
    pull: { status: 're', note: "FileTransfer Download RE'd; read-only, no Stage 3 HW test" },
    push: { status: 're', note: "FileTransfer Upload RE'd; WRITE op, untested-write risk on HW" },
    delete: { status: 're', note: "FileTransfer Delete RE'd; WRITE op, untested-write risk on HW" },
    backup: { status: 're', note: "ns3b ZIP backup; mechanism RE'd, untested on HW" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp*.ts; untested on HW" },
  },
  'stage-4': {
    'file-read': { status: 'validated', note: "ns4p decoded 0-mismatch vs ns4decode against real HW fixture" },
    enumerate: { status: 'validated', note: "CQryPartList HW-validated, VID 0x0FFC/PID 0x002E, fw 3.40 (PROTOCOL-RE)" },
    pull: { status: 'validated', note: "FileTransfer Download HW-validated on real Stage 4" },
    push: { status: 'validated', note: "FileTransfer Upload/write HW-validated on real Stage 4" },
    delete: { status: 'validated', note: "FileTransfer Delete HW-validated on real Stage 4" },
    backup: { status: 'validated', note: "ns4b backup flow HW-validated on real Stage 4" },
    samples: { status: 'validated', note: "sampleCodec 'codec4' (nsmp4) decoded + validated on HW" },
  },
  'electro-3': {
    'file-read': { status: 'inferred', note: "OG gen, tag nepg; sibling of stage-2 (re), no E3 file RE'd" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "neb ZIP of flat programs; OG-sibling inference, no E3 HW test" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded in lib/ns4/nsmp*.ts; not HW-tested on E3" },
  },
  'electro-3-hp': {
    'file-read': { status: 'inferred', note: "OG gen, tag nepg (same as E3); sibling of stage-2 (re), no HP file RE'd" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "neb ZIP backup; OG-sibling inference, no HP HW test" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded; not HW-tested on E3 HP" },
  },
  'electro-4': {
    'file-read': { status: 're', note: "ne4p legacy formatType-0 header NSM-traced (CElectro4 ctor, shared category table 0x0e resolved); validated vs real .ne4p fixtures, not HW-tested" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "ne4b/ne4db ZIP backup; OG-sibling inference, no E4 HW test" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded in lib/ns4/nsmp*.ts; not HW-tested on E4" },
  },
  'electro-5': {
    'file-read': { status: 're', note: "ne5p legacy formatType-0 header + CElectro5::BankToCategories + CElectro5::ConvertLocation NSM-traced; 8-partition spec from CElectro5 ctor; validated vs real .ne5p fixtures, not HW-tested" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 're', note: "ne5t/ne5l/ne5s backup tags + partition set NSM-traced (Backup_RenameFolder, CElectro5 ctor); validated vs real .ne5p fixtures, not HW-tested" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp*.ts; not HW-tested on E5" },
  },
  'electro-6': {
    'file-read': { status: 'inferred', note: "NW1-v3 gen, tag ne6p; sibling of stage-3 (re, #22), no E6 file RE'd" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 'inferred', note: "ne6b ZIP (partition set in partitions.ts); v3-sibling, no E6 HW test" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp*.ts; not HW-tested on E6" },
  },
  'piano-1': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re); nppg body codec not yet RE'd" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "npb ZIP backup via shared transport; OG-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded in lib/ns4/nsmp*.ts; not HW-tested" },
  },
  'piano-2': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re); np2p body codec not yet RE'd" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "ZIP backup via shared transport; OG-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded; not HW-tested" },
  },
  'piano-3': {
    'file-read': { status: 'inferred', note: "NW1-v3 sibling of stage-3 (re, #22); np3p reuses v3 codec, unverified" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 'inferred', note: "ZIP backup via shared transport; v3-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp3; not HW-tested" },
  },
  'piano-4': {
    'file-read': { status: 'inferred', note: "NW1-v3 sibling of stage-3 (re); np4p reuses v3 codec, unverified" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 'inferred', note: "ZIP backup via shared transport; v3-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded; not HW-tested" },
  },
  'piano-5': {
    'file-read': { status: 'inferred', note: "NW1-v4 sibling of stage-4; np5p shares v4 codec, not validated on Piano" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v4-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v4-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v4-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v4-sibling inference" },
    backup: { status: 'inferred', note: "ZIP backup via shared transport; v4-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'codec4' decoded in lib/ns4/nsmp4; not HW-tested" },
  },
  'piano-6': {
    'file-read': { status: 'inferred', note: "NW1-v4 sibling of stage-4; np6p shares v4 codec, not validated on Piano" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v4-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v4-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v4-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v4-sibling inference" },
    backup: { status: 'inferred', note: "np6b ZIP backup via shared transport; v4-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'codec4' decoded; not HW-tested" },
  },
  'lead-4': {
    'file-read': { status: 'inferred', note: "OG gen, shared CBIN container; no Lead body decoder, engine-specific param map" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only CQryPartList, OG sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nl4b ZIP backup via FileTransfer; OG-sibling inference, not HW-confirmed" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; no sample engine on Lead 4" },
  },
  'lead-a1': {
    'file-read': { status: 'inferred', note: "OG gen, shared CBIN container; CMini handler inferred in NSM, no body decoder" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nlab ZIP backup via FileTransfer; OG-sibling inference, not HW-confirmed" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; no sample engine on Lead A1" },
  },
  'wave': {
    'file-read': { status: 'inferred', note: "OG gen, sibling of stage-2 (re); nwp body not yet decoded" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, OG-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nwb ZIP via FileTransfer; OG-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'og' (codec-1) decoded in lib/ns4/nsmp*.ts; not HW-tested" },
  },
  'wave-2': {
    'file-read': { status: 'inferred', note: "NW1-v3 gen, sibling of stage-3 (re, #22); no dedicated nw2p decoder" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 'inferred', note: "nw2b ZIP via FileTransfer; v3-sibling inference, untested" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp*.ts; not HW-tested" },
  },
  'c2': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re); no nc2p body decoder yet" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC, CC2 handler); read-only, OG-sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nc2b ZIP backup via FileTransfer; OG-sibling inference, untested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; C2 has no sample engine" },
  },
  'c2d': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re); shares nc2p tag, no body decoder yet" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC, CC2D handler); read-only, OG-sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "nc2b ZIP backup via FileTransfer; OG-sibling inference, untested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; C2D has no sample engine" },
  },
  'grand': {
    'file-read': { status: 'inferred', note: "NW1-v3 sibling of stage-3/electro-6 (ngp, codec3); no Grand file tested" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v3-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v3-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v3-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v3-sibling inference" },
    backup: { status: 'inferred', note: "ngb ZIP backup via shared transport; v3-sibling inference, not HW-tested" },
    samples: { status: 're', note: "sampleCodec 'codec3' (nsmp3) decoded in lib/ns4/nsmp*; not HW-tested" },
  },
  'grand-2': {
    'file-read': { status: 'inferred', note: "NW1-v4 sibling of stage-4 (ng2p, codec4); shares v4 envelope, no Grand 2 file tested" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC); read-only, v4-sibling inference, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, v4-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, v4-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, v4-sibling inference" },
    backup: { status: 'inferred', note: "ng2b ZIP backup via shared transport; v4-sibling inference, not HW-tested" },
    samples: { status: 're', note: "sampleCodec 'codec4' (nsmp4) decoded in lib/ns4/nsmp*; not HW-tested" },
  },
  'organ-3': {
    'file-read': { status: 'inferred', note: "OG sibling of stage-2 (re); no3p tag, no body decoder yet" },
    enumerate: { status: 'inferred', note: "shared vendor-USB FileTransfer (0x0FFC, COrgan3 handler); read-only, OG-sibling, untested" },
    pull: { status: 'inferred', note: "shared FileTransfer Download; read-only, OG-sibling inference, untested" },
    push: { status: 'inferred', note: "shared FileTransfer Upload; WRITE \u2014 untested-write risk, OG-sibling inference" },
    delete: { status: 'inferred', note: "shared FileTransfer Delete; WRITE \u2014 untested-write risk, OG-sibling inference" },
    backup: { status: 'inferred', note: "no3b ZIP backup via FileTransfer; OG-sibling inference, untested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; Organ 3 has no sample engine" },
  },
};

export function statusFor(id: NordModelId, cap: Capability): CapabilityStatus {
  return VALIDATION[id]?.[cap] ?? { status: 'unknown' };
}
