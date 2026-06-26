import { useState, Fragment } from 'react';
import './compatibility.css';
import { ProbePanel } from './ProbePanel';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { MATRIX_COLUMNS, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';
import { decodeForModel, getModelProgress, DECODE_LABEL, type DecodeStatus } from '../../lib/contribute/coverage';
import { ByteMapView } from './ByteMapView';

const CHIP: Record<ValidationStatus, string> = {
  validated: 'Works', re: 'In progress', inferred: 'Likely', unsupported: '—', unknown: 'Needs a tester',
};

const DECODE_CELL: Record<DecodeStatus, ValidationStatus> = { full: 'validated', partial: 're', started: 're', none: 'unknown' };

export function MatrixView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

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
              <th className="cmp__cap">Program Parameters</th>
              {MATRIX_COLUMNS.map((c) => <th key={c} className="cmp__cap">{CAPABILITY_LABEL[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_MODELS.map((m) => {
              const isOpen = expanded === m.id;
              const progress = getModelProgress(m.id);
              const d = decodeForModel(m.id);
              return (
                <Fragment key={m.id}>
                  <tr
                    className={`cmp__row${isOpen ? ' cmp__row--expanded' : ''}`}
                    onClick={() => toggle(m.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(m.id)}
                    aria-expanded={isOpen}
                  >
                    <th className="cmp__model" scope="row">
                      <span className={`cmp__chevron${isOpen ? ' cmp__chevron--open' : ''}`}>▸</span>
                      {m.name}
                    </th>
                    {(() => {
                      const text =
                        d.status === 'full' ? `${d.paramCount} params`
                        : d.status === 'partial' ? 'Partial'
                        : d.status === 'started' ? (d.pct != null ? `${d.pct}%` : `${d.controlCount}✓`)
                        : '—';
                      return <td className={`cmp-cell cmp-cell--${DECODE_CELL[d.status]}`} title={DECODE_LABEL[d.status]}>{text}</td>;
                    })()}
                    {MATRIX_COLUMNS.map((c) => {
                      const s = statusFor(m.id, c).status;
                      return <td key={c} className={`cmp-cell cmp-cell--${s}`} title={CHIP[s]}>{CHIP[s]}</td>;
                    })}
                  </tr>

                  {isOpen && (
                    <tr className="cmp__detail-row">
                      <td colSpan={MATRIX_COLUMNS.length + 2}>
                        <div className="cmp__detail">
                          {progress?.regions
                            ? <ByteMapView progress={progress} />
                            : d.status !== 'none'
                            ? <p className="cmp__detail-msg">Decoded by the {m.name} reader — open one of its programs from your Library to view it. A byte-coverage map for this format isn’t built yet.</p>
                            : progress?.bodyBytes
                            ? <p className="cmp__detail-msg">Body is {progress.bodyBytes} bytes — body map coming soon. <a href="#/contribute">Help decode it →</a></p>
                            : <p className="cmp__detail-msg">No body data yet for this format. <a href="#/contribute">Be the first to map it →</a></p>
                          }
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
