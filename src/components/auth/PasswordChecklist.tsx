import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES, PasswordRule } from '@/features/auth/passwordRules';

interface PasswordChecklistProps {
  value: string;
}

export function PasswordChecklist({ value }: PasswordChecklistProps) {
  if (value === '') return null;

  return (
    <ul data-testid="password-checklist" className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule: PasswordRule) => {
        const met = rule.test(value);
        return (
          <li key={rule.key} className="flex items-center gap-2 text-sm">
            {met ? (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
