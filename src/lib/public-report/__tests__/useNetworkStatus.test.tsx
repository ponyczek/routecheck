import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

describe("useNetworkStatus", () => {
  let onlineListeners: (() => void)[] = [];
  let offlineListeners: (() => void)[] = [];

  beforeEach(() => {
    onlineListeners = [];
    offlineListeners = [];

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock window.addEventListener
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "online") {
        onlineListeners.push(handler as () => void);
      } else if (event === "offline") {
        offlineListeners.push(handler as () => void);
      }
    });

    vi.spyOn(window, "removeEventListener").mockImplementation((event, handler) => {
      if (event === "online") {
        onlineListeners = onlineListeners.filter((l) => l !== handler);
      } else if (event === "offline") {
        offlineListeners = offlineListeners.filter((l) => l !== handler);
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when online", () => {
    Object.defineProperty(navigator, "onLine", { value: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(true);
  });

  it("should return false when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(false);
  });

  it("should update to false when going offline", () => {
    Object.defineProperty(navigator, "onLine", { value: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(true);

    // Simulate going offline
    act(() => {
      offlineListeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(false);
  });

  it("should update to true when coming online", () => {
    Object.defineProperty(navigator, "onLine", { value: false });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(false);

    // Simulate coming online
    act(() => {
      onlineListeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(true);
  });

  it("should register event listeners", () => {
    renderHook(() => useNetworkStatus());

    expect(window.addEventListener).toHaveBeenCalledWith("online", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("should cleanup event listeners on unmount", () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith("online", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
