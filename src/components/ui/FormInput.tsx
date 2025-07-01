// src/components/ui/FormInput.tsx
import { forwardRef } from "react";
import clsx from "clsx";

type FormInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: string;
  id?: string;
  rows?: number;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, placeholder, type = "text", icon, ...rest }, ref) => {
    return (
      <div className="space-y-1">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
              "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900",
              "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-500",
              icon && "pl-10"
            )}
            {...rest}
          />
        </div>
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
