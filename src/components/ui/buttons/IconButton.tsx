// src/components/ui/buttons/IconButton.tsx
import { forwardRef, type ReactNode, type MouseEvent } from "react";
import clsx from "clsx";

export interface IconButtonProps {
  icon: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  'aria-label': string; // Required for accessibility
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon, 
    onClick, 
    disabled = false, 
    'aria-label': ariaLabel,
    className = '', 
    size = 'md',
    type = 'button' 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2";
    
    const sizeClasses = {
      sm: "p-2 text-sm",
      md: "p-3 text-base", 
      lg: "p-4 text-lg"
    };
    
    const styleClasses = "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={clsx(baseClasses, sizeClasses[size], styleClasses, disabledClasses, className)}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
