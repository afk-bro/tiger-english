// src/components/ui/FormInput.tsx
import {forwardRef} from 'react'

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
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, placeholder, type = 'text', icon, ...rest }, ref) => {
    return (
      <div className="space-y-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="relative">
          {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center">{icon}</div>}
          <input
            id={name}              // ✅ must match htmlFor
            name={name}
            type={type}
            ref={ref}
            placeholder={placeholder}
            className="input-class"
            {...rest}
          />
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
export default FormInput;