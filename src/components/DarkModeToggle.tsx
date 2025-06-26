// src/components/DarkModeToggle.tsx
import useDarkMode from '../lib/useDarkMode';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="text-sm border px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {darkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
