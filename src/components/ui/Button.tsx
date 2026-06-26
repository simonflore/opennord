import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

export function Button(
  { variant = 'secondary', type = 'button', children, className = '', ...rest }:
  { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button type={type} className={`on-btn on-btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
