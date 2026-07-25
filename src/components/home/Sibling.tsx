import { SectionLabel } from '@/components/ui';
import { GigmeisterLink } from '@/components/sibling/Gigmeister';
import { SEC_TIGHT } from './layout';

/**
 * The sibling-product section — OpenNord's one mention of Gigmeister on the
 * landing page. See `components/sibling/Gigmeister.tsx` for the rules this
 * follows; the two that shape the markup here:
 *
 * - **Placed late, sized down.** It sits after `Why` (the reader is already
 *   convinced) and deliberately skips `SectionHead`/`text-display-2` — every
 *   section that makes a claim *about OpenNord* outranks this one typographically.
 * - **No red, no primary button.** A quiet outbound link, not a CTA. The loudest
 *   thing on this page stays "Open the app".
 *
 * The copy leads with OpenNord's boundary (what this tool will never do) rather
 * than Gigmeister's pitch, and discloses the relationship — same author,
 * separate app, paid — instead of letting the reader wonder.
 */
export function Sibling() {
  return (
    <section className={SEC_TIGHT}>
      <div className="rounded-lg border border-line p-[clamp(20px,3.4vw,36px)]">
        <div className="grid grid-cols-[1.15fr_0.85fr] items-start gap-[clamp(20px,4vw,56px)] max-[860px]:grid-cols-1 max-[860px]:gap-6">
          <div>
            <SectionLabel variant="eyebrow">Where OpenNord stops</SectionLabel>
            <h2 className="m-0 mt-3 font-bold leading-[1.25] text-ink text-[clamp(19px,2.6vw,26px)]">
              The instrument is one job. The gig is another.
            </h2>
            <p className="mt-3 max-w-[46ch] text-sm leading-[1.65] text-dim">
              OpenNord finishes at the keyboard: know what a patch does, get your
              library in order, put it on the instrument. What comes after — the
              setlist, the band, the program changes firing between songs — is a
              different job, and OpenNord isn&rsquo;t going to grow into it.
            </p>
            <p className="mt-3 max-w-[46ch] text-sm leading-[1.65] text-dim">
              That job is what <GigmeisterLink>Gigmeister</GigmeisterLink> does:
              setlists that drive your Nord over MIDI, plus the calendar, charts
              and rider that come with playing live. Built by the same person as
              OpenNord, and a separate paid product. OpenNord stays free, open
              and complete without it — this is here because the two meet, not
              because you need both.
            </p>
          </div>

          {/* The concrete overlap, stated as a fact about OpenNord's own data
              model. This is the part that earns the mention — a reader who
              organizes banks has met this problem. */}
          <aside className="rounded-md border border-line fill-raised p-4 edge-hi">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[1.6px] text-muted">
              Where they meet
            </div>
            <p className="mt-2.5 text-[13px] leading-[1.6] text-dim">
              The slot you drag a program into here —{' '}
              <span className="font-mono text-xs text-ink">A&#8202;:&#8202;1</span>,{' '}
              <span className="font-mono text-xs text-ink">B&#8202;:&#8202;7</span>{' '}
              — is the number a setlist sends as MIDI Program Change. Rearrange a
              bank in OpenNord and every set pointing at those slots moves with
              it.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
