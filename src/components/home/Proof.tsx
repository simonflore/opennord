import { SEC_TIGHT } from './layout';

const PROOF: { lead: string; body: string }[] = [
  {
    lead: 'Matched, not guessed',
    body: 'Stage 4 programs are validated field-for-field against real exports from the keyboard — nothing invented.',
  },
  {
    lead: 'Proven on hardware',
    body: 'Reading and writing over USB is tested live — enumerate, read and write, on a real Nord Stage 4.',
  },
  {
    lead: 'Stays on your device',
    body: 'Your files are read locally in your browser. No upload, no account, no tracking, no server.',
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
