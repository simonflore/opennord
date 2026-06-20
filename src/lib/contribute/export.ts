import type { ContributionBundle } from './types';
import type { ContributionSession } from './session';
import { bytesToBase64 } from '../device/base64';

/** Serialize a session into a downloadable contribution bundle. */
export function buildBundle(
  session: ContributionSession,
  opts: { pid: string; toolVersion: string; capturedAt: string },
): ContributionBundle {
  const base = session.baseline;
  if (!base) throw new Error('No baseline captured.');
  return {
    schema: 'opennord.contribution/1',
    model: {
      name: base.model.modelName ?? base.model.tag,
      pid: opts.pid,
      fileTag: base.model.tag,
    },
    tool: { version: opts.toolVersion, capturedAt: opts.capturedAt },
    baseline: { bodyLen: base.body.length, bodyB64: bytesToBase64(base.body) },
    entries: session.entries,
  };
}

export function bundleToJson(b: ContributionBundle): string {
  return JSON.stringify(b, null, 2);
}

/** e.g. opennord-contribution-ns4p-2026-06-20.json */
export function bundleFilename(b: ContributionBundle): string {
  const date = b.tool.capturedAt.slice(0, 10);
  return `opennord-contribution-${b.model.fileTag || 'unknown'}-${date}.json`;
}
