// src/lib/invite.ts

/**
 * Builds a referral invite URL for sharing.
 * Swap point for a real endpoint when available.
 */
export function buildInviteUrl(userId: string): string {
  return `https://tiger-english.com/invite?ref=${encodeURIComponent(userId)}`;
}
