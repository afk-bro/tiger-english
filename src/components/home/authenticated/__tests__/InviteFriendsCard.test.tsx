import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';

import InviteFriendsCard from '../InviteFriendsCard';

const mockData = { inviteUrl: 'https://tiger-english.com/invite?ref=user-1' };

beforeEach(() => { vi.clearAllMocks(); });

describe('InviteFriendsCard', () => {
  it('renders skeleton when isLoading', () => {
    render(<InviteFriendsCard data={mockData} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the invite URL on copy click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(mockData.inviteUrl));
  });

  it('shows success toast on successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Invite link copied!'));
  });

  it('shows error toast when clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to copy link. Please copy it manually.'));
  });

  it('shows error toast when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Clipboard not available. Please copy the link manually.'));
  });
});
