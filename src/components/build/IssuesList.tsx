import { SectionLabel } from '@/components/ui';
import type { SampleProject } from '@/lib/sample-build/model';
import { TARGETS, type Issue } from '@/lib/sample-build/targets';

/** The issues as list rows, errors in danger and warnings in warn; a zone's issue selects it when `onSelectZone` is set. */
export function IssueRows({ issues, onSelectZone }: { issues: Issue[]; onSelectZone?: (zoneId: string) => void }) {
  return (
    <>
      {issues.map((i, k) => (
        <li key={k} className={i.level === 'error' ? 'text-danger' : 'text-warn'}>
          {i.zoneId && onSelectZone
            ? <button type="button" className="min-h-11 text-left underline-offset-2 hover:underline" onClick={() => onSelectZone(i.zoneId!)}>{i.message}</button>
            : i.message}
        </li>
      ))}
    </>
  );
}

/** What the file will and won't get, in plain words (spec §7, Save & send's list). */
export function IssuesList({ project, onSelectZone }: { project: SampleProject; onSelectZone: (zoneId: string) => void }) {
  const issues = TARGETS[project.target].check(project);
  if (!issues.length) return null;
  return (
    <section aria-label="Before you save" className="flex flex-col gap-1">
      <SectionLabel>Before you save</SectionLabel>
      <ul className="flex flex-col gap-1">
        <IssueRows issues={issues} onSelectZone={onSelectZone} />
      </ul>
    </section>
  );
}
