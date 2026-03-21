// src/components/home/authenticated/InviteFriendsCard.tsx
import { toast } from "sonner";
import { Link } from "lucide-react";
import type { InviteFriendsData } from "./types";

interface Props {
  data: InviteFriendsData;
  isLoading: boolean;
}

export default function InviteFriendsCard({ data, isLoading }: Props) {
  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not available. Please copy the link manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(data.inviteUrl);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy link. Please copy it manually.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-primary-500" />
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Invite Friends</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Know someone who wants to learn English? Invite them to Tiger English.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Copy Invite Link
        </button>
        <button
          disabled
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Invite a Friend
        </button>
      </div>
    </div>
  );
}
