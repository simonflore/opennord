import type { NS4Program } from '../../lib/ns4/types';
import { sampleRefViews } from '../../lib/ns4/view';

const SAMPLE_LIBRARY = 'https://www.nordkeyboards.com/sounds/sample-library/';

export function SampleRefs({ program }: { program: NS4Program }) {
  const refs = sampleRefViews(program);
  if (refs.length === 0) return null;
  return (
    <div className="ps-deps">
      <div className="ps-deps-t">SAMPLES THIS PATCH REFERENCES</div>
      {refs.map((r) => (
        <a key={r.id} className="ps-dep" href={SAMPLE_LIBRARY} target="_blank" rel="noreferrer">
          ● {r.name}
        </a>
      ))}
    </div>
  );
}
