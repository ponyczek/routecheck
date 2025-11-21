import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../MetricCard";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Test Metric" value={42} />);
    
    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats large numbers with locale", () => {
    render(<MetricCard title="Large Number" value={1234567} />);
    
    // Polish locale formats as "1 234 567"
    expect(screen.getByText(/1.*234.*567/)).toBeInTheDocument();
  });

  it("renders with optional description", () => {
    render(<MetricCard title="Test" value={10} description="This is a description" />);
    
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(<MetricCard title="Test" value={10} />);
    
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(<MetricCard title="Test" value={5} icon={<TestIcon />} />);
    
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<MetricCard title="Test" value={10} isLoading={true} />);
    
    // Should show Skeleton components, not the actual value
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked and onClick is provided", () => {
    const handleClick = vi.fn();
    render(<MetricCard title="Clickable" value={5} onClick={handleClick} />);
    
    const card = screen.getByRole("button");
    card.click();
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is not clickable without onClick prop", () => {
    render(<MetricCard title="Not Clickable" value={5} />);
    
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("applies accent variant styling", () => {
    const { container } = render(<MetricCard title="Test" value={10} variant="accent" />);
    
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass("border-primary/20");
  });

  it("applies default variant styling", () => {
    const { container } = render(<MetricCard title="Test" value={10} variant="default" />);
    
    const card = container.querySelector('[data-slot="card"]');
    expect(card).not.toHaveClass("border-primary/20");
  });

  it("has aria-label when clickable", () => {
    render(<MetricCard title="Oczekujące" value={5} onClick={vi.fn()} />);
    
    expect(screen.getByLabelText(/Oczekujące: 5.*szczegóły/i)).toBeInTheDocument();
  });

  it("has aria-live for value", () => {
    render(<MetricCard title="Test" value={100} />);
    
    const valueElement = screen.getByText("100");
    expect(valueElement).toHaveAttribute("aria-live", "polite");
  });
});

