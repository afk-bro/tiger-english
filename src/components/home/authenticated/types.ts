// src/components/home/authenticated/types.ts

export interface ContinueStudyingData {
  setId: string;
  title: string;
  theme: string;
  reviewedCount: number;
  totalCards: number;
  lastStudiedAt: string;  // ISO 8601
  streak?: number;
  accuracy?: number;      // 0–100
}

export type ReasonType = 'review' | 'sequence' | 'related';

export interface RecommendedItem {
  setId: string;
  title: string;
  reasonType: ReasonType;
  reasonLabel?: string;
  priority: number;
}

export interface InviteFriendsData {
  inviteUrl: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface StudyGroupsData {
  groups: StudyGroup[];
  pendingInviteCount: number;
}
