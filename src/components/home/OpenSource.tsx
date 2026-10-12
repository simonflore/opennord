import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { buttonVariants, SectionLabel, BuyMeACoffeeButton } from '@/components/ui';
import { SEC } from './layout';
import { heroBtn, listHead, listRule } from './styles';

const SOURCE_URL = 'https://github.com/simonflore/opennord';

// The project's terms as a spec sheet: the values are facts, so they are set in
// mono like every other value on the page.
const FACTS: { label: string; value: string; href?: string }[] = [
  { label: 'License', value: 'AGPL-3.0-or-later' },
  { label: 'Source', value: 'github.com/simonflore/opennord', href: SOURCE_URL },
  { label: 'Price', value: 'Free' },
];

export function OpenSource() {
  return (
    <section className={SEC}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-x-10 gap-y-8 border-y border-line py-[clamp(24px,4vw,48px)] max-[860px]:grid-cols-1">
        <div>
          <SectionLabel variant="eyebrow">Free, and staying that way</SectionLabel>
          <h2 className="m-0 mt-4 text-display-3 text-ink">Built in the open</h2>
          <p className="mt-4 max-w-[34rem] text-[15px] leading-[1.6] text-dim">
            OpenNord is free software, developed in public. Try it, read the code,
            file an issue, or help decode the next model in the family.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/library/programs" className={heroBtn}>
              Open the app
            </Link>
            <a
              className={buttonVariants({ variant: 'secondary', size: 'lg' })}
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute on GitHub
            </a>
            <BuyMeACoffeeButton />
          </div>
        </div>
        <div className="self-start">
          <div className={listHead}>
            <span>The project</span>
          </div>
          <dl className="m-0">
            {FACTS.map((f) => (
              <div key={f.label} className={cn('flex items-baseline justify-between gap-4 py-3', listRule)}>
                <dt className="text-[13px] text-dim">{f.label}</dt>
                <dd className="m-0 min-w-0 break-all text-right font-mono text-[12px] text-ink">
                  {f.href
                    ? <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-ink no-underline hover:text-red-bright">{f.value}</a>
                    : f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
