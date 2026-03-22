// src/pages/AuthHome.tsx
import ContinueStudyingCard from "@/components/home/authenticated/ContinueStudyingCard";
import RecommendedNextCard from "@/components/home/authenticated/RecommendedNextCard";
import InviteFriendsCard from "@/components/home/authenticated/InviteFriendsCard";
import StudyGroupsCard from "@/components/home/authenticated/StudyGroupsCard";
import {
  mockContinueStudying,
  mockRecommendedItems,
  mockInviteFriends,
  mockStudyGroups,
} from "@/mocks/authHome.mock";

export default function AuthHome() {
  return (
    <div className="max-w-5xl mx-auto space-y-4 pt-6">
      {/* Top row: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ContinueStudyingCard data={mockContinueStudying} isLoading={false} />
        </div>
        <div className="md:col-span-1">
          <RecommendedNextCard data={mockRecommendedItems} isLoading={false} />
        </div>
      </div>

      {/* Bottom row: 1/2 + 1/2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InviteFriendsCard data={mockInviteFriends} isLoading={false} />
        <StudyGroupsCard data={mockStudyGroups} isLoading={false} />
      </div>
    </div>
  );
}
