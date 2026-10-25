import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'accent' | 'success' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-ink/90',
  accent: 'bg-terracotta text-white hover:bg-terracotta/90',
  success: 'bg-basil text-white hover:bg-basil/90',
  outline: 'border border-line bg-white text-ink hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'border border-terracotta/40 bg-white text-terracotta hover:bg-terracotta-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-12 px-5 text-base',
  xl: 'h-14 px-6 text-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
