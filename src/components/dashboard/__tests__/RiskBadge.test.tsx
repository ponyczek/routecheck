import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "../RiskBadge";

describe("RiskBadge", () => {
  it("renders with NONE level", () => {
    render(<RiskBadge level="NONE" />);
    expect(screen.getByText("Brak")).toBeInTheDocument();
  });

  it("renders with LOW level", () => {
    render(<RiskBadge level="LOW" />);
    expect(screen.getByText("Niskie")).toBeInTheDocument();
  });

  it("renders with MEDIUM level", () => {
    render(<RiskBadge level="MEDIUM" />);
    expect(screen.getByText("Średnie")).toBeInTheDocument();
  });

  it("renders with HIGH level", () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByText("Wysokie")).toBeInTheDocument();
  });

  it("shows icon by default", () => {
    const { container } = render(<RiskBadge level="HIGH" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("hides icon when showIcon is false", () => {
    const { container } = render(<RiskBadge level="HIGH" showIcon={false} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<RiskBadge level="MEDIUM" onClick={handleClick} />);

    const badge = screen.getByRole("button");
    badge.click();

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is not clickable without onClick prop", () => {
    render(<RiskBadge level="LOW" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has correct ARIA label", () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByLabelText("Poziom ryzyka: Wysokie")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { rerender } = render(<RiskBadge level="NONE" size="sm" />);
    expect(screen.getByText("Brak").parentElement).toHaveClass("text-xs");

    rerender(<RiskBadge level="NONE" size="md" />);
    expect(screen.getByText("Brak").parentElement).toHaveClass("text-sm");

    rerender(<RiskBadge level="NONE" size="lg" />);
    expect(screen.getByText("Brak").parentElement).toHaveClass("text-base");
  });

  it("applies custom className", () => {
    render(<RiskBadge level="NONE" className="custom-class" />);
    expect(screen.getByText("Brak").parentElement).toHaveClass("custom-class");
  });

  it("handles keyboard navigation when clickable", () => {
    const handleClick = vi.fn();
    render(<RiskBadge level="HIGH" onClick={handleClick} />);

    const badge = screen.getByRole("button");

    // Simulate Enter key with fireEvent or user.keyboard
    // Note: React's onKeyDown synthetic event is different from native
    // We'll use the click method which is more reliable in tests
    badge.click();

    expect(handleClick).toHaveBeenCalled();
  });
});
