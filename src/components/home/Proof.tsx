import { SEC_TIGHT } from './layout';

const PROOF: { lead: string; body: string }[] = [
  {
    lead: 'Matched, not guessed',
    body: 'Stage 4 programs are validated field for field against real exports from the keyboard. Nothing is invented.',
  },
  {
    lead: 'Proven on hardware',
    body: 'Reading and writing over USB is tested live on a real Nord Stage 4: list, read and write.',
  },
  {
    lead: 'Read on your device',
    body: 'The files you open are read in your browser. Nothing you open is uploaded unless you choose to send it, and there is no tracking.',
  },
];

export function Proof() {
  return (
    <section className={SEC_TIGHT}>
      <div className="grid grid-cols-3 gap-x-10 max-[860px]:grid-cols-1">
        {PROOF.map((p) => (
          <div className="border-t border-line py-4" key={p.lead}>
            <div className="font-mono text-[11px] uppercase tracking-[1px] text-ink">{p.lead}</div>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-dim">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
