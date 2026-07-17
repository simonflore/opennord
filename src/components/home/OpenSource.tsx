import { Link } from '@tanstack/react-router';
import { buttonVariants, SectionLabel, BuyMeACoffeeButton } from '@/components/ui';
import { SEC } from './layout';
import { heroBtn } from './styles';

export function OpenSource() {
  return (
    <section className={SEC}>
      <div className="rounded-lg border border-line fill-raised elev-2 px-4 py-[clamp(24px,5vw,56px)] text-center">
        <SectionLabel variant="eyebrow">Free, and staying that way</SectionLabel>
        <h2 className="m-0 mt-2 font-extrabold leading-[1.15] tracking-[-0.6px] text-ink text-[clamp(22px,3.4vw,30px)]">
          Built in the open, licensed AGPL-3.0
        </h2>
        <p className="mx-auto mt-3 max-w-[34rem] text-[15px] leading-[1.6] text-dim">
          OpenNord is free software, developed in public. Try it, read the code,
          file an issue, or help decode the next model in the family.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/library/programs" className={heroBtn}>
            Open the app
          </Link>
          <a
            className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </a>
          <BuyMeACoffeeButton />
        </div>
      </div>
    </section>
  );
}
