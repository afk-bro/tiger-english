import { jsx as _jsx } from "react/jsx-runtime";
// src/components/ui/buttons/TextButton.tsx
import { forwardRef } from "react";
import clsx from "clsx";
export const TextButton = forwardRef(({ children, onClick, disabled = false, className = '', type = 'button' }, ref) => {
    const baseClasses = "inline-flex items-center justify-center px-2 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded";
    const styleClasses = "text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    return (_jsx("button", { ref: ref, type: type, onClick: onClick, disabled: disabled, className: clsx(baseClasses, styleClasses, disabledClasses, className), children: children }));
});
TextButton.displayName = 'TextButton';
