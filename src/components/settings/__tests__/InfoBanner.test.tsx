import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoBanner } from "../InfoBanner";

describe("InfoBanner", () => {
  describe("rendering", () => {
    it("renders description", () => {
      render(<InfoBanner description="Test description" />);

      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(<InfoBanner title="Test Title" description="Test description" />);

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("does not render title when not provided", () => {
      const { container } = render(<InfoBanner description="Test description" />);

      // Title should not be present
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).not.toBeInTheDocument();
    });

    it("renders with default variant", () => {
      const { container } = render(<InfoBanner description="Test" />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it("renders with destructive variant", () => {
      const { container } = render(<InfoBanner description="Test" variant="destructive" />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("renders info icon", () => {
      const { container } = render(<InfoBanner description="Test" />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("h-4");
      expect(icon).toHaveClass("w-4");
    });
  });

  describe("accessibility", () => {
    it("has role alert", () => {
      render(<InfoBanner description="Test" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles very long description", () => {
      const longDescription = "Very Long Description ".repeat(50);
      render(<InfoBanner description={longDescription} />);

      const description = screen.getByText(/Very Long Description/);
      expect(description).toBeInTheDocument();
    });

    it("handles special characters in description", () => {
      const specialDescription = "Alert & <Special> \"Chars\" 'Test'";
      render(<InfoBanner description={specialDescription} />);

      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });

    it("handles unicode characters", () => {
      const unicodeDescription = "Ostrzeżenie: Śląsk Łódź Żywiec";
      render(<InfoBanner description={unicodeDescription} />);

      expect(screen.getByText(unicodeDescription)).toBeInTheDocument();
    });

    it("handles multiline description", () => {
      const multilineDesc = "Line 1\nLine 2\nLine 3";
      render(<InfoBanner description={multilineDesc} />);

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });
});
