import type { HTMLAttributes, ReactNode } from 'react';

export function Card(
  { accent = false, children, className = '', ...rest }:
  { accent?: boolean; children: ReactNode } & HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div className={`on-card ${accent ? 'on-card--accent' : ''} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
