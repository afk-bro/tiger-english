// src/components/ui/buttons/PrimaryButton.tsx
import { forwardRef, type ReactNode, type MouseEvent } from "react";
import clsx from "clsx";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit';
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ 
    children, 
    onClick, 
    disabled = false, 
    icon, 
    iconPosition = 'left', 
    className = '', 
    type = 'button' 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200";
    const styleClasses = "bg-gradient-to-r from-accent-600 to-accent-400 hover:from-accent-800 hover:to-accent-300 text-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-gold-400";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={clsx(baseClasses, styleClasses, disabledClasses, className)}
      >
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
