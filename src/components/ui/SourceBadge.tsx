import { SOURCE_LABEL, type LibrarySource } from '@/lib/library/types';
import { cn } from '@/lib/cn';

const COLOR: Record<LibrarySource, string> = {
  nord: 'text-red',
  local: 'text-muted',
  backup: 'text-focus',
  cloud: 'text-warn',
};

export function SourceBadge({ source }: { source: LibrarySource }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[9px] font-semibold tracking-[.4px]', COLOR[source])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {SOURCE_LABEL[source]}
    </span>
  );
}
