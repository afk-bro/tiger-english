import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export interface ErrorGuidanceCardProps {
  errorType: 'email-registered' | 'username-taken' | 'general';
  message?: string;
  showLoginLink?: boolean;
}

export default function ErrorGuidanceCard({
  errorType,
  message,
  showLoginLink = false
}: ErrorGuidanceCardProps) {
  const { t } = useTranslation();

  const getGuidanceContent = () => {
    switch (errorType) {
      case 'email-registered':
        return {
          text: t('auth.errors.email_registered'),
          actionText: t('auth.errors.login_instead'),
          actionLink: "/login"
        };
      case 'username-taken':
        return {
          text: t('auth.errors.username_taken'),
          actionText: null,
          actionLink: null
        };
      case 'general':
      default:
        return {
          text: message || t('auth.errors.general'),
          actionText: null,
          actionLink: null
        };
    }
  };

  const guidance = getGuidanceContent();

  return (
    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
        {guidance.text}
      </p>
      {(showLoginLink || guidance.actionLink) && guidance.actionText && guidance.actionLink && (
        <Link
          to={guidance.actionLink}
          className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline"
        >
          {guidance.actionText}
        </Link>
      )}
    </div>
  );
}
