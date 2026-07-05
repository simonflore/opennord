import { probeDevice, inferProgramPartition } from './probe';
import type { NordSession } from './session';
import type { ModelInfo } from '../clavia/partitions';
import type { Diagnostics } from '../capabilities/types';

/**
 * Confirm (and, when needed, correct) a device's Program partition index at
 * connect time using the read-only probe.
 *
 * The registry only carries hardware-validated indices for the Stage 2/3/4
 * family; for every other model we start from a static (NSM-recovered) guess or
 * the Stage-4 default. This runs the read-only partition probe, finds which
 * partition actually holds the model's program files (by fourcc), and:
 *   1. returns that index so THIS session transfers to the right partition even
 *      when the registry's guess was wrong (e.g. Stage 3, whose real index is
 *      not statically recoverable), and
 *   2. records a diagnostic with the full partition→fourcc map + whether the
 *      probe agreed with the guess — so real user connects fill in the map we
 *      can't get without hardware, and we bake confirmed indices into the
 *      registry over time.
 *
 * Read-only and best-effort: any failure falls back to `guessed` and never
 * breaks the connect.
 */
export async function confirmProgramPartition(
  session: NordSession,
  model: ModelInfo | undefined,
  guessed: number,
  diagnostics: Diagnostics,
  now: () => Date = () => new Date(),
): Promise<number> {
  const tag = model?.programTag ?? undefined;
  if (!tag) return guessed; // no program fourcc to look for (e.g. iPad placeholder)
  try {
    const report = await probeDevice(session, {
      deviceName: model?.name ?? 'Nord',
      productId: model?.productId ?? 0,
      now,
    });
    const probed = inferProgramPartition(report, tag);
    const adopted = probed ?? guessed;
    diagnostics.record({
      kind: 'device.partition-probe',
      ok: probed !== undefined,
      message: `${model?.id ?? 'device'} program partition: probed=${probed ?? 'not-found'} guessed=${guessed} adopted=${adopted}`,
      detail: {
        model: model?.id,
        programTag: tag,
        probed,
        guessed,
        adopted,
        agrees: probed === guessed,
        partitions: report.partitions.map((p) => ({ index: p.index, files: p.fileCount, fourccs: p.fourccs })),
      },
    });
    return adopted;
  } catch (e) {
    diagnostics.record({
      kind: 'device.partition-probe',
      ok: false,
      message: `partition probe failed for ${model?.id ?? 'device'}`,
      detail: { model: model?.id, error: e instanceof Error ? e.message : String(e) },
    });
    return guessed;
  }
}
