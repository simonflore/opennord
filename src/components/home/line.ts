import { ALL_MODELS } from '../../lib/clavia/partitions';
import { statusFor } from '../../lib/clavia/validation';

/**
 * What OpenNord covers across the Nord line, counted from the model registry and
 * validation.ts (the source of the compatibility matrix), so the landing page's
 * numbers move with the readers instead of being typed in.
 */
const fileRead = (id: (typeof ALL_MODELS)[number]['id']) => statusFor(id, 'file-read').status;

/** Models whose programs OpenNord opens (a reader exists, whatever its confidence). */
export const READ_MODELS = ALL_MODELS.filter((m) => fileRead(m.id) !== 'unsupported' && fileRead(m.id) !== 'unknown');

/** Models whose reading is validated against the real instrument. */
export const HARDWARE_VALIDATED = READ_MODELS.filter((m) => fileRead(m.id) === 'validated');

/** "Nord Stage 2 EX" → "Stage"; the C-series organs and the Organ 3 are "Organ". */
function familyOf(name: string): string {
  const word = name.replace(/^Nord /, '').split(' ')[0];
  return /^C\d/.test(word) ? 'Organ' : word;
}

/** The families read today with how many models of each, largest first. */
export const READ_FAMILIES: { family: string; models: number }[] = (() => {
  const count = new Map<string, number>();
  for (const m of READ_MODELS) count.set(familyOf(m.name), (count.get(familyOf(m.name)) ?? 0) + 1);
  return [...count].map(([family, models]) => ({ family, models })).sort((a, b) => b.models - a.models);
})();
