import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecommendedNextCard from '../RecommendedNextCard';
import type { RecommendedItem } from '../types';

const mockItems: RecommendedItem[] = [
  { setId: 's1', title: 'Airport Vocab', reasonType: 'sequence', priority: 1 },
  { setId: 's2', title: 'Hotel Phrases', reasonType: 'related', reasonLabel: 'Because you studied Travel Basics', priority: 2 },
  { setId: 's3', title: 'Weak Cards', reasonType: 'review', priority: 3 },
];

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <RecommendedNextCard data={mockItems} isLoading={false} {...props} />
    </MemoryRouter>
  );
}

describe('RecommendedNextCard', () => {
  it('renders skeleton when isLoading', () => {
    renderCard({ isLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders empty state when data is empty array', () => {
    renderCard({ data: [] });
    expect(screen.getByText(/complete a set/i)).toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    renderCard({ data: null });
    expect(screen.getByText(/complete a set/i)).toBeInTheDocument();
  });

  it('renders up to 3 items', () => {
    renderCard();
    expect(screen.getByText('Airport Vocab')).toBeInTheDocument();
    expect(screen.getByText('Hotel Phrases')).toBeInTheDocument();
    expect(screen.getByText('Weak Cards')).toBeInTheDocument();
  });

  it('shows reasonLabel when provided', () => {
    renderCard();
    expect(screen.getByText('Because you studied Travel Basics')).toBeInTheDocument();
  });

  it('falls back to default label for sequence when reasonLabel absent', () => {
    renderCard();
    expect(screen.getByText('Next in sequence')).toBeInTheDocument();
  });

  it('falls back to default label for review', () => {
    const reviewOnly: RecommendedItem[] = [{ setId: 'x', title: 'Test', reasonType: 'review', priority: 1 }];
    renderCard({ data: reviewOnly });
    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });
});
