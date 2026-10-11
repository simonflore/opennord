/**
 * Pre-filled GitHub issues for the contribute page's asks: share a few of your own
 * programs, or volunteer to measure some sounds. Each opens a new issue on the public
 * repo with a short form to fill in; the owner attaches files there themselves.
 *
 * Only programs the owner made are asked for (settings, never Nord audio), and
 * recordings stay on the owner's computer — only numbers are shared (docs/LEGAL.md).
 */
import { newIssueUrl } from '../device/report';

/** "Share two or three of your programs": the files plus what the Nord's display shows.
 *  `deviceName` is the connected Nord's name, or '' when none is connected. */
export function programsIssueUrl(deviceName = ''): string {
  return newIssueUrl('programs', `Programs from my ${deviceName || 'Nord'}`, [
    '## My Nord',
    `- Model: ${deviceName}`,
    '- OS version (shown in the System menu):',
    '',
    '## Programs',
    'Zip two or three programs you made yourself and drag the zip here. Programs hold settings',
    'only, never Nord sounds or samples, so please no factory programs.',
    '',
    'For each program, what your Nord shows:',
    '- Organ model and vibrato/chorus:',
    '- Amp type and EQ:',
    '- Effect 1 and Effect 2 (type and rate):',
    '- Rotary speaker speed:',
  ].join('\n'));
}

/** "Measure a few sounds": a volunteer form; we reply with what to measure for that model. */
export function measureIssueUrl(deviceName = ''): string {
  return newIssueUrl('measurements', `I can measure sounds on my ${deviceName || 'Nord'}`, [
    '## My Nord',
    `- Model: ${deviceName}`,
    '- OS version (shown in the System menu):',
    '- Audio interface:',
    '',
    "We'll reply with a short list of sounds to record for your model and a tool that measures",
    'them. Your recordings stay on your computer: you only post the numbers here.',
  ].join('\n'));
}
