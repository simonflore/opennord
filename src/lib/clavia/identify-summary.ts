import { identifyFixture, crossCheckFixture, type FixtureFinding, type CrossCheck } from './fixture-report';
import { MODELS, type NordModelId } from './partitions';

export interface FileSummary {
  finding: FixtureFinding;
  modelGuess?: NordModelId;
  cross?: CrossCheck;
}

/** First registry model whose programTag equals `tag` (tags can be shared across models). */
export function guessModelByTag(tag: string | undefined): NordModelId | undefined {
  if (!tag) return undefined;
  return (Object.keys(MODELS) as NordModelId[]).find((id) => MODELS[id].programTag === tag);
}

/** Identify a file and, when its tag maps to a model, cross-check it against the registry. */
export function summarizeFile(name: string, bytes: Uint8Array): FileSummary {
  const finding = identifyFixture(name, bytes);
  const modelGuess = guessModelByTag(finding.tag);
  const cross = modelGuess ? crossCheckFixture(finding, modelGuess) : undefined;
  return { finding, modelGuess, cross };
}
