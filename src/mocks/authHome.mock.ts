// src/mocks/authHome.mock.ts
import { buildInviteUrl } from "@/lib/invite";
import type {
  ContinueStudyingData,
  RecommendedItem,
  InviteFriendsData,
  StudyGroupsData,
} from "@/components/home/authenticated/types";

export const mockContinueStudying: ContinueStudyingData = {
  setId: "set-001",
  title: "Travel Basics",
  theme: "Travel",
  reviewedCount: 18,
  totalCards: 30,
  lastStudiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  streak: 5,
  accuracy: 82,
};

export const mockRecommendedItems: RecommendedItem[] = [
  { setId: "set-002", title: "Airport Vocabulary", reasonType: "sequence", priority: 1 },
  { setId: "set-003", title: "Hotel Phrases", reasonType: "related", reasonLabel: "Because you studied Travel Basics", priority: 2 },
  { setId: "set-004", title: "Travel Basics — Weak Cards", reasonType: "review", priority: 3 },
];

export const mockInviteFriends: InviteFriendsData = {
  inviteUrl: buildInviteUrl("mock-user-id"),
};

export const mockStudyGroups: StudyGroupsData = {
  groups: [],
  pendingInviteCount: 0,
};
