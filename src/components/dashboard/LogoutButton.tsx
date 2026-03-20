// src/components/dashboard/LogoutButton.tsx

interface LogoutButtonProps {
  onLogout: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <button
      onClick={onLogout}
      className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium z-10"
    >
      Logout
    </button>
  );
}
