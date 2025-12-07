import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TelemetryMetricCard } from "../TelemetryMetricCard";

describe("TelemetryMetricCard", () => {
  describe("rendering", () => {
    it("renders label and value", () => {
      render(<TelemetryMetricCard label="Test Metric" value={42} />);

      expect(screen.getByText("Test Metric")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders value as string", () => {
      render(<TelemetryMetricCard label="Test" value="85" />);

      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("renders unit when provided", () => {
      render(<TelemetryMetricCard label="Duration" value={85} unit="s" />);

      expect(screen.getByText(/85/)).toBeInTheDocument();
      expect(screen.getByText(/s/)).toBeInTheDocument();
    });

    it("renders without unit when not provided", () => {
      const { container } = render(<TelemetryMetricCard label="Count" value={142} />);

      expect(screen.getByText("142")).toBeInTheDocument();
      // Unit element should not be present
      const unitSpan = container.querySelector(".text-xl.ml-1");
      expect(unitSpan).not.toBeInTheDocument();
    });

    it("renders trend badge when provided", () => {
      render(
        <TelemetryMetricCard
          label="Metric"
          value={100}
          trend={{ direction: "up", value: "5%" }}
        />
      );

      expect(screen.getByText("5%")).toBeInTheDocument();
    });

    it("renders without trend badge when not provided", () => {
      render(<TelemetryMetricCard label="Metric" value={100} />);

      const badge = screen.queryByText(/↑|↓/);
      expect(badge).not.toBeInTheDocument();
    });

    it("renders up arrow for positive trend", () => {
      const { container } = render(
        <TelemetryMetricCard
          label="Metric"
          value={100}
          trend={{ direction: "up", value: "10%" }}
        />
      );

      // Check for arrow-up icon (lucide-react uses data-lucide attribute)
      const icon = container.querySelector('[data-slot="badge"] svg');
      expect(icon).toBeInTheDocument();
    });

    it("renders down arrow for negative trend", () => {
      const { container } = render(
        <TelemetryMetricCard
          label="Metric"
          value={100}
          trend={{ direction: "down", value: "5%" }}
        />
      );

      const icon = container.querySelector('[data-slot="badge"] svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies correct text styles to label", () => {
      render(<TelemetryMetricCard label="Test Label" value={42} />);

      const label = screen.getByText("Test Label");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-medium");
      expect(label).toHaveClass("text-muted-foreground");
    });

    it("applies correct text styles to value", () => {
      render(<TelemetryMetricCard label="Test" value={123} />);

      const value = screen.getByText("123");
      expect(value).toHaveClass("text-3xl");
      expect(value).toHaveClass("font-bold");
    });

    it("applies custom className when provided", () => {
      const { container } = render(
        <TelemetryMetricCard label="Test" value={42} className="custom-class" />
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("edge cases", () => {
    it("handles zero value", () => {
      render(<TelemetryMetricCard label="Zero" value={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles negative value", () => {
      render(<TelemetryMetricCard label="Negative" value={-10} />);

      expect(screen.getByText("-10")).toBeInTheDocument();
    });

    it("handles very large value", () => {
      render(<TelemetryMetricCard label="Large" value={999999} />);

      expect(screen.getByText("999999")).toBeInTheDocument();
    });

    it("handles decimal value", () => {
      render(<TelemetryMetricCard label="Decimal" value={3.14} />);

      expect(screen.getByText("3.14")).toBeInTheDocument();
    });

    it("handles empty string value", () => {
      render(<TelemetryMetricCard label="Empty" value="" />);

      expect(screen.getByText("Empty")).toBeInTheDocument();
    });

    it("handles very long label", () => {
      const longLabel = "Very Long Label Text ".repeat(10);
      render(<TelemetryMetricCard label={longLabel} value={42} />);

      expect(screen.getByText(/Very Long Label Text/)).toBeInTheDocument();
    });

    it("handles special characters in unit", () => {
      render(<TelemetryMetricCard label="Test" value={100} unit="ms²" />);

      expect(screen.getByText(/ms²/)).toBeInTheDocument();
    });
  });

  describe("combinations", () => {
    it("renders with all props", () => {
      const { container } = render(
        <TelemetryMetricCard
          label="Complete Metric"
          value={85}
          unit="s"
          trend={{ direction: "down", value: "5s" }}
          className="test-class"
        />
      );

      expect(screen.getByText("Complete Metric")).toBeInTheDocument();
      expect(screen.getByText(/85/)).toBeInTheDocument();
      expect(screen.getByText("5s")).toBeInTheDocument();
      
      // Check that unit is rendered
      const unitElement = container.querySelector(".text-xl.ml-1");
      expect(unitElement).toBeInTheDocument();
      expect(unitElement).toHaveTextContent("s");
    });

    it("renders with only required props", () => {
      render(<TelemetryMetricCard label="Minimal" value={42} />);

      expect(screen.getByText("Minimal")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });
});

