import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/i18n';
import './index.css'
import App from './App'
import { Toaster } from 'sonner';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster richColors position="top-center" />
    <App />
  </StrictMode>,
)
