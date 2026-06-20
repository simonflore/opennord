import './compatibility.css';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { CAPABILITIES, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';

const CHIP: Record<ValidationStatus, string> = {
  validated: 'Works', re: 'In progress', inferred: 'Likely', unsupported: '—', unknown: 'Needs a tester',
};

export function MatrixView() {
  return (
    <div className="cmp">
      <h1 className="cmp__title">Nord compatibility</h1>
      <p className="cmp__lead">What OpenNord can do with each Nord — and where we need your help.</p>
      <div className="cmp__scroll">
        <table className="cmp__table">
          <thead>
            <tr>
              <th className="cmp__model">Model</th>
              {CAPABILITIES.map((c) => <th key={c} className="cmp__cap">{CAPABILITY_LABEL[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_MODELS.map((m) => (
              <tr key={m.id}>
                <th className="cmp__model" scope="row">{m.name}</th>
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
