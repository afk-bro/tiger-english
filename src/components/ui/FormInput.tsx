// src/components/ui/FormInput.tsx
import type { ReactNode } from 'react';

type FormInputProps = {
  label: string;
  icon: ReactNode;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  name?: string;
};

export default function FormInput({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  name,
}: FormInputProps) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1 text-text-light dark:text-text-dark">
        {label}
      </label>
      <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-base-dark">
        <div className="px-3">{icon}</div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );
}
