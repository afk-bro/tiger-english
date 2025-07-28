import { jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ui/buttons/SecondaryButton.tsx
import { forwardRef } from "react";
import clsx from "clsx";
export const SecondaryButton = forwardRef(({ children, onClick, disabled = false, icon, iconPosition = 'left', className = '', type = 'button' }, ref) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200";
    const styleClasses = "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 dark:border-slate-600";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    return (_jsxs("button", { ref: ref, type: type, onClick: onClick, disabled: disabled, className: clsx(baseClasses, styleClasses, disabledClasses, className), children: [icon && iconPosition === 'left' && icon, children, icon && iconPosition === 'right' && icon] }));
});
SecondaryButton.displayName = 'SecondaryButton';
