import { Pill } from '../ui';

/**
 * Provenance badge for backup content: "Factory" (re-downloadable from Nord)
 * vs "Yours" (user content). Shared by User Samples and Piano Samples so the
 * wording can't drift between them.
 */
export function FactoryPill({ factory }: { factory: boolean }) {
  return <Pill>{factory ? 'Factory' : 'Yours'}</Pill>;
}
