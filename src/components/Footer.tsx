// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-6 bg-base-light dark:bg-base-dark border-t border-gray-200 dark:border-gray-700 font-sans">
      © {new Date().getFullYear()} Tiger English — All rights reserved.
    </footer>
  );
}
