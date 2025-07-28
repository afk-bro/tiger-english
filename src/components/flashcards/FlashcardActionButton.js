import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from "@/components/ui/buttons";
import clsx from "clsx";
export function FlashcardActionButton({ icon, label, tooltip, onClick, disabled = false, active = false, showLabel = true, className = "" }) {
    return (_jsxs("div", { className: clsx("flex flex-col items-center gap-1", className), children: [_jsx(IconButton, { icon: icon, onClick: onClick, disabled: disabled, "aria-label": tooltip, className: clsx("transition-all duration-200", active && "bg-primary-100 text-primary-700 border-primary-300", disabled && "opacity-50 cursor-not-allowed") }), label && showLabel && (_jsx("span", { className: clsx("text-xs font-medium text-center transition-colors duration-200", "hidden sm:block", // Hide on mobile by default
                active ? "text-primary-700" : "text-gray-600", disabled && "text-gray-400"), children: label }))] }));
}
