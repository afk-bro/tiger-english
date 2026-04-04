import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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
    expect(screen.getByText('authhome.study_groups.empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'authhome.study_groups.create' })).toBeInTheDocument();
  });

  it('disables Invite to Group when groups array is empty', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.getByRole('button', { name: 'authhome.study_groups.invite' })).toBeDisabled();
  });

  it('renders pending invites badge with correct count', () => {
    render(<StudyGroupsCard data={populatedData} isLoading={false} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides pending invites badge when count is 0', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.queryByTestId('pending-badge')).not.toBeInTheDocument();
  });

  it('renders group names and member counts in populated state', () => {
    render(<StudyGroupsCard data={populatedData} isLoading={false} />);
    expect(screen.getByText('English Beginners')).toBeInTheDocument();
    expect(screen.getByText('authhome.study_groups.members')).toBeInTheDocument();
  });
});
