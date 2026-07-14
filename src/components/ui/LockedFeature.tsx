/** A player-facing upsell panel shown where a cloud feature would be. Copy must
 *  speak the musician's language — no protocol/engineer jargon. The dashed
 *  border (vs. Card's solid one) is a deliberate "not enabled yet" cue. */
export function LockedFeature({ title, blurb }: { title: string; blurb: string }) {
  return (
    <section
      className="flex flex-col gap-2 rounded-md border border-dashed border-line bg-surface p-6 text-dim"
      role="note"
      aria-label={`${title} — not available`}
    >
      <h2 className="m-0 text-[15px] text-ink">{title}</h2>
      <p className="m-0 text-[11px]">{blurb}</p>
    </section>
  );
}
