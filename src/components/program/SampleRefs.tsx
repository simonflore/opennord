import type { NS4Program } from '../../lib/ns4/types';
import { sampleRefViews } from '../../lib/ns4/view';
import { resolveFactory } from '../../lib/device/factory';

const SAMPLE_LIBRARY = 'https://www.nordkeyboards.com/sounds/sample-library/';

export function SampleRefs({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const refs = sampleRefViews(program, scene);
  if (refs.length === 0) return null;
  return (
    <div className="ps-deps">
      <div className="ps-deps-t">SAMPLES THIS PATCH REFERENCES</div>
      {refs.map((r) => {
        const match = resolveFactory(r.name, 'nsmp4');
        return (
          <a
            key={r.id}
            className="ps-dep"
            href={match?.url ?? SAMPLE_LIBRARY}
            target="_blank"
            rel="noreferrer"
            title={match ? 'Official Nord download' : 'Find in the Nord Sample Library'}
          >
            ● {r.name}
          </a>
        );
      })}
    </div>
  );
}
