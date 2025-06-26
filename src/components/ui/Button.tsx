// src/components/ui/Button.tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type ButtonProps = {
  children: ReactNode;
  to?: string; // if present, renders a <Link>
  iconRight?: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
};

export default function Button({
  children,
  to,
  iconRight,
  variant = 'primary',
  className = '',
  size = 'md',
  type = 'button',
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200';

  const styles = {
    primary:
      'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
    ghost:
      'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300',
    outline:
      'border border-white text-white hover:text-white/80 hover:border-white/50',
    white:
      'bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1',
  };

  const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-6 py-3 text-base rounded-lg',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

  const classes = clsx(base, styles[variant], sizeStyles[size ?? 'md'], className);

  const content = (
    <span className={classes}>
      {children}
      {iconRight}
    </span>
  );

  return to ? (
    <Link to={to}>{content}</Link>
  ) : (
    <button type={type} className={classes}>
      {children}
      {iconRight}
    </button>
  );
}
