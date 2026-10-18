import { getErrorMessage } from '../errors';

/** A user dismissing a folder picker is not an error worth surfacing. */
export function isPickerCancel(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  return /cancel|no folder chosen|aborted/i.test(getErrorMessage(err));
}
