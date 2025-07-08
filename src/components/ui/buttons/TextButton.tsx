// src/components/ui/buttons/TextButton.tsx
import { forwardRef, type ReactNode, type MouseEvent } from "react";
import clsx from "clsx";

export interface TextButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ 
    children, 
    onClick, 
    disabled = false, 
    className = '', 
    type = 'button' 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center px-2 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded";
    const styleClasses = "text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={clsx(baseClasses, styleClasses, disabledClasses, className)}
      >
        {children}
      </button>
    );
  }
);

TextButton.displayName = 'TextButton';
