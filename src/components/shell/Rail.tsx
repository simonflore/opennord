import { DeviceStatus } from './DeviceStatus';

interface Props {
  active: string;
  onNavigate: (dest: string) => void;
  onManageDevice: () => void;
}

const DESTS: Array<{ id: string; label: string }> = [
  { id: 'library', label: 'Library' },
  { id: 'samples', label: 'Samples' },
];

const DEV_DESTS: Array<{ id: string; label: string }> = [
  { id: 'inspect', label: 'Decode Inspector' },
  { id: 'decode', label: 'Program Decode' },
];

export function Rail({ active, onNavigate, onManageDevice }: Props) {
  return (
    <nav className="on-rail">
      <div className="on-rail__brand">Open<span className="on-rail__brand-accent">Nord</span></div>

      {DESTS.map((d) => (
        <button
          key={d.id}
          className={`on-nav ${active === d.id ? 'on-nav--active' : ''}`.trim()}
          onClick={() => onNavigate(d.id)}
        >
          {d.label}
        </button>
      ))}

      <div className="on-rail__spacer" />

      <DeviceStatus onManage={onManageDevice} />

      <details className="on-rail__dev">
        <summary>Developer</summary>
        {DEV_DESTS.map((d) => (
          <button
            key={d.id}
            className={`on-nav on-nav--sub ${active === d.id ? 'on-nav--active' : ''}`.trim()}
            onClick={() => onNavigate(d.id)}
          >
            {d.label}
          </button>
        ))}
      </details>
    </nav>
  );
}
