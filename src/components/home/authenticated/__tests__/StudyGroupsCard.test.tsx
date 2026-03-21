import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudyGroupsCard from '../StudyGroupsCard';
import type { StudyGroupsData } from '../types';

const emptyData: StudyGroupsData = { groups: [], pendingInviteCount: 0 };
const populatedData: StudyGroupsData = {
  groups: [{ id: 'g1', name: 'English Beginners', memberCount: 4 }],
  pendingInviteCount: 2,
};

describe('StudyGroupsCard', () => {
  it('renders skeleton when isLoading', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders empty state with Create Study Group CTA when groups is empty', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.getByText(/no study groups yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create study group/i })).toBeInTheDocument();
  });

  it('disables Invite to Group when groups array is empty', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.getByRole('button', { name: /invite to group/i })).toBeDisabled();
  });

  it('renders pending invites badge with correct count', () => {
    render(<StudyGroupsCard data={populatedData} isLoading={false} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides pending invites badge when count is 0', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.queryByTestId('pending-badge')).not.toBeInTheDocument();
  });
});
