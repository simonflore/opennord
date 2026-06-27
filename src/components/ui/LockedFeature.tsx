import './LockedFeature.css';

/** A player-facing upsell panel shown where a cloud feature would be. Copy must
 *  speak the musician's language — no protocol/engineer jargon. */
export function LockedFeature({ title, blurb }: { title: string; blurb: string }) {
  return (
    <section className="on-locked" role="note" aria-label={`${title} — not available`}>
      <h2 className="on-locked__title">{title}</h2>
      <p className="on-locked__blurb">{blurb}</p>
    </section>
  );
}
