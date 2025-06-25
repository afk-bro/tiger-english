// src/components/ui/FormInput.tsx
import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

type FormInputProps = {
  label: string;
  icon: ReactNode;
  placeholder?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, placeholder, ...rest }, ref) => {
    return (
      <div>
        <label className="text-sm font-medium block mb-1 text-text-light dark:text-text-dark">
          {label}
        </label>
        <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-base-dark">
          <div className="px-3">{icon}</div>
          <input
            ref={ref}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            {...rest}
          />
        </div>
      </div>
    );
  }
);

export default FormInput;
