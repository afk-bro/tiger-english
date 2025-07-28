import { jsx as _jsx } from "react/jsx-runtime";
export default function LogoutButton({ onLogout }) {
    return (_jsx("button", { onClick: onLogout, className: "fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium z-10", children: "Logout" }));
}
