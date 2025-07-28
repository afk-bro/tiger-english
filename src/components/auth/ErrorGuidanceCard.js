import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export default function ErrorGuidanceCard({ errorType, message, showLoginLink = false }) {
    const getGuidanceContent = () => {
        switch (errorType) {
            case 'email-registered':
                return {
                    text: "It looks like you already have an account with this email.",
                    actionText: "Log in instead →",
                    actionLink: "/login"
                };
            case 'username-taken':
                return {
                    text: "Please try a different username. You can use letters, numbers, and underscores.",
                    actionText: null,
                    actionLink: null
                };
            case 'general':
            default:
                return {
                    text: message || "Please check your information and try again.",
                    actionText: null,
                    actionLink: null
                };
        }
    };
    const guidance = getGuidanceContent();
    return (_jsxs("div", { className: "mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md", children: [_jsx("p", { className: "text-sm text-red-700 dark:text-red-300 mb-2", children: guidance.text }), (showLoginLink || guidance.actionLink) && guidance.actionText && guidance.actionLink && (_jsx(Link, { to: guidance.actionLink, className: "inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline", children: guidance.actionText }))] }));
}
