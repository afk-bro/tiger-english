import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from './Header';
import Footer from './Footer';
export default function Layout({ children }) {
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-base-light text-text-light dark:bg-base-dark dark:text-text-dark transition-colors duration-300 font-sans", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1", children: children }), _jsx(Footer, {})] }));
}
