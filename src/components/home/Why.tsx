import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { indexedRow, listIndex } from './styles';
import { cn } from '@/lib/cn';

const WHY: { title: string; body: string }[] = [
  {
    title: 'Traceable, not guessed',
    body: 'Every setting OpenNord shows is derived from real files and validated against actual hardware — accurate today and re-derivable tomorrow.',
  },
  {
    title: 'Works from a file alone',
    body: 'Reading, organizing and playing your patches all work without a keyboard connected. Device transfer is a bonus, never a requirement.',
  },
  {
    title: 'Your work stays yours',
    body: 'Programs describe your own settings and point to samples by name — OpenNord never copies Nord’s factory sounds. Your creative work stays yours.',
  },
];

export function Why() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Knowledge that outlives us"
        title="Community knowledge, given a lasting home"
        sub="Everything that makes OpenNord possible was figured out by the community, in the open. This gives that work a place that outlives any one person."
      />
      {/* Ruled columns with a mono index, like Proof and the feature list. The
          numbers are muted: the accent means selected or active, not "first". */}
      <ol className="m-0 grid list-none grid-cols-3 gap-x-10 p-0 max-[860px]:grid-cols-1">
        {WHY.map((w, i) => (
          <li key={w.title} className={cn(indexedRow, 'border-t border-line')}>
            <span className={listIndex}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div className="text-[15px] font-bold text-ink">{w.title}</div>
              <p className="mt-1 text-[13px] leading-[1.55] text-dim">{w.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
