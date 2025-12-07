import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('should initialize with no cursor and no previous pages', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.currentCursor).toBeUndefined();
    expect(result.current.hasNext(null)).toBe(false);
    expect(result.current.hasPrev).toBe(false);
  });

  it('should go to next page and update cursor', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goToNext('cursor-1');
    });

    expect(result.current.currentCursor).toBe('cursor-1');
    expect(result.current.hasPrev).toBe(false); // No previous cursor yet
  });

  it('should track previous cursors when going forward', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.goToNext('cursor-1');
    });

    act(() => {
      result.current.goToNext('cursor-2');
    });

    expect(result.current.currentCursor).toBe('cursor-2');
    expect(result.current.hasPrev).toBe(true); // Should have previous cursor
  });

  it('should go to previous page', () => {
    const { result } = renderHook(() => usePagination());

    // Go forward twice
    act(() => {
      result.current.goToNext('cursor-1');
    });

    act(() => {
      result.current.goToNext('cursor-2');
    });

    expect(result.current.currentCursor).toBe('cursor-2');
    expect(result.current.hasPrev).toBe(true);

    // Go back
    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentCursor).toBe('cursor-1');
    expect(result.current.hasPrev).toBe(false); // Back to first page
  });

  it('should correctly identify if next page exists', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.hasNext(null)).toBe(false);
    expect(result.current.hasNext('cursor-1')).toBe(true);
  });

  it('should reset pagination', () => {
    const { result } = renderHook(() => usePagination());

    // Navigate forward
    act(() => {
      result.current.goToNext('cursor-1');
    });

    act(() => {
      result.current.goToNext('cursor-2');
    });

    expect(result.current.currentCursor).toBe('cursor-2');
    expect(result.current.hasPrev).toBe(true);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.currentCursor).toBeUndefined();
    expect(result.current.hasPrev).toBe(false);
  });

  it('should handle multiple back navigations', () => {
    const { result } = renderHook(() => usePagination());

    // Navigate forward multiple times
    act(() => {
      result.current.goToNext('cursor-1');
    });

    act(() => {
      result.current.goToNext('cursor-2');
    });

    act(() => {
      result.current.goToNext('cursor-3');
    });

    expect(result.current.currentCursor).toBe('cursor-3');
    expect(result.current.hasPrev).toBe(true);

    // Go back twice
    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentCursor).toBe('cursor-2');
    expect(result.current.hasPrev).toBe(true);

    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentCursor).toBe('cursor-1');
    expect(result.current.hasPrev).toBe(false);
  });
});


