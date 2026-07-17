import { SEC } from './layout';
import { SectionHead } from './SectionHead';

export function Why() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Knowledge that outlives us"
        title="Community knowledge, given a lasting home"
        sub="Everything that makes OpenNord possible was figured out by the community, in the open. This gives that work a place that outlives any one person."
      />
      <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1 max-[860px]:gap-4">
        <WhyItem
          n="01"
          title="Traceable, not guessed"
          body="Every setting OpenNord shows is derived from real files and validated against actual hardware — accurate today and re-derivable tomorrow."
        />
        <WhyItem
          n="02"
          title="Works from a file alone"
          body="Reading, organizing and playing your patches all work without a keyboard connected. Device transfer is a bonus, never a requirement."
        />
        <WhyItem
          n="03"
          title="Your work stays yours"
          body="Programs describe your own settings and point to samples by name — OpenNord never copies Nord’s factory sounds. Your creative work stays yours."
        />
      </div>
    </section>
  );
}

function WhyItem({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="pt-0.5 font-mono text-[13px] font-extrabold text-red">{n}</div>
      <div>
        <div className="text-[15px] font-bold text-ink">{title}</div>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-dim">{body}</p>
      </div>
    </div>
  );
}
