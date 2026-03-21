// src/components/home/authenticated/StudyGroupsCard.tsx
import { Users } from "lucide-react";
import type { StudyGroupsData } from "./types";

interface Props {
  data: StudyGroupsData;
  isLoading: boolean;
}

export default function StudyGroupsCard({ data, isLoading }: Props) {
  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const hasGroups = data.groups.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Study Groups</h2>
        </div>
        {data.pendingInviteCount > 0 && (
          <span
            data-testid="pending-badge"
            className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium"
          >
            {data.pendingInviteCount}
          </span>
        )}
      </div>

      {!hasGroups && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No study groups yet. Create one to study with friends.
        </p>
      )}

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Create Study Group
        </button>
        <button
          disabled={!hasGroups}
          className={[
            "px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
            hasGroups
              ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed",
          ].join(" ")}
        >
          Invite to Group
        </button>
      </div>
    </div>
  );
}
