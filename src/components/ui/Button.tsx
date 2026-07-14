import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The button primitive: token-styled via Tailwind utilities, variants driven by
 * `cva`. Honors the Studio Dark button language — top-lit fills, a lift on hover,
 * a press-down on active, the single red accent for primary — and adds a `size`
 * axis + a visible focus ring. Drop-in for the old API (`variant` unchanged).
 */
const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2 font-bold tracking-[.2px] rounded-sm',
    'border border-transparent cursor-pointer select-none',
    'shadow-[var(--edge-hi),var(--shadow-1)]',
    'transition-[transform,box-shadow,background,border-color] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
    'hover:-translate-y-px active:translate-y-0 active:shadow-[var(--shadow-inset)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
    'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:shadow-[var(--shadow-1)]',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-[var(--grad-red)] text-text-on-accent shadow-[var(--glow-red)] hover:shadow-[var(--glow-red),var(--shadow-2)]',
        secondary: 'bg-[var(--grad-raised)] text-ink border-line hover:border-muted',
        ghost: 'bg-transparent text-dim shadow-none hover:text-ink hover:translate-y-0',
        outline: 'bg-transparent text-red-bright border-red shadow-none hover:bg-[color-mix(in_srgb,var(--red)_10%,transparent)]',
      },
      size: {
        sm: 'text-[11px] px-[14px] py-2',
        md: 'text-[13px] px-4 py-2.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'sm' },
  },
);

type ButtonProps = VariantProps<typeof button> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & { children: ReactNode };

export function Button({ variant, size, type = 'button', className, children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={cn(button({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
}
