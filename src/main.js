import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
createRoot(document.getElementById('root')).render(_jsxs(StrictMode, { children: [_jsx(Toaster, { richColors: true, position: "top-center" }), _jsx(App, {})] }));
