import { unzipSync } from 'fflate';
import { identifyNordFile, type NordGeneration } from './nord-file';
import { identifyNsmp } from './sample-identify';
import { MODELS, type NordModelId } from './partitions';

export type FixtureKind = 'program' | 'preset' | 'backup' | 'sample' | 'unknown';

export interface FixtureFinding {
  name: string;
  ext: string;
  kind: FixtureKind;
  tag?: string;
  version?: string;
  generation?: NordGeneration;
  sampleCodec?: 'og' | 'codec3' | 'codec4';
  zipEntries?: string[];
  headerOk: boolean;
  error?: string;
}

export interface CrossCheck { ok: boolean; issues: string[]; }

const extOf = (name: string) => (name.split('.').pop() ?? '').toLowerCase();
const codecName = (c?: number): FixtureFinding['sampleCodec'] =>
  c === 1 ? 'og' : c === 3 ? 'codec3' : c === 4 ? 'codec4' : undefined;

/** Identify one file by extension. Never throws — malformed input is reported via `error`. */
export function identifyFixture(name: string, bytes: Uint8Array): FixtureFinding {
  const ext = extOf(name);
  try {
    if (ext.startsWith('nsmp')) {
      const s = identifyNsmp(bytes);
      return s.recognized
        ? { name, ext, kind: 'sample', version: s.version, sampleCodec: s.legacy ? 'og' : codecName(s.codec), headerOk: true }
        : { name, ext, kind: 'sample', headerOk: false, error: 'unrecognized sample container' };
    }
    if (ext.endsWith('b')) {
      const entries = Object.keys(unzipSync(bytes));
      return { name, ext, kind: 'backup', zipEntries: entries, headerOk: true };
    }
    const info = identifyNordFile(bytes);
    if (!info.recognized) return { name, ext, kind: 'unknown', headerOk: false, error: 'no CBIN magic' };
    const kind: FixtureKind = info.kind === 'program' || info.kind === 'performance' ? 'program' : 'preset';
    return { name, ext, kind, tag: info.tag, version: info.version, generation: info.generation, headerOk: true };
  } catch (e) {
    return { name, ext, kind: 'unknown', headerOk: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Compare a finding against the registry's per-model expectations; list discrepancies (the RE signal). */
export function crossCheckFixture(finding: FixtureFinding, modelId: NordModelId): CrossCheck {
  const model = MODELS[modelId];
  const issues: string[] = [];
  if (!model) return { ok: false, issues: [`unknown model id "${modelId}"`] };
  if (finding.kind === 'program' && finding.tag && model.programTag && finding.tag !== model.programTag) {
    issues.push(`tag ${finding.tag} != registry programTag ${model.programTag} for ${modelId}`);
  }
  if (finding.kind === 'sample') {
    if (model.sampleCodec === null) {
      issues.push(`${modelId} has no sample engine in the registry, but a sample file was found`);
    } else if (finding.sampleCodec && finding.sampleCodec !== model.sampleCodec) {
      issues.push(`sample codec ${finding.sampleCodec} != registry ${model.sampleCodec} for ${modelId}`);
    }
  }
  if (!finding.headerOk && finding.error) issues.push(`did not identify: ${finding.error}`);
  return { ok: issues.length === 0, issues };
}
