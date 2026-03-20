import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlashcardNavigation } from '../useFlashcardNavigation';

describe('useFlashcardNavigation', () => {
  it('starts at index 0', () => {
    const { result } = renderHook(() => useFlashcardNavigation(5, 'set-a'));
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('advances and wraps on goToNext', () => {
    const { result } = renderHook(() => useFlashcardNavigation(3, 'set-a'));
    act(() => result.current.goToNext());
    expect(result.current.currentCardIndex).toBe(1);
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    // wrapped back to 0
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('resets to 0 when resetKey changes even if cardCount stays the same', () => {
    let setId = 'set-a';
    const { result, rerender } = renderHook(() => useFlashcardNavigation(9, setId));
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.currentCardIndex).toBe(2);

    setId = 'set-b';
    rerender();
    expect(result.current.currentCardIndex).toBe(0);
  });
});
