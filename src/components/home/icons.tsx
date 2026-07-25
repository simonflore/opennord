/* ── Icons (line, currentColor — premium over emoji) ─────────────────────── */

function svgProps() {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function IconFile() {
  return (
    <svg {...svgProps()}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconLibrary() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="7" height="16" rx="1" />
      <rect x="14" y="4" width="7" height="16" rx="1" />
      <path d="M6.5 8h0M17.5 8h0" />
    </svg>
  );
}

export function IconWave() {
  return (
    <svg {...svgProps()}>
      <path d="M3 12h2l2-6 3 14 3-16 3 12 2-4h3" />
    </svg>
  );
}

export function IconUsb() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V5" />
      <path d="M9 8l3-3 3 3" />
      <path d="M12 12l4-2v-2" />
      <circle cx="16" cy="8" r="1" />
      <path d="M12 14l-4-2V9" />
      <rect x="6.5" y="7" width="3" height="2.4" rx="0.4" />
    </svg>
  );
}

export function IconConvert() {
  return (
    <svg {...svgProps()}>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}

/** Ascending bars with an arrowhead on the tallest — "step your program up a generation". */
export function IconUpgrade() {
  return (
    <svg {...svgProps()}>
      <path d="M3 20h18" />
      <path d="M6 20v-4M12 20v-8M18 20v-11" />
      <path d="M15 12l3-3 3 3" />
    </svg>
  );
}

export function IconBackup() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3l7 3v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg {...svgProps()}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconDownload() {
  return (
    <svg {...svgProps()}>
      <path d="M12 4v11" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function IconDesktop() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function IconLock() {
  return (
    <svg {...svgProps()}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

/** Filled glyphs for the download buttons (brand marks, not line icons). */
export function IconApple() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.05 1.6-.75 3-.75s1.8.75 3 .72c1.2-.02 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.03-.01-2.4-.9-2.4-3.6zM14.3 5.9c.65-.8 1.1-1.9.95-3-1 .04-2.2.66-2.9 1.46-.6.7-1.15 1.83-1 2.9 1.1.08 2.3-.56 2.95-1.36z" />
    </svg>
  );
}

export function IconWindows() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.5 10.5 4.4v7.1H3zM11.5 4.3 21 3v8.5h-9.5zM3 12.5h7.5v7.1L3 18.5zM11.5 12.5H21V21l-9.5-1.3z" />
    </svg>
  );
}
