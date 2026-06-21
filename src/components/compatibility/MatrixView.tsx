import './compatibility.css';
import { ProbePanel } from './ProbePanel';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { CAPABILITIES, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';
import { decodeForModel, DECODE_LABEL, type DecodeStatus } from '../../lib/contribute/coverage';

const CHIP: Record<ValidationStatus, string> = {
  validated: 'Works', re: 'In progress', inferred: 'Likely', unsupported: '—', unknown: 'Needs a tester',
};

// Reuse the matrix cell colors for the decode column.
const DECODE_CELL: Record<DecodeStatus, ValidationStatus> = { full: 'validated', partial: 're', none: 'unknown' };

export function MatrixView() {
  return (
    <div className="cmp">
      <h1 className="cmp__title">Nord compatibility</h1>
      <p className="cmp__lead">What OpenNord can do with each Nord — and where we need your help.</p>
      <p className="cmp__lead">
        See your model marked <em>In progress</em> or <em>Needs a tester</em>?{' '}
        <a href="#/contribute">Help decode it →</a> — change one control at a time and OpenNord learns the format.
      </p>
      <ProbePanel />
      <div className="cmp__scroll">
        <table className="cmp__table">
          <thead>
            <tr>
              <th className="cmp__model">Model</th>
              <th className="cmp__cap">Sounds</th>
              {CAPABILITIES.map((c) => <th key={c} className="cmp__cap">{CAPABILITY_LABEL[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_MODELS.map((m) => (
              <tr key={m.id}>
                <th className="cmp__model" scope="row">{m.name}</th>
                {(() => {
                  const d = decodeForModel(m.id);
                  const text = d.status === 'full' ? `${d.paramCount} params` : d.status === 'partial' ? 'Partial' : '—';
                  return <td className={`cmp-cell cmp-cell--${DECODE_CELL[d.status]}`} title={DECODE_LABEL[d.status]}>{text}</td>;
                })()}
                {CAPABILITIES.map((c) => {
                  const s = statusFor(m.id, c).status;
                  return <td key={c} className={`cmp-cell cmp-cell--${s}`} title={CHIP[s]}>{CHIP[s]}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
