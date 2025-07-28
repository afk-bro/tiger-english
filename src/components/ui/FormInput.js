import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ui/FormInput.tsx
import { forwardRef } from "react";
import clsx from "clsx";
const FormInput = forwardRef(({ name, label, placeholder, type = "text", icon, validationIcon, hasError, ...rest }, ref) => {
    return (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { htmlFor: name, className: clsx("block text-sm font-medium", hasError
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-700 dark:text-gray-300"), children: label }), _jsxs("div", { className: "relative", children: [icon && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center", children: icon })), _jsx("input", { id: name, name: name, type: type, ref: ref, placeholder: placeholder, className: clsx("w-full rounded-md border px-3 py-2 text-sm text-gray-900", "placeholder-gray-400 focus:outline-none focus:ring-2", "dark:bg-gray-900 dark:text-white dark:placeholder-gray-500", hasError
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600"
                            : "border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700", icon && "pl-10", validationIcon && "pr-10"), ...rest }), validationIcon && (_jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center", children: validationIcon }))] })] }));
});
FormInput.displayName = "FormInput";
export default FormInput;
