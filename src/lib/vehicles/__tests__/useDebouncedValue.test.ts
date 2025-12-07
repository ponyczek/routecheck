import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "../useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: "initial", delay: 300 },
    });

    expect(result.current).toBe("initial");

    // Change value
    act(() => {
      rerender({ value: "updated", delay: 300 });
    });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("initial");

    // Fast-forward to 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");
  });

  it("should use custom delay", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    act(() => {
      rerender({ value: "updated", delay: 500 });
    });

    // Fast-forward by 499ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe("initial");

    // Fast-forward to 500ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");
  });

  it("should cancel previous timer when value changes quickly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "initial" },
    });

    // Change value multiple times quickly
    act(() => {
      rerender({ value: "first" });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      rerender({ value: "second" });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      rerender({ value: "third" });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Value should still be initial
    expect(result.current).toBe("initial");

    // Fast-forward to complete delay from last change
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("third");
  });

  it("should handle number values", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 0 },
    });

    act(() => {
      rerender({ value: 100 });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(100);
  });

  it("should handle boolean values", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: false },
    });

    act(() => {
      rerender({ value: true });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(true);
  });
});
