// src/components/ui/FormInput.tsx
import { forwardRef } from "react";
import clsx from "clsx";

type FormInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  validationIcon?: React.ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: string;
  hasError?: boolean;
  id?: string;
  rows?: number;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, placeholder, type = "text", icon, validationIcon, hasError, ...rest }, ref) => {
    return (
      <div className="space-y-1">
        <label
          htmlFor={name}
          className={clsx(
            "block text-sm font-medium",
            hasError 
              ? "text-red-600 dark:text-red-400" 
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              {icon}
            </div>
          )}
          <input
            id={name} // must match htmlFor
            name={name}
            type={type}
            ref={ref}
            placeholder={placeholder}
            className={clsx(
              "w-full rounded-md border px-3 py-2 text-sm text-gray-900",
              "placeholder-gray-400 focus:outline-none focus:ring-2",
              "dark:bg-gray-900 dark:text-white dark:placeholder-gray-500",
              hasError 
                ? "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600" 
                : "border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700",
              icon && "pl-10",
              validationIcon && "pr-10"
            )}
            {...rest}
          />
          {validationIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {validationIcon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
