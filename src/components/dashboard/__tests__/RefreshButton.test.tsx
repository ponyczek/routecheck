import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RefreshButton } from "../RefreshButton";

describe("RefreshButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders refresh button", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} />);
    
    expect(screen.getByRole("button", { name: /odśwież/i })).toBeInTheDocument();
  });

  it("shows Odśwież text on desktop", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} />);
    
    // Text is hidden on mobile with "hidden sm:inline"
    const text = screen.getByText("Odśwież");
    expect(text).toBeInTheDocument();
  });

  it("calls onRefresh when clicked", () => {
    const handleRefresh = vi.fn();
    render(<RefreshButton onRefresh={handleRefresh} isRefreshing={false} />);
    
    const button = screen.getByRole("button");
    button.click();
    
    expect(handleRefresh).toHaveBeenCalledOnce();
  });

  it("is disabled when isRefreshing is true", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={true} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} disabled={true} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("shows spinning icon when refreshing", () => {
    const { container } = render(<RefreshButton onRefresh={vi.fn()} isRefreshing={true} />);
    
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("does not show spinning icon when not refreshing", () => {
    const { container } = render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} />);
    
    const icon = container.querySelector("svg");
    expect(icon).not.toHaveClass("animate-spin");
  });

  it("implements debouncing - prevents multiple rapid clicks", () => {
    const handleRefresh = vi.fn();
    render(<RefreshButton onRefresh={handleRefresh} isRefreshing={false} />);
    
    const button = screen.getByRole("button");
    
    // First click should work
    act(() => {
      button.click();
    });
    expect(handleRefresh).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled(); // Button should be disabled during debounce
    
    // Subsequent clicks should be blocked (button is disabled)
    button.click();
    button.click();
    
    // Still only called once
    expect(handleRefresh).toHaveBeenCalledTimes(1);
    
    // After 2 seconds, button should be enabled again
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(button).not.toBeDisabled();
  });

  it("has correct aria-label", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} />);
    
    expect(screen.getByLabelText("Odśwież dane dashboardu")).toBeInTheDocument();
  });

  it("has correct title attribute", () => {
    render(<RefreshButton onRefresh={vi.fn()} isRefreshing={false} />);
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Odśwież dane");
  });
});

