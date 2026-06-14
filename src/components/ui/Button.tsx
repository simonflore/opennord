import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button(
  { variant = 'secondary', children, className = '', ...rest }:
  { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button className={`on-btn on-btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
