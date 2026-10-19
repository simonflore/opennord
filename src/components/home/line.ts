import { ALL_MODELS } from '../../lib/clavia/partitions';
import { CAPABILITIES, statusFor } from '../../lib/clavia/validation';

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

/**
 * Models where everything OpenNord does (reading, listing, copying, sending,
 * deleting, backing up, samples) has been tried on the real instrument.
 */
export const FULLY_TESTED = ALL_MODELS.filter((m) =>
  CAPABILITIES.every((c) => ['validated', 'unsupported'].includes(statusFor(m.id, c).status))
  && statusFor(m.id, 'file-read').status === 'validated');

/** Models whose files have been read correctly from a real instrument, but not everything else. */
export const READ_TESTED_ONLY = HARDWARE_VALIDATED.filter((m) => !FULLY_TESTED.includes(m));

/** "Nord Stage 4", "Nord Stage 3" → "Stage 4 and Stage 3". */
export function modelList(models: readonly { name: string }[]): string {
  const names = models.map((m) => m.name.replace(/^Nord /, ''));
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '');
}
